import django.utils.timezone as tz
import uuid
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend

from apps.accounts.permissions import IsVendeur, IsOwner
from .models import Property, VisitRequest
from .serializers import (
    PropertyListSerializer,
    PropertyDetailSerializer,
    PropertyCreateUpdateSerializer,
    PropertyVerificationSerializer,
    PropertyAdminListSerializer,
    PropertyAdminDetailSerializer,
    VisitRequestSerializer,
    EstimateInputSerializer,
    EstimateOutputSerializer,
)
from .filters import PropertyFilter, validate_and_sanitize_params, validate_numeric_ranges
from .cache import (
    get_cached,
    set_cached,
    get_property_list_cache_key,
    get_featured_cache_key,
    get_cities_cache_key,
    get_regions_cache_key,
    get_map_pins_cache_key,
    get_my_properties_cache_key,
    invalidate_property_cache,
    invalidate_all_properties_cache,
    invalidate_my_properties_cache,
    CACHE_TTL_PROPERTY_LIST,
    CACHE_TTL_FEATURED,
    CACHE_TTL_CITIES_REGIONS,
    CACHE_TTL_MAP_PINS,
    CACHE_TTL_MY_PROPERTIES,
    check_rate_limit,
    get_client_ip,
)


@method_decorator(ratelimit(key="ip", rate="30/m", method="GET"), name="list")
@method_decorator(ratelimit(key="ip", rate="10/m", method="POST"), name="create")
class PropertyViewSet(viewsets.ModelViewSet):
    """
    CRUD for properties with multi-criteria search.
    List/Retrieve: Public (verified only). Create: Vendeurs. Update/Delete: Owner.
    """

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PropertyFilter
    search_fields = ["title", "description", "city", "region", "address"]
    ordering_fields = ["price", "created_at", "area_sqm", "bedrooms"]
    ordering = ["-created_at"]
    lookup_field = "id"

    def get_queryset(self):
        from django.db.models import Prefetch
        from .models import PropertyImage

        # Prefetch images but defer the massive image_data blob
        image_prefetch = Prefetch(
            "images",
            queryset=PropertyImage.objects.defer("image_data").order_by("order", "created_at")
        )
        
        qs = Property.objects.select_related("agent").prefetch_related(image_prefetch).defer("agent__avatar")
        
        public_listing = ["list", "featured", "cities", "regions", "map_pins"]
        if self.action in public_listing:
            qs = qs.filter(verification_status="approved", is_published=True)
        elif self.action == "retrieve":
            qs = qs.filter(verification_status="approved")
        elif self.action in ("update", "partial_update") and self.request.user.is_authenticated:
            qs = qs.filter(agent=self.request.user)
        elif self.action == "my_properties" and self.request.user.is_authenticated:
            if self.request.user.role != "admin":
                qs = qs.filter(agent=self.request.user)
            
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return PropertyListSerializer
        if self.action in ("create", "update", "partial_update"):
            return PropertyCreateUpdateSerializer
        if self.action == "pending_verification":
            return PropertyAdminListSerializer
        if self.action == "verify_property":
            return PropertyVerificationSerializer
        return PropertyDetailSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve", "featured", "cities", "regions", "map_pins", "booked_dates"):
            return [permissions.AllowAny()]
        if self.action == "create":
            return [permissions.IsAuthenticated(), IsVendeur()]
        return [permissions.IsAuthenticated(), IsOwner()]

    def _check_redis_rate_limit(self, request, limit: int = 60, window: int = 60) -> tuple:
        ip = get_client_ip(request)
        allowed, remaining = check_rate_limit(ip, limit, window)
        if not allowed:
            return False, {
                "error": "Rate limit exceeded. Please try again later.",
                "retry_after": window,
            }
        return True, None

    def list(self, request, *args, **kwargs):
        allowed, error = self._check_redis_rate_limit(request, 60, 60)
        if not allowed:
            return Response(error, status=status.HTTP_429_TOO_MANY_REQUESTS)
        sanitized_params = validate_and_sanitize_params(request.query_params)
        validated_filters = validate_numeric_ranges(sanitized_params)
        page = int(request.query_params.get("page", 1))
        cache_key = get_property_list_cache_key(validated_filters, page)
        cached_data = get_cached(cache_key)
        if cached_data is not None:
            return Response(cached_data)
        queryset = self.filter_queryset(self.get_queryset())
        page_obj = self.paginate_queryset(queryset)
        if page_obj is not None:
            serializer = PropertyListSerializer(page_obj, many=True, context=self.get_serializer_context())
            response = self.get_paginated_response(serializer.data)
            set_cached(cache_key, response.data, CACHE_TTL_PROPERTY_LIST, "properties:list")
            return response
        serializer = PropertyListSerializer(queryset, many=True, context=self.get_serializer_context())
        set_cached(cache_key, serializer.data, CACHE_TTL_PROPERTY_LIST, "properties:list")
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(agent=self.request.user)
        invalidate_all_properties_cache()

    def perform_update(self, serializer):
        serializer.save()
        invalidate_all_properties_cache()

    def perform_destroy(self, instance):
        instance.delete()
        invalidate_all_properties_cache()

    @action(detail=False, methods=["get"], url_path="featured")
    def featured(self, request):
        cache_key = get_featured_cache_key()
        cached_data = get_cached(cache_key)
        if cached_data is not None:
            return Response(cached_data)
        
        # 1. Try to get properties explicitly marked as featured
        qs = self.get_queryset().filter(is_featured=True, verification_status="approved")[:12]
        
        # 2. Fallback to recent approved properties if no featured ones exist
        # This prevents the home page from looking empty
        if not qs.exists():
            qs = self.get_queryset().filter(verification_status="approved")[:12]
            
        serializer = PropertyListSerializer(qs, many=True, context=self.get_serializer_context())
        set_cached(cache_key, serializer.data, CACHE_TTL_FEATURED, "properties:featured")
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="booked-dates")
    def booked_dates(self, request, id=None):
        property_obj = self.get_object()
        booked = VisitRequest.objects.filter(
            related_property=property_obj,
            status__in=["confirmed"],
        ).values_list("scheduled_date", flat=True)
        slots = []
        for b in booked:
            date_str = b.strftime("%Y-%m-%d")
            time_str = b.strftime("%H:%M")
            slots.append({"date": date_str, "time": time_str})
        return Response(slots)

    @action(detail=False, methods=["get"], url_path="cities")
    def cities(self, request):
        cache_key = get_cities_cache_key()
        cached_data = get_cached(cache_key)
        if cached_data is not None:
            return Response(cached_data)
        cities = (
            Property.objects.filter(verification_status="approved")
            .values_list("city", flat=True)
            .distinct()
            .order_by("city")
        )
        data = list(cities)
        set_cached(cache_key, data, CACHE_TTL_CITIES_REGIONS, "properties:cities")
        return Response(data)

    @action(detail=False, methods=["get"], url_path="regions")
    def regions(self, request):
        cache_key = get_regions_cache_key()
        cached_data = get_cached(cache_key)
        if cached_data is not None:
            return Response(cached_data)
        regions = (
            Property.objects.filter(verification_status="approved")
            .values_list("region", flat=True)
            .distinct()
            .order_by("region")
        )
        data = list(regions)
        set_cached(cache_key, data, CACHE_TTL_CITIES_REGIONS, "properties:regions")
        return Response(data)

    @action(
        detail=False,
        methods=["get"],
        url_path="my-properties",
        permission_classes=[permissions.IsAuthenticated],
    )
    def my_properties(self, request):
        user_id = str(request.user.id)
        sanitized_params = validate_and_sanitize_params(request.query_params)
        validated_filters = validate_numeric_ranges(sanitized_params)
        page = int(request.query_params.get("page", 1))
        cache_key = get_my_properties_cache_key(user_id, validated_filters, page)
        cached_data = get_cached(cache_key)
        if cached_data is not None:
            return Response(cached_data)
        qs = self.filter_queryset(self.get_queryset())
        page_obj = self.paginate_queryset(qs)
        if page_obj is not None:
            serializer = PropertyListSerializer(page_obj, many=True, context=self.get_serializer_context())
            response = self.get_paginated_response(serializer.data)
            set_cached(cache_key, response.data, CACHE_TTL_MY_PROPERTIES, "properties:my")
            return response
        serializer = PropertyListSerializer(qs, many=True, context=self.get_serializer_context())
        set_cached(cache_key, serializer.data, CACHE_TTL_MY_PROPERTIES, "properties:my")
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="map-pins")
    def map_pins(self, request):
        sanitized_params = validate_and_sanitize_params(request.query_params)
        validated_filters = validate_numeric_ranges(sanitized_params)
        cache_key = get_map_pins_cache_key(validated_filters)
        cached_data = get_cached(cache_key)
        if cached_data is not None:
            return Response(cached_data)
        qs = self.filter_queryset(
            self.get_queryset().filter(
                latitude__isnull=False,
                longitude__isnull=False,
            )
        )
        serializer = PropertyListSerializer(qs, many=True, context=self.get_serializer_context())
        data = serializer.data
        set_cached(cache_key, data, CACHE_TTL_MAP_PINS, "properties:map")
        return Response(data)


class PropertyPendingVerificationView(APIView):
    """Admin endpoint to list all properties pending verification."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != "admin":
            return Response({"error": "Réservé aux administrateurs."}, status=status.HTTP_403_FORBIDDEN)

        try:
            status_filter = request.query_params.get("status", "pending")
            if status_filter not in ["pending", "approved", "rejected", "all"]:
                status_filter = "pending"

            qs = Property.objects.select_related("agent", "reviewed_by")
            if status_filter != "all":
                qs = qs.filter(verification_status=status_filter)
                
            # Log the query for debugging
            print(f"Property query: status_filter={status_filter}, count={qs.count()}")
            
            page = int(request.query_params.get("page", 1))
            page_size = min(int(request.query_params.get("page_size", 20)), 100)  # Cap at 100
            start = (page - 1) * page_size
            end = start + page_size

            # Fix pagination issue - ensure we're not going beyond available records
            total = qs.count()
            if total > 0:
                # Adjust end to not exceed total
                end = min(end, total)
                start = min(start, total)
                properties = qs[start:end] if total > 0 else []
            else:
                properties = []

            serializer = PropertyAdminListSerializer(properties, many=True)
            return Response({
                "count": total,
                "results": serializer.data,
                "page": page,
                "page_size": page_size,
            })
        except Exception as e:
            return Response({"error": f"Erreur lors de la récupération des biens: {str(e)}"}, 
                           status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({"error": f"Erreur lors de la récupération des biens: {str(e)}"}, 
                           status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PropertyVerifyView(APIView):
    """Admin endpoint to approve or reject a property."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        if request.user.role != "admin":
            return Response({"error": "Réservé aux administrateurs."}, status=status.HTTP_403_FORBIDDEN)

        # Validate that pk is a valid UUID
        try:
            property_uuid = uuid.UUID(str(pk))
            print(f"Valid UUID received: {property_uuid}")
        except ValueError:
            return Response({"error": "ID de bien invalide."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Check if property exists
            from django.db.models import Prefetch
            from .models import PropertyImage
            
            image_prefetch = Prefetch(
                "images",
                queryset=PropertyImage.objects.defer("image_data").order_by("order", "created_at")
            )
            
            property_obj = Property.objects.select_related("agent", "reviewed_by").prefetch_related(image_prefetch).get(pk=property_uuid)
            print(f"Property found: {property_obj.id}")
        except Property.DoesNotExist:
            print(f"Property with ID {pk} not found in database")
            return Response({"error": "Bien non trouvé."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error retrieving property {pk}: {str(e)}")
            return Response({"error": f"Erreur lors de la récupération du bien: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        serializer = PropertyAdminDetailSerializer(property_obj)
        return Response(serializer.data)

    def patch(self, request, pk):
        if request.user.role != "admin":
            return Response({"error": "Réservé aux administrateurs."}, status=status.HTTP_403_FORBIDDEN)

        # Validate that pk is a valid UUID
        try:
            uuid.UUID(str(pk))
        except ValueError:
            return Response({"error": "ID invalide"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            property_obj = Property.objects.get(pk=pk)
        except Property.DoesNotExist:
            return Response({"error": "Bien non trouvé."}, status=status.HTTP_404_NOT_FOUND)
        except Exception:
            return Response({"error": "Erreur lors de la récupération du bien."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        serializer = PropertyVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data["action"]
        rejection_reason = serializer.validated_data.get("rejection_reason", "")

        if action == "approve":
            property_obj.verification_status = Property.VerificationStatus.APPROVED
            property_obj.is_verified = True
            property_obj.is_published = True
            property_obj.rejection_reason = ""
        else:
            property_obj.verification_status = Property.VerificationStatus.REJECTED
            property_obj.is_verified = False
            property_obj.is_published = False
            property_obj.rejection_reason = rejection_reason

        property_obj.reviewed_by = request.user
        property_obj.reviewed_at = tz.now()
        property_obj.save()

        invalidate_all_properties_cache()
        invalidate_my_properties_cache(str(property_obj.agent.id))

        return Response({
            "message": f"Bien {'approuvé' if action == 'approve' else 'rejeté'} avec succès.",
            "verification_status": property_obj.verification_status,
            "is_published": property_obj.is_published,
        })


class VisitRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            property_obj = Property.objects.get(pk=pk)
        except Property.DoesNotExist:
            return Response({"error": "Bien non trouvé."}, status=status.HTTP_404_NOT_FOUND)

        if property_obj.verification_status != Property.VerificationStatus.APPROVED:
            return Response({"error": "Vous ne pouvez pas demander une visite pour ce bien."}, status=status.HTTP_400_BAD_REQUEST)

        if property_obj.status in ["sold", "rented"]:
            return Response({"error": "Ce bien n'est plus disponible."}, status=status.HTTP_400_BAD_REQUEST)

        scheduled_date = request.data.get("scheduled_date")
        if not scheduled_date:
            return Response({"error": "La date est requise."}, status=status.HTTP_400_BAD_REQUEST)

        from datetime import datetime
        try:
            parsed_date = datetime.fromisoformat(scheduled_date.replace("Z", "+00:00")).date()
        except (ValueError, TypeError):
            return Response({"error": "Format de date invalide."}, status=status.HTTP_400_BAD_REQUEST)

        existing = VisitRequest.objects.filter(
            related_property=property_obj,
            client=request.user,
            scheduled_date__date=parsed_date,
            status__in=["pending", "confirmed"],
        ).exists()

        if existing:
            return Response(
                {"error": "Vous avez déjà une demande de visite pour ce créneau."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = VisitRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        visit = serializer.save(related_property=property_obj, client=request.user)
        return Response(VisitRequestSerializer(visit).data, status=status.HTTP_201_CREATED)

    def get(self, request, pk):
        try:
            property_obj = Property.objects.get(pk=pk)
        except Property.DoesNotExist:
            return Response({"error": "Bien non trouvé."}, status=status.HTTP_404_NOT_FOUND)

        visits = property_obj.visit_requests.all()
        serializer = VisitRequestSerializer(visits, many=True)
        return Response(serializer.data)


class MyVisitRequestsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == "admin":
            visits = VisitRequest.objects.all()
        elif user.role == "vendeur":
            my_properties = Property.objects.filter(agent=user)
            visits = VisitRequest.objects.filter(related_property__in=my_properties)
        else:
            visits = VisitRequest.objects.filter(client=user)
        
        serializer = VisitRequestSerializer(visits, many=True)
        return Response(serializer.data)

    def patch(self, request):
        visit_id = request.data.get("id")
        new_status = request.data.get("status")

        if new_status not in ["confirmed", "cancelled", "completed", "rejected"]:
            return Response({"error": "Statut invalide."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            visit = VisitRequest.objects.get(id=visit_id)
        except VisitRequest.DoesNotExist:
            return Response({"error": "Demande non trouvée."}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        is_agent = visit.related_property.agent == user
        is_client = visit.client == user

        if is_agent:
            VisitRequest.objects.filter(id=visit_id).update(
                status=new_status, updated_at=tz.now()
            )
        elif is_client and new_status == "cancelled" and visit.status == "pending":
            VisitRequest.objects.filter(id=visit_id).update(
                status=new_status, updated_at=tz.now()
            )
        else:
            return Response({"error": "Action non autorisée."}, status=status.HTTP_403_FORBIDDEN)

        visit.refresh_from_db()
        serializer = VisitRequestSerializer(visit)
        return Response(serializer.data)


class SoldPropertiesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from apps.contracts.models import Contract
        user = request.user
        if user.role == "vendeur" or user.role == "admin":
            sold = Property.objects.filter(
                status="sold",
                agent=user if user.role != "admin" else None,
            ).select_related("agent")
            if user.role == "admin":
                sold = Property.objects.filter(status="sold").select_related("agent")
        else:
            sold_ids = Contract.objects.filter(
                acquereur=user, status="completed"
            ).values_list("property_id", flat=True)
            sold = Property.objects.filter(id__in=sold_ids)

        from .serializers import PropertyListSerializer
        serializer = PropertyListSerializer(sold, many=True)
        return Response(serializer.data)


class ConsultingRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ConsultingRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        visit = serializer.save(client=request.user)
        return Response(ConsultingRequestSerializer(visit).data, status=status.HTTP_201_CREATED)

    def get(self, request):
        user = request.user
        if user.role == "admin":
            visits = ConsultingRequest.objects.all()
        elif user.role == "vendeur":
            from apps.properties.models import Property
            my_properties = Property.objects.filter(agent=user, consulting_enabled=True)
            visits = ConsultingRequest.objects.filter(property__in=my_properties)
        else:
            visits = ConsultingRequest.objects.filter(client=user)
        
        serializer = ConsultingRequestSerializer(visits, many=True)
        return Response(serializer.data)

    def patch(self, request):
        visit_id = request.data.get("id")
        new_status = request.data.get("status")
        
        try:
            visit = ConsultingRequest.objects.get(id=visit_id)
        except ConsultingRequest.DoesNotExist:
            return Response({"error": "Demande non trouvée."}, status=status.HTTP_404_NOT_FOUND)

        if new_status in ["confirmed", "in_progress", "completed", "cancelled"]:
            visit.status = new_status
            if request.data.get("admin_response"):
                visit.admin_response = request.data.get("admin_response")
            visit.save()
            serializer = ConsultingRequestSerializer(visit)
            return Response(serializer.data)
        
        return Response({"error": "Statut invalide."}, status=status.HTTP_400_BAD_REQUEST)


class PropertyEstimateView(APIView):
    """
    Public endpoint: estimates price per m² via OpenRouter AI.
    Accepts ville, quartier, type_de_bien → returns prix_m2_moyen + fourchette.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def _get_real_properties_context(self, ville: str, quartier: str, type_de_bien: str) -> tuple:
        from .models import Property

        qs = Property.objects.filter(
            verification_status="approved",
            city__iexact=ville,
        ).exclude(price__isnull=True).exclude(area_sqm__isnull=True).exclude(area_sqm=0)

        if type_de_bien == "appartement":
            qs = qs.filter(property_type__in=["apartment", "appartement"])
        elif type_de_bien == "maison":
            qs = qs.filter(property_type__in=["house", "maison"])
        elif type_de_bien == "villa":
            qs = qs.filter(property_type__in=["villa"])
        elif type_de_bien == "riad":
            qs = qs.filter(property_type__in=["riad"])
        elif type_de_bien == "studio":
            qs = qs.filter(property_type__in=["studio"])

        qs = qs[:20]

        if not qs.exists():
            return [], 0

        rows = []
        for p in qs:
            area = float(p.area_sqm or 1)
            price_m2 = float(p.price) / area
            rows.append({
                "prix": float(p.price),
                "surface": area,
                "prix_m2": round(price_m2, 0),
                "quartier": p.neighborhood or p.city or "",
                "annee_annonce": str(p.created_at.year) if p.created_at else "N/A",
            })

        return rows, len(rows)

    def _web_search(self, query: str, max_results: int = 5) -> list[dict]:
        import json
        import urllib.request
        import urllib.error

        results = []

        # 1. Try DuckDuckGo (free) - fast fail
        try:
            from duckduckgo_search import DDGS
            with DDGS(timeout=4) as ddgs:
                for i, r in enumerate(ddgs.text(query, max_results=max_results)):
                    results.append({
                        "title": r.get("title", ""),
                        "snippet": r.get("body", ""),
                        "url": r.get("href", ""),
                        "source": "DuckDuckGo",
                    })
            if results:
                return results
        except Exception:
            pass

        # 2. Fallback to Tavily
        from django.conf import settings
        tavily_key = settings.TAVILY_API_KEY
        if tavily_key:
            try:
                payload = json.dumps({
                    "api_key": tavily_key,
                    "query": query,
                    "max_results": max_results,
                }).encode("utf-8")
                req = urllib.request.Request(
                    "https://api.tavily.com/search",
                    data=payload,
                    headers={"Content-Type": "application/json"},
                    method="POST",
                )
                with urllib.request.urlopen(req, timeout=6) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                for r in data.get("results", []):
                    results.append({
                        "title": r.get("title", ""),
                        "snippet": r.get("content", ""),
                        "url": r.get("url", ""),
                        "source": "Tavily",
                    })
            except Exception:
                pass

        return results

    def post(self, request):
        serializer = EstimateInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ville = serializer.validated_data["ville"]
        quartier = serializer.validated_data["quartier"]
        type_de_bien = serializer.validated_data["type_de_bien"]

        try:
            real_properties, nb_annonces = self._get_real_properties_context(
                ville, quartier, type_de_bien
            )

            web_results = []
            source_label = "Base de connaissances IA (données d'entraînement)"

            if nb_annonces > 0:
                source_label = "Annonces réelles sur Maskan"
            else:
                search_query = f"prix m² {type_de_bien} {ville} {quartier} Maroc 2026 immobilier"
                web_results = self._web_search(search_query)
                if web_results:
                    source_label = "Recherche web temps réel"

            result = self._query_openrouter(
                ville, quartier, type_de_bien, real_properties, web_results
            )

            output = EstimateOutputSerializer({
                **result,
                "modele": self._get_model_name(),
                "nb_annonces": nb_annonces,
                "source": source_label,
                "disclaimer": "Estimation indicative. Les prix réels peuvent varier selon l'état du bien, l'étage, les finitions, et les conditions du marché.",
            })
            return Response(output.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Erreur lors de l'estimation: {str(e)}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

    def _get_model_name(self):
        from django.conf import settings
        return settings.OPENROUTER_MODEL

    def _query_openrouter(self, ville: str, quartier: str, type_de_bien: str,
                           real_properties: list[dict], web_results: list[dict] | None = None) -> dict:
        import json
        import urllib.request
        import urllib.error
        import time
        from django.conf import settings

        api_key = settings.OPENROUTER_API_KEY
        if not api_key:
            raise ValueError("Clé API OpenRouter non configurée.")

        configured_model = settings.OPENROUTER_MODEL
        fallback_models = [
            configured_model,
            "liquid/lfm-2.5-1.2b-instruct:free",
            "openrouter/free",
        ]
        seen = set()
        models_to_try = [m for m in fallback_models if not (m in seen or seen.add(m))]

        url = settings.OPENROUTER_BASE_URL

        context_blocks = []

        if real_properties:
            rows = "\n".join(
                f"  - {p['prix_m2']} MAD/m² (prix total: {p['prix']} MAD, "
                f"surface: {p['surface']}m², quartier: {p['quartier']}, annonce: {p['annee_annonce']})"
                for p in real_properties[:15]
            )
            context_blocks.append(f"""
Voici des ANNONCES RÉELLES de {type_de_bien}s actuellement en vente à {ville}, quartier {quartier} ou ses environs (données de la plateforme Maskan) :
{rows}
""")

        if web_results:
            web_rows = "\n".join(
                f"  - {r['snippet'][:200]} [Source: {r.get('source','web')}]"
                for r in web_results[:5]
            )
            context_blocks.append(f"""
Voici des RÉSULTATS DE RECHERCHE WEB en temps réel pour les prix immobiliers à {ville} :
{web_rows}
""")

        context_str = "\n".join(context_blocks)

        prompt = f"""Tu es un expert en immobilier au Maroc.

{context_str}
Donne le prix moyen au m² pour un {type_de_bien} à {ville}, quartier {quartier}.

Réponds UNIQUEMENT par un objet JSON valide, sans texte avant ni après :
{{
  "prix_m2_moyen": <nombre entier, en MAD>,
  "fourchette_basse": <nombre entier, en MAD>,
  "fourchette_haute": <nombre entier, en MAD>,
  "devise": "MAD",
  "annee_reference": "<année des données utilisées, ex: 2026>",
  "niveau_confiance": "<Élevé si basé sur annonces récentes | Moyen si données partielles | Faible si estimation générale>"
}}"""

        last_error = None

        for model in models_to_try:
            payload = json.dumps({
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "max_tokens": 600,
            }).encode("utf-8")

            req = urllib.request.Request(
                url,
                data=payload,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                    "HTTP-Referer": "https://maskan.ma",
                    "X-Title": "Maskan Estimation",
                },
                method="POST",
            )

            try:
                with urllib.request.urlopen(req, timeout=12) as resp:
                    body = resp.read().decode("utf-8")
                    data = json.loads(body)
            except urllib.error.HTTPError as e:
                error_body = e.read().decode("utf-8", errors="replace")
                last_error = RuntimeError(f"OpenRouter {model} HTTP {e.code}: {error_body}")
                continue
            except urllib.error.URLError as e:
                last_error = RuntimeError(f"OpenRouter {model} connection error: {e.reason}")
                continue
            except json.JSONDecodeError:
                last_error = RuntimeError(f"OpenRouter {model}: réponse JSON invalide.")
                continue

            try:
                message = data["choices"][0]["message"]
                content = message.get("content") or message.get("reasoning") or ""
                if not content:
                    snippet = json.dumps(data, ensure_ascii=False)[:500]
                    last_error = RuntimeError(
                        f"Réponse IA vide de {model}. Réponse: {snippet}"
                    )
                    continue

                content = content.strip()
                if "```" in content:
                    content = content.split("```", 1)[-1]
                    content = content.rsplit("```", 1)[0]
                json_start = content.find("{")
                json_end = content.rfind("}")
                if json_start != -1 and json_end != -1 and json_end > json_start:
                    content = content[json_start:json_end + 1]
                result = json.loads(content.strip())

                confiance = result.get("niveau_confiance", "Faible")
                if real_properties:
                    if confiance not in ("Élevé", "Moyen", "Faible"):
                        confiance = "Moyen"
                elif web_results:
                    confiance = "Moyen" if confiance == "Élevé" else "Faible"
                else:
                    confiance = "Faible"

                prix = int(result.get("prix_m2_moyen", 0))
                low = int(result.get("fourchette_basse", 0))
                high = int(result.get("fourchette_haute", 0))

                # Sanity check: minimum reasonable price per m² in Morocco
                MIN_PRICE_M2 = 2000
                if prix < MIN_PRICE_M2:
                    prix = max(low, MIN_PRICE_M2)
                if low < MIN_PRICE_M2:
                    low = MIN_PRICE_M2
                if high < low:
                    high = low * 2

                return {
                    "prix_m2_moyen": prix,
                    "fourchette_basse": low,
                    "fourchette_haute": high,
                    "devise": result.get("devise", "MAD"),
                    "annee_reference": result.get("annee_reference", "N/A"),
                    "niveau_confiance": confiance,
                }

            except (KeyError, IndexError, json.JSONDecodeError) as e:
                snippet = json.dumps(data, ensure_ascii=False)[:500]
                last_error = RuntimeError(
                    f"{model}: impossible d'extraire les données: {e}. Réponse: {snippet}"
                )
                continue

        raise last_error or RuntimeError("Aucun modèle OpenRouter disponible.")


class PropertyImageServeView(APIView):
    """Serve property image binary by hash. Public endpoint with caching headers."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, image_hash):
        from .models import PropertyImage
        from .cache import get_cached, set_cached
        import base64

        # Try to get from cache first
        cache_key = f"img_data:{image_hash}"
        cached_b64 = get_cached(cache_key)
        
        if cached_b64:
            binary = base64.b64decode(cached_b64)
        else:
            try:
                img = PropertyImage.objects.only("image_data", "image_hash").filter(image_hash=image_hash).first()
                if not img:
                    return Response({"error": "Image non trouvée."}, status=status.HTTP_404_NOT_FOUND)
                
                raw_data = img.image_data
                if "," in raw_data:
                    raw_data = raw_data.split(",", 1)[1]
                
                # Cache the raw base64 string for 24h
                set_cached(cache_key, raw_data, ttl=86400)
                binary = base64.b64decode(raw_data)
            except Exception:
                return Response({"error": "Image corrompue."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Detect content type from first bytes
        content_type = "image/jpeg"
        if binary[:8] == b"\x89PNG\r\n\x1a\n":
            content_type = "image/png"
        elif binary[:4] == b"RIFF" and binary[8:12] == b"WEBP":
            content_type = "image/webp"

        response = HttpResponse(binary, content_type=content_type)
        response["Cache-Control"] = "public, max-age=31536000, immutable"
        response["ETag"] = f'"{image_hash}"'
        return response
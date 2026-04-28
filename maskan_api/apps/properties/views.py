import django.utils.timezone as tz
import uuid
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from apps.accounts.permissions import IsVendeur, IsOwner
from .models import Property
from .serializers import (
    PropertyListSerializer,
    PropertyDetailSerializer,
    PropertyCreateUpdateSerializer,
    PropertyVerificationSerializer,
    PropertyAdminListSerializer,
    PropertyAdminDetailSerializer,
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
        qs = Property.objects.select_related("agent")
        if self.action in ("retrieve",):
            qs = qs.prefetch_related("images")
        if self.action == "list":
            qs = qs.filter(verification_status="approved")
        if self.action in ("update", "partial_update") and self.request.user.is_authenticated:
            # For update actions, allow owners to access all their properties
            qs = qs.filter(agent=self.request.user)
        if self.action == "my_properties" and self.request.user.is_authenticated:
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
        if self.action in ("list", "retrieve", "featured", "cities", "regions", "map_pins"):
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
        qs = self.get_queryset().filter(is_featured=True, verification_status="approved")[:12]
        serializer = PropertyListSerializer(qs, many=True, context=self.get_serializer_context())
        set_cached(cache_key, serializer.data, CACHE_TTL_FEATURED, "properties:featured")
        return Response(serializer.data)

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
        data = list(
            qs.values(
                "id", "title", "price", "currency", "property_type",
                "city", "latitude", "longitude", "status",
            )
        )
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
            property_obj = Property.objects.select_related("agent", "reviewed_by").get(pk=property_uuid)
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

        from .serializers import VisitRequestSerializer
        serializer = VisitRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        visit = serializer.save(property=property_obj, client=request.user)
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
        if user.role == "vendeur":
            from apps.properties.models import Property
            my_properties = Property.objects.filter(agent=user)
            visits = VisitRequest.objects.filter(property__in=my_properties)
        else:
            visits = VisitRequest.objects.filter(client=user)
        
        serializer = VisitRequestSerializer(visits, many=True)
        return Response(serializer.data)

    def patch(self, request):
        visit_id = request.data.get("id")
        new_status = request.data.get("status")
        
        try:
            visit = VisitRequest.objects.get(id=visit_id, property__agent=request.user)
        except VisitRequest.DoesNotExist:
            return Response({"error": "Demande non trouvée."}, status=status.HTTP_404_NOT_FOUND)

        if new_status in ["confirmed", "cancelled", "completed"]:
            visit.status = new_status
            visit.save()
            serializer = VisitRequestSerializer(visit)
            return Response(serializer.data)
        
        return Response({"error": "Statut invalide."}, status=status.HTTP_400_BAD_REQUEST)


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
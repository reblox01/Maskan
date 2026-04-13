from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from apps.accounts.permissions import IsAgent, IsOwner
from .models import Property
from .serializers import (
    PropertyListSerializer,
    PropertyDetailSerializer,
    PropertyCreateUpdateSerializer,
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
    List/Retrieve: Public. Create: Agents. Update/Delete: Owner.
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
            qs = qs.filter(is_published=True)
        if self.action == "my_properties" and self.request.user.is_authenticated:
            qs = qs.filter(agent=self.request.user)
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return PropertyListSerializer
        if self.action in ("create", "update", "partial_update"):
            return PropertyCreateUpdateSerializer
        return PropertyDetailSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve", "featured", "cities", "regions", "map_pins"):
            return [permissions.AllowAny()]
        if self.action == "create":
            return [permissions.IsAuthenticated(), IsAgent()]
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
        qs = self.get_queryset().filter(is_featured=True, is_published=True)[:12]
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
            Property.objects.filter(is_published=True)
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
            Property.objects.filter(is_published=True)
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
                is_published=True,
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

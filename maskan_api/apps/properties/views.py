from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from apps.accounts.permissions import IsAgent, IsOwner
from .models import Property
from .serializers import (
    PropertyListSerializer,
    PropertyDetailSerializer,
    PropertyCreateUpdateSerializer,
)
from .filters import PropertyFilter


@method_decorator(ratelimit(key="ip", rate="30/m", method="GET"), name="list")
@method_decorator(ratelimit(key="ip", rate="10/m", method="POST"), name="create")
class PropertyViewSet(viewsets.ModelViewSet):
    """
    CRUD for properties with multi-criteria search.

    List/Retrieve: Public (published properties only).
    Create: Authenticated agents only.
    Update/Delete: Owner only.
    """

    def get_queryset(self):
        qs = Property.objects.select_related("agent")

        # Only prefetch images for detail view (list doesn't need full images)
        if self.action in ("retrieve",):
            qs = qs.prefetch_related("images")

        if self.action == "list":
            qs = qs.filter(is_published=True)
        if self.action == "my_properties" and self.request.user.is_authenticated:
            qs = qs.filter(agent=self.request.user)
        return qs
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PropertyFilter
    search_fields = ["title", "description", "city", "region", "address"]
    ordering_fields = ["price", "created_at", "area_sqm", "bedrooms"]
    ordering = ["-created_at"]
    lookup_field = "id"

    def get_serializer_class(self):
        if self.action == "list":
            return PropertyListSerializer
        if self.action in ("create", "update", "partial_update"):
            return PropertyCreateUpdateSerializer
        return PropertyDetailSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve", "featured", "cities", "regions"):
            return [permissions.AllowAny()]
        if self.action == "create":
            return [permissions.IsAuthenticated(), IsAgent()]
        return [permissions.IsAuthenticated(), IsOwner()]

    def perform_create(self, serializer):
        serializer.save(agent=self.request.user)

    @action(detail=False, methods=["get"], url_path="featured")
    def featured(self, request):
        """Return featured properties."""
        qs = self.get_queryset().filter(is_featured=True, is_published=True)[:12]
        serializer = PropertyListSerializer(qs, many=True, context=self.get_serializer_context())
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="cities")
    def cities(self, request):
        """Return distinct cities with published properties."""
        cities = (
            Property.objects.filter(is_published=True)
            .values_list("city", flat=True)
            .distinct()
            .order_by("city")
        )
        return Response(list(cities))

    @action(detail=False, methods=["get"], url_path="regions")
    def regions(self, request):
        """Return distinct regions with published properties."""
        regions = (
            Property.objects.filter(is_published=True)
            .values_list("region", flat=True)
            .distinct()
            .order_by("region")
        )
        return Response(list(regions))

    @action(
        detail=False,
        methods=["get"],
        url_path="my-properties",
        permission_classes=[permissions.IsAuthenticated],
    )
    def my_properties(self, request):
        """Return the authenticated agent's own properties."""
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = PropertyListSerializer(page, many=True, context=self.get_serializer_context())
            return self.get_paginated_response(serializer.data)
        serializer = PropertyListSerializer(qs, many=True, context=self.get_serializer_context())
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="map-pins")
    def map_pins(self, request):
        """Return lightweight data for map markers (id, lat, lng, price, title, type)."""
        qs = self.filter_queryset(
            self.get_queryset().filter(
                is_published=True,
                latitude__isnull=False,
                longitude__isnull=False,
            )
        )
        data = qs.values(
            "id", "title", "price", "currency", "property_type",
            "city", "latitude", "longitude", "status",
        )
        return Response(list(data))

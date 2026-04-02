import django_filters
from django.db.models import F
from .models import Property


class PropertyFilter(django_filters.FilterSet):
    """Multi-criteria filter for property search."""

    # Text search
    title = django_filters.CharFilter(lookup_expr="icontains")
    city = django_filters.CharFilter(lookup_expr="icontains")
    region = django_filters.CharFilter(lookup_expr="iexact")

    # Exact matches
    property_type = django_filters.ChoiceFilter(choices=Property.PropertyType.choices)
    status = django_filters.ChoiceFilter(choices=Property.Status.choices)

    # Price range
    price_min = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    price_max = django_filters.NumberFilter(field_name="price", lookup_expr="lte")

    # Area range
    area_min = django_filters.NumberFilter(field_name="area_sqm", lookup_expr="gte")
    area_max = django_filters.NumberFilter(field_name="area_sqm", lookup_expr="lte")

    # Bedrooms
    bedrooms_min = django_filters.NumberFilter(field_name="bedrooms", lookup_expr="gte")
    bedrooms_max = django_filters.NumberFilter(field_name="bedrooms", lookup_expr="lte")
    bedrooms = django_filters.NumberFilter(field_name="bedrooms", lookup_expr="exact")

    # Bathrooms
    bathrooms_min = django_filters.NumberFilter(field_name="bathrooms", lookup_expr="gte")
    bathrooms = django_filters.NumberFilter(field_name="bathrooms", lookup_expr="exact")

    # Boolean filters
    is_featured = django_filters.BooleanFilter()

    # GPS proximity (requires lat, lng, radius_km)
    lat = django_filters.NumberFilter(method="filter_proximity")
    lng = django_filters.NumberFilter(method="filter_proximity")
    radius_km = django_filters.NumberFilter(method="filter_proximity")

    class Meta:
        model = Property
        fields = [
            "title", "city", "region", "property_type", "status",
            "price_min", "price_max", "area_min", "area_max",
            "bedrooms_min", "bedrooms_max", "bedrooms",
            "bathrooms_min", "bathrooms", "is_featured",
        ]

    def filter_proximity(self, queryset, name, value):
        """Filter by GPS proximity using Haversine formula via Django ORM.

        Requires all three: lat, lng, radius_km to be present.
        """
        params = self.request.query_params
        lat = params.get("lat")
        lng = params.get("lng")
        radius_km = params.get("radius_km")

        if not all([lat, lng, radius_km]):
            return queryset

        try:
            lat = float(lat)
            lng = float(lng)
            radius_km = float(radius_km)
        except (ValueError, TypeError):
            return queryset

        # Approximate bounding box (fast pre-filter)
        lat_delta = radius_km / 111.0
        lng_delta = radius_km / (111.0 * max(abs(lat), 0.01))

        queryset = queryset.filter(
            latitude__gte=lat - lat_delta,
            latitude__lte=lat + lat_delta,
            longitude__gte=lng - lng_delta,
            longitude__lte=lng + lng_delta,
            latitude__isnull=False,
            longitude__isnull=False,
        )

        return queryset

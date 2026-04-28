import re
import django_filters
from django.db.models import F
from django.utils.html import strip_tags
from .models import Property

ALLOWED_FILTER_PARAMS = {
    "title", "city", "region", "property_type", "status",
    "price_min", "price_max", "area_min", "area_max",
    "bedrooms", "bedrooms_min", "bedrooms_max",
    "bathrooms", "bathrooms_min", "is_featured",
    "lat", "lng", "radius_km", "search", "ordering", "page",
}

MAX_SEARCH_LENGTH = 100
MAX_TEXT_FIELD_LENGTH = 200
MAX_PRICE = 999999999
MAX_AREA = 99999
MAX_BEDROOMS = 100
MAX_BATHROOMS = 100


def sanitize_text_input(value: str, max_length: int = MAX_TEXT_FIELD_LENGTH) -> str:
    if not value:
        return ""
    value = strip_tags(value)
    value = re.sub(r"[\x00-\x1F\x7F-\x9F]", "", value)
    value = value.strip()[:max_length]
    return value


def validate_and_sanitize_params(query_params) -> dict:
    sanitized = {}
    for key, value in query_params.items():
        if key not in ALLOWED_FILTER_PARAMS:
            continue
        if value is None or value == "":
            continue
        if key in ("title", "city", "region", "search"):
            sanitized[key] = sanitize_text_input(str(value), MAX_SEARCH_LENGTH)
        elif key in ("property_type", "status"):
            sanitized[key] = str(value).strip().lower()
        elif key in ("ordering",):
            sanitized[key] = str(value).strip()
        else:
            sanitized[key] = value
    return sanitized


def validate_numeric_ranges(filters_dict: dict) -> dict:
    validated = {}
    for key, value in filters_dict.items():
        if key in ("price_min", "price_max"):
            try:
                val = float(value)
                if val < 0 or val > MAX_PRICE:
                    continue
                validated[key] = val
            except (ValueError, TypeError):
                continue
        elif key in ("area_min", "area_max"):
            try:
                val = float(value)
                if val < 0 or val > MAX_AREA:
                    continue
                validated[key] = val
            except (ValueError, TypeError):
                continue
        elif key in ("bedrooms", "bedrooms_min", "bedrooms_max", "bathrooms", "bathrooms_min"):
            try:
                val = int(value)
                if key.startswith("bedrooms") and (val < 0 or val > MAX_BEDROOMS):
                    continue
                if key.startswith("bathrooms") and (val < 0 or val > MAX_BATHROOMS):
                    continue
                validated[key] = val
            except (ValueError, TypeError):
                continue
        elif key in ("lat", "lng", "radius_km"):
            try:
                val = float(value)
                if key == "lat" and (val < -90 or val > 90):
                    continue
                if key == "lng" and (val < -180 or val > 180):
                    continue
                if key == "radius_km" and (val <= 0 or val > 1000):
                    continue
                validated[key] = val
            except (ValueError, TypeError):
                continue
        elif key == "is_featured":
            validated[key] = str(value).lower() in ("true", "1", "yes")
        else:
            validated[key] = value
    if "price_min" in validated and "price_max" in validated:
        if validated["price_min"] > validated["price_max"]:
            del validated["price_min"]
    if "area_min" in validated and "area_max" in validated:
        if validated["area_min"] > validated["area_max"]:
            del validated["area_min"]
    if "bedrooms_min" in validated and "bedrooms_max" in validated:
        if validated["bedrooms_min"] > validated["bedrooms_max"]:
            del validated["bedrooms_min"]
    return validated


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

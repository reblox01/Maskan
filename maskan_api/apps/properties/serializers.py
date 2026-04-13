import base64
import hashlib
import io
import re
from PIL import Image
from django.utils.html import strip_tags
from rest_framework import serializers
from .models import Property, PropertyImage

ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP", "GIF"}

MAX_TITLE_LENGTH = 200
MAX_DESCRIPTION_LENGTH = 5000
MAX_ADDRESS_LENGTH = 300
MAX_CITY_LENGTH = 100
MAX_REGION_LENGTH = 100
MAX_PRICE = 999999999999
MIN_PRICE = 1
MAX_AREA = 99999
MIN_AREA = 1
MAX_BEDROOMS = 100
MAX_BATHROOMS = 100
MAX_IMAGES_PER_PROPERTY = 20


def sanitize_input(value: str, max_length: int = None) -> str:
    if not value:
        return ""
    value = strip_tags(value)
    value = re.sub(r"[\x00-\x1F\x7F-\x9F]", "", value)
    value = value.strip()
    if max_length:
        value = value[:max_length]
    return value


def validate_email(value: str) -> str:
    email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(email_pattern, value):
        raise serializers.ValidationError("Invalid email format.")
    return value.lower()


def _validate_base64_image(value: str) -> bytes:
    """Validate base64 string is a real image. Returns decoded bytes."""
    # Strip data URI prefix if present
    if "," in value and value.startswith("data:"):
        value = value.split(",", 1)[1]

    try:
        decoded = base64.b64decode(value)
    except Exception:
        raise serializers.ValidationError("Invalid base64 encoding.")

    # Max 10MB
    if len(decoded) > 10 * 1024 * 1024:
        raise serializers.ValidationError("Image must be under 10MB.")

    # Verify it's a valid image using Pillow
    try:
        img = Image.open(io.BytesIO(decoded))
        img.verify()
    except Exception:
        raise serializers.ValidationError("Invalid image data.")

    # Re-open after verify (verify closes the file)
    img = Image.open(io.BytesIO(decoded))
    if img.format not in ALLOWED_IMAGE_FORMATS:
        raise serializers.ValidationError(
            f"Unsupported format '{img.format}'. Use JPEG, PNG, WebP, or GIF."
        )

    return decoded


class PropertyImageSerializer(serializers.ModelSerializer):
    """Serializer for property images with base64 validation."""

    class Meta:
        model = PropertyImage
        fields = ["id", "image_data", "image_hash", "order", "created_at"]
        read_only_fields = ["id", "image_hash", "created_at"]

    def validate_image_data(self, value):
        """Validate that the image_data is a valid base64 encoded image."""
        _validate_base64_image(value)
        return value


class PropertyImageCreateSerializer(serializers.Serializer):
    """Nested serializer for creating images with a property."""

    image_data = serializers.CharField()
    order = serializers.IntegerField(min_value=0, default=0)

    def validate_image_data(self, value):
        _validate_base64_image(value)
        return value


class PropertyListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for property lists (no image data)."""

    main_image_hash = serializers.SerializerMethodField()
    agent_name = serializers.CharField(source="agent.username", read_only=True)

    class Meta:
        model = Property
        fields = [
            "id", "title", "property_type", "status", "price", "currency",
            "area_sqm", "bedrooms", "bathrooms", "city", "region",
            "latitude", "longitude", "is_featured", "main_image_hash",
            "agent_name", "created_at",
        ]

    def get_main_image_hash(self, obj):
        main = obj.images.order_by("order").first()
        return main.image_hash if main else None


class PropertyDetailSerializer(serializers.ModelSerializer):
    """Full property detail with images."""

    images = PropertyImageSerializer(many=True, read_only=True)
    agent = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = [
            "id", "title", "description", "property_type", "status",
            "price", "currency", "area_sqm", "bedrooms", "bathrooms",
            "address", "city", "region", "latitude", "longitude",
            "is_published", "is_featured", "agent", "images",
            "created_at", "updated_at",
        ]

    def get_agent(self, obj):
        return {
            "id": str(obj.agent.id),
            "username": obj.agent.username,
            "email": obj.agent.email,
            "phone": obj.agent.phone,
        }


class PropertyCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating properties with nested images."""

    images = PropertyImageCreateSerializer(many=True, required=False, write_only=True)

    class Meta:
        model = Property
        fields = [
            "id", "title", "description", "property_type", "status",
            "price", "currency", "area_sqm", "bedrooms", "bathrooms",
            "address", "city", "region", "latitude", "longitude",
            "is_published", "images",
        ]
        read_only_fields = ["id"]

    def validate_title(self, value):
        value = sanitize_input(value, MAX_TITLE_LENGTH)
        if len(value) < 5:
            raise serializers.ValidationError("Title must be at least 5 characters.")
        if len(value) > MAX_TITLE_LENGTH:
            raise serializers.ValidationError(f"Title must be at most {MAX_TITLE_LENGTH} characters.")
        return value

    def validate_description(self, value):
        return sanitize_input(value, MAX_DESCRIPTION_LENGTH)

    def validate_address(self, value):
        return sanitize_input(value, MAX_ADDRESS_LENGTH)

    def validate_city(self, value):
        value = sanitize_input(value, MAX_CITY_LENGTH)
        if not value:
            raise serializers.ValidationError("City is required.")
        return value.title()

    def validate_region(self, value):
        value = sanitize_input(value, MAX_REGION_LENGTH)
        if not value:
            raise serializers.ValidationError("Region is required.")
        return value.title()

    def validate_property_type(self, value):
        valid_types = [choice[0] for choice in Property.PropertyType.choices]
        if value not in valid_types:
            raise serializers.ValidationError("Invalid property type.")
        return value

    def validate_status(self, value):
        valid_statuses = [choice[0] for choice in Property.Status.choices]
        if value not in valid_statuses:
            raise serializers.ValidationError("Invalid status.")
        return value

    def validate_price(self, value):
        if value < MIN_PRICE:
            raise serializers.ValidationError("Price must be positive.")
        if value > MAX_PRICE:
            raise serializers.ValidationError("Price is too high.")
        return value

    def validate_area_sqm(self, value):
        if value < MIN_AREA:
            raise serializers.ValidationError("Area must be at least 1 square meter.")
        if value > MAX_AREA:
            raise serializers.ValidationError(f"Area cannot exceed {MAX_AREA} square meters.")
        return value

    def validate_bedrooms(self, value):
        if value < 0:
            raise serializers.ValidationError("Bedrooms cannot be negative.")
        if value > MAX_BEDROOMS:
            raise serializers.ValidationError(f"Bedrooms cannot exceed {MAX_BEDROOMS}.")
        return value

    def validate_bathrooms(self, value):
        if value < 0:
            raise serializers.ValidationError("Bathrooms cannot be negative.")
        if value > MAX_BATHROOMS:
            raise serializers.ValidationError(f"Bathrooms cannot exceed {MAX_BATHROOMS}.")
        return value

    def validate_latitude(self, value):
        if value is not None and (value < -90 or value > 90):
            raise serializers.ValidationError("Latitude must be between -90 and 90.")
        return value

    def validate_longitude(self, value):
        if value is not None and (value < -180 or value > 180):
            raise serializers.ValidationError("Longitude must be between -180 and 180.")
        return value

    def validate_currency(self, value):
        valid_currencies = ["MAD", "USD", "EUR"]
        if value not in valid_currencies:
            raise serializers.ValidationError(f"Currency must be one of: {', '.join(valid_currencies)}")
        return value

    def validate_images(self, value):
        if value is None:
            return []
        if len(value) > MAX_IMAGES_PER_PROPERTY:
            raise serializers.ValidationError(f"Maximum {MAX_IMAGES_PER_PROPERTY} images allowed.")
        return value

    def create(self, validated_data):
        images_data = validated_data.pop("images", [])
        property_obj = Property.objects.create(**validated_data)

        for img_data in images_data:
            raw = img_data["image_data"]
            if "," in raw and raw.startswith("data:"):
                raw = raw.split(",", 1)[1]

            PropertyImage.objects.create(
                property=property_obj,
                image_data=raw,
                image_hash=hashlib.sha256(raw.encode()).hexdigest(),
                order=img_data.get("order", 0),
            )

        return property_obj

    def update(self, instance, validated_data):
        images_data = validated_data.pop("images", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if images_data is not None:
            instance.images.all().delete()
            for img_data in images_data:
                raw = img_data["image_data"]
                if "," in raw and raw.startswith("data:"):
                    raw = raw.split(",", 1)[1]

                PropertyImage.objects.create(
                    property=instance,
                    image_data=raw,
                    image_hash=hashlib.sha256(raw.encode()).hexdigest(),
                    order=img_data.get("order", 0),
                )

        return instance

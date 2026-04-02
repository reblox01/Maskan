import base64
import hashlib
import io
from PIL import Image
from rest_framework import serializers
from .models import Property, PropertyImage

ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP", "GIF"}


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
        value = value.strip()
        if len(value) < 5:
            raise serializers.ValidationError("Title must be at least 5 characters.")
        return value

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be positive.")
        if value > 999999999999:
            raise serializers.ValidationError("Price is too high.")
        return value

    def validate_city(self, value):
        return value.strip().title()

    def validate_region(self, value):
        return value.strip().title()

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

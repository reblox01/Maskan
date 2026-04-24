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
        raise serializers.ValidationError("Format d'email invalide.")
    return value.lower()


def _validate_base64_image(value: str) -> bytes:
    """Validate base64 string is a real image. Returns decoded bytes."""
    if "," in value and value.startswith("data:"):
        value = value.split(",", 1)[1]

    try:
        decoded = base64.b64decode(value)
    except Exception:
        raise serializers.ValidationError("Encodage base64 invalide.")

    if len(decoded) > 10 * 1024 * 1024:
        raise serializers.ValidationError("L'image doit faire moins de 10 Mo.")

    try:
        img = Image.open(io.BytesIO(decoded))
        img.verify()
    except Exception:
        raise serializers.ValidationError("Données d'image invalides.")

    img = Image.open(io.BytesIO(decoded))
    if img.format not in ALLOWED_IMAGE_FORMATS:
        raise serializers.ValidationError(
            f"Format non supporté '{img.format}'. Utilisez JPEG, PNG, WebP ou GIF."
        )

    return decoded


class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ["id", "image_data", "image_hash", "order", "created_at"]
        read_only_fields = ["id", "image_hash", "created_at"]

    def validate_image_data(self, value):
        _validate_base64_image(value)
        return value


class PropertyImageCreateSerializer(serializers.Serializer):
    image_data = serializers.CharField()
    order = serializers.IntegerField(min_value=0, default=0)

    def validate_image_data(self, value):
        _validate_base64_image(value)
        return value


class PropertyListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for property lists (no image data)."""

    main_image_hash = serializers.SerializerMethodField()
    agent_name = serializers.CharField(source="agent.username", read_only=True)
    verification_status = serializers.CharField(read_only=True)

    class Meta:
        model = Property
        fields = [
            "id", "title", "property_type", "status", "price", "currency",
            "area_sqm", "bedrooms", "bathrooms", "city", "region",
            "latitude", "longitude", "is_featured", "main_image_hash",
            "agent_name", "verification_status", "created_at",
        ]

    def get_main_image_hash(self, obj):
        main_img = obj.main_image
        return main_img.image_hash if main_img else None


class PropertyDetailSerializer(serializers.ModelSerializer):
    """Full property detail with images and verification info."""

    images = PropertyImageSerializer(many=True, read_only=True)
    agent = serializers.SerializerMethodField()
    verification_status = serializers.CharField(read_only=True)
    is_verified = serializers.BooleanField(read_only=True)
    rejection_reason = serializers.CharField(read_only=True)

    class Meta:
        model = Property
        fields = [
            "id", "title", "description", "property_type", "status",
            "price", "currency", "area_sqm", "bedrooms", "bathrooms",
            "address", "city", "region", "latitude", "longitude",
            "is_published", "is_featured", "agent", "images",
            "verification_status", "is_verified", "rejection_reason",
            "created_at", "updated_at",
        ]

    def get_agent(self, obj):
        if not obj.agent:
            return None
        return {
            "id": str(obj.agent.id),
            "name": obj.agent.first_name + " " + obj.agent.last_name if obj.agent.first_name else obj.agent.username,
            "email": obj.agent.email,
            "phone": getattr(obj.agent, "phone", None),
            "profile_image": getattr(obj.agent, "profile_image", None),
        }


class PropertyCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating properties with nested images."""

    images = PropertyImageCreateSerializer(many=True, required=False, write_only=True)

    class Meta:
        model = Property
        fields = [
            "id", "title", "description", "property_type", "listing_type",
            "room_label_format", "status",
            "price", "currency", "area_sqm", "bedrooms", "bathrooms",
            "address", "city", "region", "neighborhood",
            "latitude", "longitude",
            "furnished", "is_turnkey", "deposit", "rent_price",
            "floor", "available_from", "charges_included",
            "consulting_enabled", "consulting_is_free", "consulting_price",
            "is_published", "images",
        ]
        read_only_fields = ["id"]

    def validate_title(self, value):
        value = sanitize_input(value, MAX_TITLE_LENGTH)
        if len(value) < 5:
            raise serializers.ValidationError("Le titre doit contenir au moins 5 caractères.")
        if len(value) > MAX_TITLE_LENGTH:
            raise serializers.ValidationError(f"Le titre ne peut pas dépasser {MAX_TITLE_LENGTH} caractères.")
        return value

    def validate_description(self, value):
        return sanitize_input(value, MAX_DESCRIPTION_LENGTH)

    def validate_address(self, value):
        return sanitize_input(value, MAX_ADDRESS_LENGTH)

    def validate_city(self, value):
        value = sanitize_input(value, MAX_CITY_LENGTH)
        if not value:
            raise serializers.ValidationError("La ville est requise.")
        return value.title()

    def validate_region(self, value):
        value = sanitize_input(value, MAX_REGION_LENGTH)
        if not value:
            raise serializers.ValidationError("La région est requise.")
        return value.title()

    def validate_property_type(self, value):
        valid_types = [choice[0] for choice in Property.PropertyType.choices]
        if value not in valid_types:
            raise serializers.ValidationError("Type de bien invalide.")
        return value

    def validate_status(self, value):
        valid_statuses = [choice[0] for choice in Property.Status.choices]
        if value not in valid_statuses:
            raise serializers.ValidationError("Statut invalide.")
        return value

    def validate_price(self, value):
        if value < MIN_PRICE:
            raise serializers.ValidationError("Le prix doit être positif.")
        if value > MAX_PRICE:
            raise serializers.ValidationError("Le prix est trop élevé.")
        return value

    def validate_area_sqm(self, value):
        if value < MIN_AREA:
            raise serializers.ValidationError("La surface doit être d'au moins 1 m².")
        if value > MAX_AREA:
            raise serializers.ValidationError(f"La surface ne peut pas dépasser {MAX_AREA} m².")
        return value

    def validate_bedrooms(self, value):
        if value < 0:
            raise serializers.ValidationError("Le nombre de chambres ne peut pas être négatif.")
        if value > MAX_BEDROOMS:
            raise serializers.ValidationError(f"Le nombre de chambres ne peut pas dépasser {MAX_BEDROOMS}.")
        return value

    def validate_bathrooms(self, value):
        if value < 0:
            raise serializers.ValidationError("Le nombre de salles de bain ne peut pas être négatif.")
        if value > MAX_BATHROOMS:
            raise serializers.ValidationError(f"Le nombre de salles de bain ne peut pas dépasser {MAX_BATHROOMS}.")
        return value

    def validate_latitude(self, value):
        if value is not None and (value < -90 or value > 90):
            raise serializers.ValidationError("La latitude doit être entre -90 et 90.")
        return value

    def validate_longitude(self, value):
        if value is not None and (value < -180 or value > 180):
            raise serializers.ValidationError("La longitude doit être entre -180 et 180.")
        return value

    def validate_currency(self, value):
        valid_currencies = ["MAD", "USD", "EUR"]
        if value not in valid_currencies:
            raise serializers.ValidationError(f"La devise doit être l'une de: {', '.join(valid_currencies)}")
        return value

    def validate_images(self, value):
        if value is None:
            return []
        if len(value) > MAX_IMAGES_PER_PROPERTY:
            raise serializers.ValidationError(f"Maximum {MAX_IMAGES_PER_PROPERTY} images autorisées.")
        return value

    def create(self, validated_data):
        images_data = validated_data.pop("images", [])
        validated_data["verification_status"] = Property.VerificationStatus.PENDING
        validated_data["is_published"] = False
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


class PropertyVerificationSerializer(serializers.Serializer):
    """Serializer for admin property verification."""

    action = serializers.ChoiceField(choices=["approve", "reject"])
    rejection_reason = serializers.CharField(required=False, allow_blank=True, max_length=1000)


class PropertyAdminListSerializer(serializers.ModelSerializer):
    """Serializer for admin property list with verification fields."""

    agent_name = serializers.CharField(source="agent.username", read_only=True)
    agent_email = serializers.CharField(source="agent.email", read_only=True)
    reviewed_by_name = serializers.CharField(source="reviewed_by.username", read_only=True, allow_null=True)

    class Meta:
        model = Property
        fields = [
            "id", "title", "property_type", "status", "price", "currency",
            "city", "region", "is_published", "is_verified",
            "verification_status", "rejection_reason",
            "agent_name", "agent_email", "reviewed_by_name", "reviewed_at",
            "created_at",
        ]


class PropertyAdminDetailSerializer(serializers.ModelSerializer):
    """Full property detail for admin with all verification fields."""

    images = PropertyImageSerializer(many=True, read_only=True)
    agent = serializers.SerializerMethodField()
    reviewed_by = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = [
            "id", "title", "description", "property_type", "status",
            "price", "currency", "area_sqm", "bedrooms", "bathrooms",
            "address", "city", "region", "latitude", "longitude",
            "is_published", "is_verified", "is_featured",
            "verification_status", "rejection_reason",
            "agent", "images", "reviewed_by", "reviewed_at",
            "created_at", "updated_at",
        ]

    def get_agent(self, obj):
        return {
            "id": str(obj.agent.id),
            "username": obj.agent.username,
            "email": obj.agent.email,
            "phone": obj.agent.phone,
        }

    def get_reviewed_by(self, obj):
        if obj.reviewed_by:
            return {
                "id": str(obj.reviewed_by.id),
                "username": obj.reviewed_by.username,
            }
        return None


class VisitRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        from .models import VisitRequest
        fields = [
            "id", "property", "client", "scheduled_date", "status", 
            "notes", "created_at", "updated_at"
        ]
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["client"] = {
            "id": str(instance.client.id),
            "username": instance.client.username,
            "email": instance.client.email,
            "phone": instance.client.phone,
        }
        data["property"] = {
            "id": str(instance.related_property.id),
            "title": instance.related_property.title,
            "address": instance.related_property.address,
            "city": instance.related_property.city,
        }
        return data


class ConsultingRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        from .models import ConsultingRequest
        fields = [
            "id", "property", "client", "consulting_type", "is_free", "price",
            "scheduled_date", "status", "client_notes", "admin_response",
            "created_at", "updated_at"
        ]
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["client"] = {
            "id": str(instance.client.id),
            "username": instance.client.username,
            "email": instance.client.email,
            "phone": instance.client.phone,
        }
        if instance.related_property:
            data["property"] = {
                "id": str(instance.related_property.id),
                "title": instance.related_property.title,
                "address": instance.related_property.address,
                "city": instance.related_property.city,
            }
        return data
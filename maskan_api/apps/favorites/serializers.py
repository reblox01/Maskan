from rest_framework import serializers
from .models import Favorite


class FavoriteSerializer(serializers.ModelSerializer):
    property_title = serializers.CharField(source="property.title", read_only=True)
    property_city = serializers.CharField(source="property.city", read_only=True)
    property_price = serializers.DecimalField(
        source="property.price", max_digits=14, decimal_places=2, read_only=True
    )
    property_type = serializers.CharField(source="property.property_type", read_only=True)
    property_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Favorite
        fields = [
            "id", "property", "property_title", "property_city",
            "property_price", "property_type", "property_image_url",
            "created_at",
        ]
        read_only_fields = ["user"]

    def get_property_image_url(self, obj):
        main = obj.property.main_image
        if main:
            return main.image_url if hasattr(main, "image_url") else f"/api/properties/image/{main.image_hash}/"
        return None

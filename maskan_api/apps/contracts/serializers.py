from rest_framework import serializers
from .models import Contract


class ContractSerializer(serializers.ModelSerializer):
    property_title = serializers.CharField(source="property.title", read_only=True)
    property_address = serializers.CharField(source="property.address", read_only=True)
    acquereur_name = serializers.CharField(source="acquereur.username", read_only=True)
    vendeur_name = serializers.CharField(source="vendeur.username", read_only=True)

    class Meta:
        model = Contract
        fields = [
            "id", "property", "property_title", "property_address",
            "acquereur", "acquereur_name",
            "vendeur", "vendeur_name", "contract_type", "status",
            "agreed_price", "notes", "created_at", "updated_at",
        ]
        read_only_fields = [
            "acquereur", "vendeur", "status",
        ]

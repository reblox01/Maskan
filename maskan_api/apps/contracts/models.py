import uuid
from django.conf import settings
from django.db import models


class Contract(models.Model):

    class ContractType(models.TextChoices):
        SALE = "sale", "Vente"
        RENTAL = "rental", "Location"

    class Status(models.TextChoices):
        DRAFT = "draft", "Brouillon"
        SIGNED_BY_VENDEUR = "signed_by_vendeur", "Signé par le vendeur"
        COMPLETED = "completed", "Terminé"
        CANCELLED = "cancelled", "Annulé"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        "properties.Property", on_delete=models.CASCADE, related_name="contracts",
        db_column="property_id",
    )
    acquereur = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="purchase_contracts", db_column="acquereur_id",
    )
    vendeur = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="sales_contracts", db_column="vendeur_id",
    )
    contract_type = models.CharField(
        max_length=10, choices=ContractType.choices, default=ContractType.SALE,
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT,
    )
    agreed_price = models.DecimalField(
        max_digits=14, decimal_places=2,
    )
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "contracts_contract"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Contract {self.id} - {self.property.title if self.property else 'N/A'}"

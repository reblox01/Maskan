import uuid
import hashlib
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
import django.utils.timezone as tz


class Property(models.Model):
    """Real estate property listing model."""

    class PropertyType(models.TextChoices):
        APARTMENT = "apartment", "Appartement"
        VILLA = "villa", "Villa"
        STUDIO = "studio", "Studio"
        HOUSE = "house", "Maison"
        LAND = "land", "Terrain"
        COMMERCIAL = "commercial", "Local commercial"
        OFFICE = "office", "Bureau"

    class ListingType(models.TextChoices):
        FOR_SALE = "vendre", "À vendre"
        FOR_RENT = "louer", "À louer"

    class RoomLabelFormat(models.TextChoices):
        CLASSIC = "classic", "Classique (Appartement/Villa)"
        NUMBER = "number", "Numéro (F3/T2)"

    class Status(models.TextChoices):
        AVAILABLE = "available", "Disponible"
        SOLD = "sold", "Vendu"
        RENTED = "rented", "Loué"
        PENDING = "pending", "En attente"

    class VerificationStatus(models.TextChoices):
        PENDING = "pending", "En attente"
        APPROVED = "approved", "Approuvé"
        REJECTED = "rejected", "Rejeté"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True)

    property_type = models.CharField(
        max_length=20, choices=PropertyType.choices, db_index=True
    )
    listing_type = models.CharField(
        max_length=10, choices=ListingType.choices, default=ListingType.FOR_SALE, db_index=True
    )
    room_label_format = models.CharField(
        max_length=10, choices=RoomLabelFormat.choices, default=RoomLabelFormat.CLASSIC
    )
    
    # Consulting options
    consulting_enabled = models.BooleanField(default=False)
    consulting_is_free = models.BooleanField(default=True)
    consulting_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0)]
    )
    
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.AVAILABLE, db_index=True
    )

    price = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        db_index=True,
    )
    currency = models.CharField(max_length=3, default="MAD")

    area_sqm = models.PositiveIntegerField(
        help_text="Area in square meters",
        validators=[MinValueValidator(1)],
    )
    bedrooms = models.PositiveSmallIntegerField(default=0)
    bathrooms = models.PositiveSmallIntegerField(default=0)

    address = models.CharField(max_length=300)
    city = models.CharField(max_length=100, db_index=True)
    region = models.CharField(max_length=100, db_index=True)
    latitude = models.DecimalField(
        max_digits=12,
        decimal_places=8,
        null=True,
        blank=True,
        validators=[MinValueValidator(-90), MaxValueValidator(90)],
    )
    longitude = models.DecimalField(
        max_digits=12,
        decimal_places=8,
        null=True,
        blank=True,
        validators=[MinValueValidator(-180), MaxValueValidator(180)],
    )

    # Rental-specific fields
    furnished = models.BooleanField(default=False)
    is_turnkey = models.BooleanField(default=False)
    deposit = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0)],
    )
    rent_price = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0)],
    )
    floor = models.SmallIntegerField(default=0)
    available_from = models.DateField(null=True, blank=True)
    charges_included = models.BooleanField(default=False)
    neighborhood = models.CharField(max_length=200, blank=True, default="")

    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="properties",
        limit_choices_to={"role__in": ["vendeur", "admin"]},
    )

    is_published = models.BooleanField(default=False, db_index=True)
    is_verified = models.BooleanField(default=False, db_index=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    is_approved = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)

    verification_status = models.CharField(
        max_length=10,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
        db_index=True,
    )
    rejection_reason = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_properties",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "properties"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["verification_status", "is_published"]),
            models.Index(fields=["property_type", "city"]),
            models.Index(fields=["price"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return f"{self.title} — {self.city}"

    @property
    def main_image(self):
        return self.images.order_by("order").first()


class PropertyImage(models.Model):
    """Property image stored as base64 in database."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="images"
    )
    image_data = models.TextField(help_text="Base64 encoded image")
    image_hash = models.CharField(
        max_length=64, db_index=True, help_text="SHA-256 hash of image data"
    )
    order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order"]
        unique_together = ["property", "order"]

    def save(self, *args, **kwargs):
        if not self.image_hash:
            self.image_hash = hashlib.sha256(
                self.image_data.encode()
            ).hexdigest()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Image {self.order} for {self.property.title}"


class VisitRequest(models.Model):
    """Visit booking request for a property."""

    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        CONFIRMED = "confirmed", "Confirmé"
        COMPLETED = "completed", "Terminé"
        CANCELLED = "cancelled", "Annulé"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    related_property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="visit_requests"
    )
    client = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="visit_requests"
    )
    scheduled_date = models.DateTimeField()
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ["related_property", "client", "status"]

    def __str__(self):
        return f"Visit request by {self.client.username} for {self.related_property.title}"

    @property
    def can_cancel_visit(self):
        return self.status in [self.Status.PENDING, self.Status.CONFIRMED] and self.scheduled_date > timezone.now()


class ConsultingRequest(models.Model):
    """Consulting booking request."""

    class Type(models.TextChoices):
        VALUATION = "valuation", "Évaluation Immobilière"
        LEGAL = "legal", "Conseil Juridique"
        INVESTMENT = "investment", "Conseil en Investissement"
        MANAGEMENT = "management", "Gestion Immobilière"
        OTHER = "other", "Autre"

    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        CONFIRMED = "confirmed", "Confirmé"
        IN_PROGRESS = "in_progress", "En cours"
        COMPLETED = "completed", "Terminé"
        CANCELLED = "cancelled", "Annulé"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    related_property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="consulting_requests", null=True, blank=True
    )
    client = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="consulting_requests"
    )
    consulting_type = models.CharField(max_length=20, choices=Type.choices)
    is_free = models.BooleanField(default=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    scheduled_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    client_notes = models.TextField(blank=True)
    admin_response = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Consulting {self.get_consulting_type_display()} by {self.client.username}"
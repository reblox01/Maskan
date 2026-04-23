import uuid
import hashlib
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


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

    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="properties",
        limit_choices_to={"role__in": ["vendeur", "admin"]},
    )

    is_published = models.BooleanField(default=False, db_index=True)
    is_verified = models.BooleanField(default=False, db_index=True)
    is_featured = models.BooleanField(default=False, db_index=True)

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

    @property
    def is_approved(self):
        return self.verification_status == self.VerificationStatus.APPROVED


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
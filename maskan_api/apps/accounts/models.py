import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom User model with role-based access."""

    class Role(models.TextChoices):
        ACQUEREUR = "acquereur", "Acquereur"
        VENDEUR = "vendeur", "Vendeur"
        ADMIN = "admin", "Admin"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.ACQUEREUR)
    current_mode = models.CharField(max_length=10, default=Role.ACQUEREUR)
    is_verified = models.BooleanField(default=False)
    avatar = models.TextField(blank=True, help_text="Base64 encoded avatar image")

    bio = models.TextField(blank=True)
    address = models.CharField(max_length=300, blank=True)
    city = models.CharField(max_length=100, blank=True)
    region = models.CharField(max_length=100, blank=True)

    developer_mode = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

    @property
    def is_vendeur_active(self):
        return self.role == self.Role.VENDEUR and self.current_mode == self.Role.VENDEUR

    def can_switch_to_vendeur(self):
        return self.role == self.Role.VENDEUR

    def switch_mode(self):
        if self.role == self.Role.VENDEUR:
            self.current_mode = (
                self.Role.VENDEUR if self.current_mode == self.Role.ACQUEREUR else self.Role.ACQUEREUR
            )
            self.save(update_fields=["current_mode"])
        return self.current_mode


class ApplicationField(models.Model):
    """Dynamic form fields for agent applications — admin configurable."""

    class FieldType(models.TextChoices):
        TEXT = "text", "Text"
        NUMBER = "number", "Number"
        TEXTAREA = "textarea", "Textarea"
        SELECT = "select", "Select"
        CHECKBOX = "checkbox", "Checkbox"
        FILE = "file", "File"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    label = models.CharField(max_length=200)
    field_type = models.CharField(max_length=10, choices=FieldType.choices, default=FieldType.TEXT)
    placeholder = models.CharField(max_length=200, blank=True)
    help_text = models.CharField(max_length=300, blank=True)
    choices = models.JSONField(default=list, blank=True)
    is_required = models.BooleanField(default=True)
    order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "created_at"]

    def __str__(self):
        return f"{self.label} ({self.field_type})"


class VendeurApplication(models.Model):
    """Vendeur application submitted by an acquereur."""

    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        APPROVED = "approved", "Approuvé"
        REJECTED = "rejected", "Rejeté"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="vendeur_application")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviewed_vendeur_applications"
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} — {self.get_status_display()}"


class ApplicationResponse(models.Model):
    """Stores a user's answer to a dynamic application field."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(VendeurApplication, on_delete=models.CASCADE, related_name="responses")
    field = models.ForeignKey(ApplicationField, on_delete=models.CASCADE, related_name="responses")
    value = models.TextField(blank=True)

    class Meta:
        unique_together = ["application", "field"]

    def __str__(self):
        return f"{self.application.user.username} — {self.field.label}: {self.value[:50]}"
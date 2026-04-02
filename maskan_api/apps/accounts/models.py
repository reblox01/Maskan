import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom User model with role-based access."""

    class Role(models.TextChoices):
        CLIENT = "client", "Client"
        AGENT = "agent", "Agent"
        ADMIN = "admin", "Admin"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.CLIENT)
    is_verified = models.BooleanField(default=False)
    avatar = models.TextField(blank=True, help_text="Base64 encoded avatar image")

    # Extended profile fields
    bio = models.TextField(blank=True)
    address = models.CharField(max_length=300, blank=True)
    city = models.CharField(max_length=100, blank=True)
    region = models.CharField(max_length=100, blank=True)

    # Admin developer mode (per-admin mock data toggle)
    developer_mode = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"


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


class AgentApplication(models.Model):
    """Agent application submitted by a client."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="agent_application")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviewed_applications"
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} — {self.get_status_display()}"


class ApplicationResponse(models.Model):
    """Stores a user's answer to a dynamic application field."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(AgentApplication, on_delete=models.CASCADE, related_name="responses")
    field = models.ForeignKey(ApplicationField, on_delete=models.CASCADE, related_name="responses")
    value = models.TextField(blank=True)

    class Meta:
        unique_together = ["application", "field"]

    def __str__(self):
        return f"{self.application.user.username} — {self.field.label}: {self.value[:50]}"

from django.contrib import admin
from .models import Property, PropertyImage


class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1
    fields = ("image_data", "order")


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ("title", "property_type", "status", "price", "city", "verification_status", "agent")
    list_filter = ("property_type", "status", "region", "verification_status", "is_featured", "is_published")
    search_fields = ("title", "city", "region", "address", "agent__username", "agent__email")
    readonly_fields = ("id", "created_at", "updated_at", "reviewed_at", "is_verified")
    inlines = [PropertyImageInline]
    raw_id_fields = ("agent", "reviewed_by")
    list_editable = ("verification_status",)

    fieldsets = (
        ("Informations de base", {
            "fields": ("title", "property_type", "status", "description")
        }),
        ("Prix et superficie", {
            "fields": ("price", "currency", "area_sqm", "bedrooms", "bathrooms")
        }),
        ("Localisation", {
            "fields": ("address", "city", "region", "latitude", "longitude")
        }),
        ("Propriétaire", {
            "fields": ("agent",)
        }),
        ("Publication", {
            "fields": ("is_published", "is_featured", "is_verified", "verification_status", "rejection_reason", "reviewed_by", "reviewed_at")
        }),
        ("Timestamps", {
            "fields": ("id", "created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )


@admin.register(PropertyImage)
class PropertyImageAdmin(admin.ModelAdmin):
    list_display = ("property", "order", "image_hash", "created_at")
    list_filter = ("created_at",)
    raw_id_fields = ("property",)
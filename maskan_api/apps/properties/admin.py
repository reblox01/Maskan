from django.contrib import admin
from .models import Property, PropertyImage


class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1
    fields = ("image_data", "order")


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ("title", "property_type", "status", "price", "city", "region", "agent", "is_published")
    list_filter = ("property_type", "status", "region", "is_published", "is_featured")
    search_fields = ("title", "city", "region", "address")
    readonly_fields = ("id", "created_at", "updated_at")
    inlines = [PropertyImageInline]
    raw_id_fields = ("agent",)


@admin.register(PropertyImage)
class PropertyImageAdmin(admin.ModelAdmin):
    list_display = ("property", "order", "image_hash", "created_at")
    list_filter = ("created_at",)
    raw_id_fields = ("property",)

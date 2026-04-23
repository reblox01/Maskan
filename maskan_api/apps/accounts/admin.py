from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, ApplicationField, VendeurApplication, ApplicationResponse


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "username", "role", "current_mode", "is_verified", "is_staff", "developer_mode")
    list_filter = ("role", "current_mode", "is_verified", "is_staff", "developer_mode")
    search_fields = ("email", "username", "phone")
    ordering = ("-created_at",)


class ApplicationResponseInline(admin.TabularInline):
    model = ApplicationResponse
    extra = 0
    readonly_fields = ("field", "value")


@admin.register(ApplicationField)
class ApplicationFieldAdmin(admin.ModelAdmin):
    list_display = ("label", "field_type", "is_required", "is_active", "order")
    list_filter = ("field_type", "is_required", "is_active")
    ordering = ("order",)


@admin.register(VendeurApplication)
class VendeurApplicationAdmin(admin.ModelAdmin):
    list_display = ("user", "status", "created_at", "reviewed_at", "reviewed_by")
    list_filter = ("status",)
    search_fields = ("user__email", "user__username")
    inlines = [ApplicationResponseInline]
    raw_id_fields = ("user", "reviewed_by")
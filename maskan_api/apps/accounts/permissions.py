from rest_framework.permissions import BasePermission


class IsVendeur(BasePermission):
    """Allow access only to vendeurs and admins."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("vendeur", "admin")
        )


class IsOwner(BasePermission):
    """Allow access only to the property owner."""

    def has_object_permission(self, request, view, obj):
        return obj.agent == request.user


class IsAdmin(BasePermission):
    """Allow access only to admins."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "admin"
        )


class IsVendeurOrAdmin(BasePermission):
    """Allow access to vendeur in vendeur mode, or admin."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == "admin":
            return True
        return request.user.is_vendeur_active
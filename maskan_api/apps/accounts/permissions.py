from rest_framework.permissions import BasePermission


class IsAgent(BasePermission):
    """Allow access only to agents and admins."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("agent", "admin")
        )


class IsOwner(BasePermission):
    """Allow access only to the property owner."""

    def has_object_permission(self, request, view, obj):
        return obj.agent == request.user

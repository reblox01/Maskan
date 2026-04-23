from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PropertyViewSet, PropertyPendingVerificationView, PropertyVerifyView

router = DefaultRouter()
router.register(r"", PropertyViewSet, basename="property")

urlpatterns = [
    path("", include(router.urls)),
    path("pending-verification/", PropertyPendingVerificationView.as_view(), name="property-pending-verification"),
    path("<uuid:pk>/verify/", PropertyVerifyView.as_view(), name="property-verify"),
]
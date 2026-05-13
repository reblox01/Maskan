from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PropertyViewSet, PropertyPendingVerificationView, PropertyVerifyView,
    VisitRequestView, MyVisitRequestsView, ConsultingRequestView,
    PropertyEstimateView, PropertyImageServeView
)

router = DefaultRouter()
router.register(r"", PropertyViewSet, basename="property")

urlpatterns = [
    path("pending-verification/", PropertyPendingVerificationView.as_view(), name="property-pending-verification"),
    path("<uuid:pk>/verify/", PropertyVerifyView.as_view(), name="property-verify"),
    path("request-visit/<uuid:pk>/", VisitRequestView.as_view(), name="request-visit"),
    path("my-visit-requests/", MyVisitRequestsView.as_view(), name="my-visit-requests"),
    path("consulting-requests/", ConsultingRequestView.as_view(), name="consulting-requests"),
    path("image/<str:image_hash>/", PropertyImageServeView.as_view(), name="property-image-serve"),
    path("estimate/", PropertyEstimateView.as_view(), name="property-estimate"),
    path("", include(router.urls)),
]
from django.urls import path
from .views import ContractListView, ContractDetailView, ContractSignView, ContractPdfView

urlpatterns = [
    path("", ContractListView.as_view(), name="contract-list"),
    path("<uuid:pk>/", ContractDetailView.as_view(), name="contract-detail"),
    path("<uuid:pk>/sign/", ContractSignView.as_view(), name="contract-sign"),
    path("<uuid:pk>/pdf/", ContractPdfView.as_view(), name="contract-pdf"),
]

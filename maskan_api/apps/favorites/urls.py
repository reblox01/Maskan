from django.urls import path
from .views import FavoriteToggleView, FavoriteListView

urlpatterns = [
    path("toggle/<uuid:property_id>/", FavoriteToggleView.as_view(), name="favorite-toggle"),
    path("list/", FavoriteListView.as_view(), name="favorite-list"),
]

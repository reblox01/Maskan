from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.properties.models import Property
from .models import Favorite
from .serializers import FavoriteSerializer


class FavoriteToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, property_id):
        try:
            property_obj = Property.objects.get(pk=property_id)
        except Property.DoesNotExist:
            return Response(
                {"error": "Bien non trouvé."},
                status=status.HTTP_404_NOT_FOUND,
            )

        favorite, created = Favorite.objects.get_or_create(
            user=request.user,
            property=property_obj,
        )

        if not created:
            favorite.delete()
            return Response({"favorited": False, "message": "Retiré des favoris."})

        serializer = FavoriteSerializer(favorite)
        return Response(
            {"favorited": True, "favorite": serializer.data},
            status=status.HTTP_201_CREATED,
        )


class FavoriteListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        favorites = Favorite.objects.filter(user=request.user).select_related(
            "property", "property__agent"
        ).prefetch_related("property__images")
        serializer = FavoriteSerializer(favorites, many=True)
        return Response(serializer.data)

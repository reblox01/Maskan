import django.utils.timezone as tz
from django.contrib.auth import authenticate, get_user_model
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from rest_framework import status, generics, permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView as BaseTokenRefreshView

from .models import ApplicationField, AgentApplication
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    UserUpdateSerializer,
    AdminUserListSerializer,
    AdminUserUpdateSerializer,
    ApplicationFieldSerializer,
    ApplicationFieldReorderSerializer,
    AgentApplicationCreateSerializer,
    AgentApplicationDetailSerializer,
    AgentApplicationListSerializer,
    AgentApplicationReviewSerializer,
)

User = get_user_model()


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


@method_decorator(ratelimit(key="ip", rate="10/m", method="POST"), name="post")
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        selected_role = request.data.get("role", "client")
        if selected_role == "agent":
            AgentApplication.objects.create(user=user)

        tokens = get_tokens_for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": tokens["access"],
                "refresh": tokens["refresh"],
                "message": "Registration successful.",
            },
            status=status.HTTP_201_CREATED,
        )


@method_decorator(ratelimit(key="ip", rate="10/m", method="POST"), name="post")
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request,
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )

        if user is None:
            return Response(
                {"error": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        tokens = get_tokens_for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": tokens["access"],
                "refresh": tokens["refresh"],
                "message": "Login successful.",
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass
        return Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)


class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return UserUpdateSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user


class CookieTokenRefreshView(BaseTokenRefreshView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class DeveloperModeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"developer_mode": request.user.developer_mode})

    def patch(self, request):
        if request.user.role != "admin":
            return Response({"error": "Admin only."}, status=status.HTTP_403_FORBIDDEN)
        request.user.developer_mode = not request.user.developer_mode
        request.user.save(update_fields=["developer_mode"])
        return Response({"developer_mode": request.user.developer_mode})


class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserListSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        if self.request.user.role != "admin":
            return User.objects.none()
        qs = User.objects.all()
        role = self.request.query_params.get("role")
        search = self.request.query_params.get("search")
        if role and role != "all":
            qs = qs.filter(role=role)
        if search:
            qs = qs.filter(username__icontains=search) | qs.filter(email__icontains=search)
        return qs


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        if self.request.user.role != "admin":
            return User.objects.none()
        return User.objects.all()


class ApplicationFieldViewSet(viewsets.ModelViewSet):
    queryset = ApplicationField.objects.all()
    serializer_class = ApplicationFieldSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    lookup_field = "id"

    def get_queryset(self):
        if self.action == "active":
            return ApplicationField.objects.filter(is_active=True)
        if self.request.user.role != "admin":
            return ApplicationField.objects.filter(is_active=True)
        return ApplicationField.objects.all()

    def get_permissions(self):
        if self.action in ("active",):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def active(self, request):
        qs = ApplicationField.objects.filter(is_active=True).order_by("order", "created_at")
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    def reorder(self, request):
        if request.user.role != "admin":
            return Response({"error": "Admin only."}, status=status.HTTP_403_FORBIDDEN)
        serializer = ApplicationFieldReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.validated_data["order"]
        for i, field_id in enumerate(order):
            ApplicationField.objects.filter(id=field_id).update(order=i)
        return Response({"message": "Order updated."})


class AgentApplicationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            app = AgentApplication.objects.get(user=request.user)
            serializer = AgentApplicationDetailSerializer(app)
            return Response(serializer.data)
        except AgentApplication.DoesNotExist:
            return Response({"status": "none"}, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = AgentApplicationCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        application = serializer.save()
        return Response(
            AgentApplicationDetailSerializer(application).data,
            status=status.HTTP_201_CREATED,
        )


class AgentApplicationListView(generics.ListAPIView):
    serializer_class = AgentApplicationListSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        if self.request.user.role != "admin":
            return AgentApplication.objects.none()
        qs = AgentApplication.objects.select_related("user")
        status_filter = self.request.query_params.get("status")
        if status_filter and status_filter != "all":
            qs = qs.filter(status=status_filter)
        return qs


class AgentApplicationReviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        if request.user.role != "admin":
            return Response({"error": "Admin only."}, status=status.HTTP_403_FORBIDDEN)
        try:
            app = AgentApplication.objects.get(pk=pk)
        except AgentApplication.DoesNotExist:
            return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = AgentApplicationDetailSerializer(app)
        return Response(serializer.data)

    def patch(self, request, pk):
        if request.user.role != "admin":
            return Response({"error": "Admin only."}, status=status.HTTP_403_FORBIDDEN)
        try:
            app = AgentApplication.objects.get(pk=pk)
        except AgentApplication.DoesNotExist:
            return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = AgentApplicationReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data["status"]
        app.status = new_status
        app.admin_notes = serializer.validated_data.get("admin_notes", "")
        app.reviewed_at = tz.now()
        app.reviewed_by = request.user
        app.save()

        if new_status == "approved":
            app.user.role = "agent"
            app.user.save(update_fields=["role"])

        return Response(AgentApplicationDetailSerializer(app).data)

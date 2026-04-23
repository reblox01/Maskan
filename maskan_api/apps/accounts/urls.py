from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("profile/", views.ProfileView.as_view(), name="profile"),
    path("token/refresh/", views.CookieTokenRefreshView.as_view(), name="token-refresh"),

    # Role switch
    path("switch-role/", views.SwitchRoleView.as_view(), name="switch-role"),

    # Developer mode
    path("developer-mode/", views.DeveloperModeView.as_view(), name="developer-mode"),

    # Admin user management
    path("users/", views.AdminUserListView.as_view(), name="admin-user-list"),
    path("users/<uuid:id>/", views.AdminUserDetailView.as_view(), name="admin-user-detail"),

    # Application fields
    path("application-fields/", views.ApplicationFieldViewSet.as_view({
        "get": "list", "post": "create",
    }), name="application-field-list"),
    path("application-fields/active/", views.ApplicationFieldViewSet.as_view({
        "get": "active",
    }), name="application-field-active"),
    path("application-fields/reorder/", views.ApplicationFieldViewSet.as_view({
        "patch": "reorder",
    }), name="application-field-reorder"),
    path("application-fields/<uuid:id>/", views.ApplicationFieldViewSet.as_view({
        "get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy",
    }), name="application-field-detail"),

    # Vendeur application (client)
    path("vendeur-application/", views.VendeurApplicationView.as_view(), name="vendeur-application"),

    # Dashboard stats
    path("dashboard-stats/", views.DashboardStatsView.as_view(), name="dashboard-stats"),

    # Vendeur applications (admin)
    path("vendeur-applications/", views.VendeurApplicationListView.as_view(), name="vendeur-application-list"),
    path("vendeur-applications/<uuid:pk>/", views.VendeurApplicationReviewView.as_view(), name="vendeur-application-detail"),
]
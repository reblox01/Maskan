from rest_framework_simplejwt.authentication import JWTAuthentication


class CookiesJWTAuthentication(JWTAuthentication):
    """Authenticate using JWT from HttpOnly cookies instead of Authorization header."""

    def authenticate(self, request):
        from django.conf import settings

        cookie_name = settings.SIMPLE_JWT.get("AUTH_COOKIE", "access_token")
        token = request.COOKIES.get(cookie_name)

        if token is None:
            return None

        validated_token = self.get_validated_token(token)
        return self.get_user(validated_token), validated_token

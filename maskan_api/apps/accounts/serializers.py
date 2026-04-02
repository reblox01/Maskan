import re
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import ApplicationField, AgentApplication, ApplicationResponse

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    """User registration — always creates client role."""

    email = serializers.EmailField(max_length=254)
    username = serializers.CharField(min_length=3, max_length=30)
    password = serializers.CharField(write_only=True, min_length=8, max_length=128)
    password_confirm = serializers.CharField(write_only=True, max_length=128)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=["client", "agent"], default="client")

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower().strip()

    def validate_username(self, value):
        value = value.strip()
        if not re.match(r"^[a-zA-Z0-9_]+$", value):
            raise serializers.ValidationError(
                "Username may only contain letters, numbers, and underscores."
            )
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_phone(self, value):
        if value and not re.match(r"^\+?[\d\s\-()]{6,20}$", value):
            raise serializers.ValidationError("Enter a valid phone number.")
        return value.strip()

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate(self, data):
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        validated_data.pop("role", None)
        user = User.objects.create_user(
            email=validated_data["email"],
            username=validated_data["username"],
            password=validated_data["password"],
            phone=validated_data.get("phone", ""),
            role="client",
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        return value.lower().strip()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "email", "username", "phone", "role",
            "is_verified", "avatar", "bio", "address", "city", "region",
            "developer_mode", "created_at",
        ]
        read_only_fields = ["id", "email", "role", "is_verified", "developer_mode", "created_at"]


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "phone", "avatar", "bio", "address", "city", "region"]

    def validate_username(self, value):
        value = value.strip()
        if not re.match(r"^[a-zA-Z0-9_]+$", value):
            raise serializers.ValidationError(
                "Username may only contain letters, numbers, and underscores."
            )
        qs = User.objects.filter(username__iexact=value).exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This username is already taken.")
        return value


class AdminUserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "email", "username", "phone", "role",
            "is_verified", "is_active", "developer_mode", "created_at",
        ]


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["role", "is_verified", "is_active"]


class ApplicationFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationField
        fields = [
            "id", "label", "field_type", "placeholder", "help_text",
            "choices", "is_required", "order", "is_active", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ApplicationFieldReorderSerializer(serializers.Serializer):
    order = serializers.ListField(child=serializers.UUIDField(), allow_empty=False)


class ApplicationResponseSerializer(serializers.ModelSerializer):
    field = ApplicationFieldSerializer(read_only=True)
    field_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = ApplicationResponse
        fields = ["id", "field", "field_id", "value"]
        read_only_fields = ["id"]


class AgentApplicationCreateSerializer(serializers.Serializer):
    responses = serializers.ListField(child=serializers.DictField(), allow_empty=False)

    def validate_responses(self, value):
        active_fields = {str(f.id): f for f in ApplicationField.objects.filter(is_active=True)}
        provided_field_ids = {r.get("field_id") for r in value if r.get("field_id")}

        for field_id, field in active_fields.items():
            if field.is_required and field_id not in provided_field_ids:
                raise serializers.ValidationError(f"Le champ '{field.label}' est obligatoire.")

        for resp in value:
            field_id = resp.get("field_id")
            resp_value = resp.get("value", "")
            if field_id not in active_fields:
                raise serializers.ValidationError(f"Champ invalide: {field_id}")
            field = active_fields[field_id]
            if field.field_type == "number" and resp_value:
                try:
                    float(resp_value)
                except (ValueError, TypeError):
                    raise serializers.ValidationError(f"'{field.label}' doit être un nombre.")
            if field.field_type == "select" and resp_value:
                if resp_value not in field.choices:
                    raise serializers.ValidationError(f"'{field.label}': valeur invalide.")
        return value

    def create(self, validated_data):
        user = self.context["request"].user
        responses_data = validated_data["responses"]

        if hasattr(user, "agent_application"):
            existing = user.agent_application
            if existing.status == "pending":
                raise serializers.ValidationError("Vous avez déjà une demande en cours.")
            if existing.status == "approved":
                raise serializers.ValidationError("Vous êtes déjà agent.")
            existing.delete()

        application = AgentApplication.objects.create(user=user)
        for resp_data in responses_data:
            ApplicationResponse.objects.create(
                application=application,
                field_id=resp_data["field_id"],
                value=resp_data.get("value", ""),
            )
        return application


class AgentApplicationDetailSerializer(serializers.ModelSerializer):
    responses = ApplicationResponseSerializer(many=True, read_only=True)
    user = UserSerializer(read_only=True)
    reviewed_by = UserSerializer(read_only=True)

    class Meta:
        model = AgentApplication
        fields = [
            "id", "user", "status", "admin_notes",
            "created_at", "reviewed_at", "reviewed_by", "responses",
        ]


class AgentApplicationListSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = AgentApplication
        fields = ["id", "user", "status", "created_at", "reviewed_at"]


class AgentApplicationReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["approved", "rejected"])
    admin_notes = serializers.CharField(required=False, allow_blank=True, default="")

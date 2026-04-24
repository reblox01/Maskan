import uuid
import hashlib
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone as tz


class Migration(migrations.Migration):

    dependencies = [
        ("properties", "0005_remove_property_properties__status_6c6bfe_idx_and_more"),
        ("accounts", "0004_rename_wilaya_user_region"),
    ]

    operations = [
        migrations.AddField(
            model_name="property",
            name="listing_type",
            field=models.CharField(
                choices=[("vendre", "À vendre"), ("louer", "À louer")],
                db_index=True,
                default="vendre",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="property",
            name="room_label_format",
            field=models.CharField(
                choices=[
                    ("classic", "Classique (Appartement/Villa)"),
                    ("number", "Numéro (F3/T2)"),
                ],
                default="classic",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="property",
            name="consulting_enabled",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="property",
            name="consulting_is_free",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="property",
            name="consulting_price",
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                max_digits=10,
                null=True,
                validators=[MinValueValidator(0)],
            ),
        ),
        migrations.CreateModel(
            name="VisitRequest",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("scheduled_date", models.DateTimeField()),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "En attente"),
                            ("confirmed", "Confirmé"),
                            ("completed", "Terminé"),
                            ("cancelled", "Annulé"),
                        ],
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "property",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="visit_requests",
                        to="properties.property",
                    ),
                ),
                (
                    "client",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="visit_requests",
                        to="accounts.user",
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
                "unique_together": {("property", "client", "status")},
            },
        ),
        migrations.CreateModel(
            name="ConsultingRequest",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "consulting_type",
                    models.CharField(
                        choices=[
                            ("valuation", "Évaluation Immobilière"),
                            ("legal", "Conseil Juridique"),
                            ("investment", "Conseil en Investissement"),
                            ("management", "Gestion Immobilière"),
                            ("other", "Autre"),
                        ],
                        max_length=20,
                    ),
                ),
                ("is_free", models.BooleanField(default=True)),
                (
                    "price",
                    models.DecimalField(
                        blank=True, decimal_places=2, max_digits=10, null=True
                    ),
                ),
                ("scheduled_date", models.DateTimeField(blank=True, null=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "En attente"),
                            ("confirmed", "Confirmé"),
                            ("in_progress", "En cours"),
                            ("completed", "Terminé"),
                            ("cancelled", "Annulé"),
                        ],
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("client_notes", models.TextField(blank=True)),
                ("admin_response", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "property",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="consulting_requests",
                        to="properties.property",
                    ),
                ),
                (
                    "client",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="consulting_requests",
                        to="accounts.user",
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
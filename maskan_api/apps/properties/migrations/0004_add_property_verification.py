import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("properties", "0003_rename_wilaya_property_region"),
    ]

    operations = [
        migrations.AddField(
            model_name="property",
            name="rejection_reason",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="property",
            name="reviewed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="property",
            name="reviewed_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="reviewed_properties",
                to="accounts.user",
            ),
        ),
        migrations.AddField(
            model_name="property",
            name="verification_status",
            field=models.CharField(
                choices=[("pending", "En attente"), ("approved", "Approuvé"), ("rejected", "Rejeté")],
                default="pending",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="property",
            name="is_verified",
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name="property",
            name="is_published",
            field=models.BooleanField(default=False),
        ),
    ]
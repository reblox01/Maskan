from django.db import migrations


def migrate_roles(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    for user in User.objects.all():
        if user.role == "client":
            user.role = "acquereur"
        elif user.role == "agent":
            user.role = "vendeur"
        user.save(update_fields=["role"])


def rollback_roles(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    for user in User.objects.all():
        if user.role == "acquereur":
            user.role = "client"
        elif user.role == "vendeur":
            user.role = "agent"
        user.save(update_fields=["role"])


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0004_rename_wilaya_user_region"),
    ]

    operations = [
        migrations.RunPython(migrate_roles, rollback_roles),
    ]
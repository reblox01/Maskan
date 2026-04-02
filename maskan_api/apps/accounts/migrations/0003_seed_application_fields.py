from django.db import migrations


def seed_application_fields(apps, schema_editor):
    ApplicationField = apps.get_model("accounts", "ApplicationField")

    fields = [
        {
            "label": "Nom de l'agence",
            "field_type": "text",
            "placeholder": "Ex: Immobilier Atlas",
            "help_text": "Le nom de votre agence immobilière",
            "is_required": True,
            "order": 1,
        },
        {
            "label": "Numéro de licence professionnelle",
            "field_type": "text",
            "placeholder": "Ex: LIC-2024-XXXX",
            "help_text": "Votre numéro de licence officiel",
            "is_required": True,
            "order": 2,
        },
        {
            "label": "Années d'expérience",
            "field_type": "number",
            "placeholder": "Ex: 5",
            "help_text": "Nombre d'années dans l'immobilier",
            "is_required": True,
            "order": 3,
        },
        {
            "label": "Villes d'intervention",
            "field_type": "text",
            "placeholder": "Casablanca, Marrakech...",
            "help_text": "Les villes ou vous opérez",
            "is_required": False,
            "order": 4,
        },
        {
            "label": "Présentation",
            "field_type": "textarea",
            "placeholder": "Parlez-nous de votre activité...",
            "help_text": "Une breve presentation de votre parcours",
            "is_required": False,
            "order": 5,
        },
    ]

    for f in fields:
        ApplicationField.objects.create(**f)


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_applicationfield_user_address_user_bio_user_city_and_more"),
    ]

    operations = [
        migrations.RunPython(seed_application_fields, migrations.RunPython.noop),
    ]

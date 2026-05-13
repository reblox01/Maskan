from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('properties', '0009_add_rejected_status'),
    ]

    operations = [
        migrations.AlterModelTable(
            name='visitrequest',
            table='visits_visitrequest',
        ),
        migrations.AlterField(
            model_name='visitrequest',
            name='related_property',
            field=models.ForeignKey(db_column='property_id', on_delete=models.CASCADE, related_name='visit_requests', to='properties.property'),
        ),
    ]

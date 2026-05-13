from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('properties', '0010_fix_visitrequest_db_table'),
    ]

    operations = [
        migrations.RunSQL(
            "DROP TABLE IF EXISTS visits_visitrequest CASCADE",
            "SELECT 1",
        ),
        migrations.CreateModel(
            name='VisitRequest',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('scheduled_date', models.DateTimeField()),
                ('status', models.CharField(choices=[('pending', 'En attente'), ('confirmed', 'Confirmé'), ('completed', 'Terminé'), ('cancelled', 'Annulé'), ('rejected', 'Refusé')], default='pending', max_length=20)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('client', models.ForeignKey(on_delete=models.CASCADE, related_name='visit_requests', to='accounts.user')),
                ('related_property', models.ForeignKey(db_column='property_id', on_delete=models.CASCADE, related_name='visit_requests', to='properties.property')),
            ],
            options={
                'db_table': 'visits_visitrequest',
                'ordering': ['-created_at'],
                'unique_together': {('related_property', 'client', 'status')},
            },
        ),
    ]

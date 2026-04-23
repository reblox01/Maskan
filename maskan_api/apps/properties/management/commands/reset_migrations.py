from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Reset properties migrations'

    def handle(self, *args, **options):
        cursor = connection.cursor()
        cursor.execute("DELETE FROM django_migrations WHERE app = 'properties'")
        self.stdout.write(self.style.SUCCESS('Deleted migration records for properties'))
        
        # Run migrate
        from django.core.management import call_command
        call_command('migrate', 'properties')
        self.stdout.write(self.style.SUCCESS('Migrations applied'))
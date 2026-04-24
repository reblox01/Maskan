from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Add missing columns to properties_property table'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Add listing_type column
            cursor.execute("""
                ALTER TABLE properties_property 
                ADD COLUMN IF NOT EXISTS listing_type VARCHAR(10) DEFAULT 'vendre';
            """)
            self.stdout.write(self.style.SUCCESS('Added listing_type column'))

            # Add room_label_format column
            cursor.execute("""
                ALTER TABLE properties_property 
                ADD COLUMN IF NOT EXISTS room_label_format VARCHAR(10) DEFAULT 'classic';
            """)
            self.stdout.write(self.style.SUCCESS('Added room_label_format column'))

            # Add consulting_enabled column
            cursor.execute("""
                ALTER TABLE properties_property 
                ADD COLUMN IF NOT EXISTS consulting_enabled BOOLEAN DEFAULT FALSE;
            """)
            self.stdout.write(self.style.SUCCESS('Added consulting_enabled column'))

            # Add consulting_is_free column
            cursor.execute("""
                ALTER TABLE properties_property 
                ADD COLUMN IF NOT EXISTS consulting_is_free BOOLEAN DEFAULT TRUE;
            """)
            self.stdout.write(self.style.SUCCESS('Added consulting_is_free column'))

            # Add consulting_price column
            cursor.execute("""
                ALTER TABLE properties_property 
                ADD COLUMN IF NOT EXISTS consulting_price DECIMAL(10,2) NULL;
            """)
            self.stdout.write(self.style.SUCCESS('Added consulting_price column'))

            # Add verification columns
            cursor.execute("""
                ALTER TABLE properties_property 
                ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending';
            """)
            self.stdout.write(self.style.SUCCESS('Added verification_status column'))

            cursor.execute("""
                ALTER TABLE properties_property 
                ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL;
            """)
            self.stdout.write(self.style.SUCCESS('Added rejection_reason column'))

            cursor.execute("""
                ALTER TABLE properties_property 
                ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP NULL;
            """)
            self.stdout.write(self.style.SUCCESS('Added reviewed_at column'))

            cursor.execute("""
                ALTER TABLE properties_property 
                ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP NULL;
            """)
            self.stdout.write(self.style.SUCCESS('Added verified_at column'))
            self.stdout.write(self.style.SUCCESS('Added verified_at column'))

            cursor.execute("""
                ALTER TABLE properties_property 
                ADD COLUMN IF NOT EXISTS reviewed_by_id UUID NULL;
            """)
            self.stdout.write(self.style.SUCCESS('Added reviewed_by_id column'))

            cursor.execute("""
                ALTER TABLE properties_property 
                ALTER COLUMN floor SET DEFAULT 0;
            """)
            self.stdout.write(self.style.SUCCESS('Set default for floor'))

            cursor.execute("""
                ALTER TABLE properties_property 
                ALTER COLUMN charges_included SET DEFAULT FALSE;
            """)
            self.stdout.write(self.style.SUCCESS('Set default for charges_included'))

            self.stdout.write(self.style.SUCCESS('All columns added successfully!'))
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.db import connection

cursor = connection.cursor()

# Create visitrequest table
cursor.execute("""
CREATE TABLE IF NOT EXISTS properties_visitrequest (
    id uuid PRIMARY KEY,
    scheduled_date timestamp with time zone NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'pending',
    notes text NOT NULL DEFAULT '',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    related_property_id uuid NOT NULL REFERENCES properties_property(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES accounts_user(id) ON DELETE CASCADE
);
""")
print("Created properties_visitrequest table")

# Create consultingrequest table
cursor.execute("""
CREATE TABLE IF NOT EXISTS properties_consultingrequest (
    id uuid PRIMARY KEY,
    consulting_type varchar(20) NOT NULL,
    is_free boolean NOT NULL DEFAULT true,
    price numeric(10, 2),
    scheduled_date timestamp with time zone,
    status varchar(20) NOT NULL DEFAULT 'pending',
    client_notes text NOT NULL DEFAULT '',
    admin_response text NOT NULL DEFAULT '',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    related_property_id uuid REFERENCES properties_property(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES accounts_user(id) ON DELETE CASCADE
);
""")
print("Created properties_consultingrequest table")

# Add unique constraint for visitrequest
cursor.execute("""
DO $$ BEGIN
    ALTER TABLE properties_visitrequest 
    ADD CONSTRAINT properties_visitrequest_unique 
    UNIQUE (related_property_id, client_id, status);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
""")
print("Added unique constraint to visitrequest")

print("Done!")

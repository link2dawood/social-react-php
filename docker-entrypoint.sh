#!/bin/bash
set -e

# Wait for database to be ready (if using external DB)
# For SQLite, we just need to ensure the directory exists

# Initialize database if it doesn't exist
if [ ! -f /var/www/html/backend/database.db ]; then
    echo "Initializing database..."
    cd /var/www/html/backend
    php init.php || true
    php migrate_schema.php || true
fi

# Set permissions (handle case where database doesn't exist yet)
if [ -f /var/www/html/backend/database.db ]; then
    chown www-data:www-data /var/www/html/backend/database.db || true
    chmod 666 /var/www/html/backend/database.db || true
fi

chown -R www-data:www-data /var/www/html/backend/uploads || true
chmod 755 /var/www/html/backend/uploads || true

# Start Apache
exec apache2-foreground


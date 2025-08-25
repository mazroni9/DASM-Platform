#!/bin/bash
set -e

# Create storage logs directory if it doesn't exist and set permissions
mkdir -p /var/www/html/storage/logs
chown -R www:www /var/www/html/storage
chmod -R 775 /var/www/html/storage

# Generate application key if not set
if [ -z "$APP_KEY" ]; then
    php artisan key:generate --no-ansi -n
fi

# Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations if needed (only in production with --force)
if [ "$APP_ENV" = "production" ]; then
    # Then run all other migrations
    php artisan migrate --force
fi

# Make sure the queue jobs table exists
php artisan migrate --path=database/migrations/0001_01_01_000002_create_jobs_table.php --force 2>/dev/null || true

# Execute the passed command
exec "$@"

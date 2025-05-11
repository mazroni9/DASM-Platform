#!/bin/bash
set -e

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
    # First run the complete schema migration which creates all necessary tables
    php artisan migrate --path=database/migrations/2025_03_22_000000_create_complete_schema.php --force
    
    # Then run all other migrations
    php artisan migrate --force
fi

# Execute the passed command
exec "$@"
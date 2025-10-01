#!/bin/bash

# Laravel Production Optimization Script
# Run this after deployment to eliminate cold start delays

echo "🚀 Optimizing Laravel for production..."

# Clear all caches first
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Generate optimized autoloader
composer install --optimize-autoloader --no-dev

# Cache configuration files
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views
php artisan view:cache

# Optimize Composer autoloader
composer dump-autoload --optimize

echo "✅ Laravel optimization complete!"
echo ""
echo "📋 Additional recommendations:"
echo "1. Set APP_DEBUG=false in .env"
echo "2. Set CACHE_STORE=redis in .env"
echo "3. Set SESSION_DRIVER=redis in .env"
echo "4. Set QUEUE_CONNECTION=redis in .env"
echo "5. Enable opcache in php.ini"
echo "6. Run this script after every deployment"

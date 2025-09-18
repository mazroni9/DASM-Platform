@echo off
REM Laravel Production Optimization Script for Windows
REM Run this after deployment to eliminate cold start delays

echo Optimizing Laravel for production...

REM Clear all caches first
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

REM Generate optimized autoloader
composer install --optimize-autoloader --no-dev

REM Cache configuration files
php artisan config:cache

REM Cache routes
php artisan route:cache

REM Cache views
php artisan view:cache

REM Optimize Composer autoloader
composer dump-autoload --optimize

echo Laravel optimization complete!
echo.
echo Additional recommendations:
echo 1. Set APP_DEBUG=false in .env
echo 2. Set CACHE_STORE=database in .env (or install Redis extension for better performance)
echo 3. Set SESSION_DRIVER=database in .env (or install Redis extension for better performance)
echo 4. Set QUEUE_CONNECTION=database in .env (or install Redis extension for better performance)
echo 5. Enable opcache in php.ini
echo 6. Set LOG_LEVEL=error in .env for production
echo 7. Set RATE_LIMITING_ENABLED=true in .env
echo 8. Set PERFORMANCE_METRICS=false in .env (enable only for debugging)
echo 9. Run this script after every deployment
echo.
echo Performance enhancements applied:
echo - Security headers middleware
echo - API response caching
echo - Performance monitoring
echo - Request optimization
echo.
echo NOTE: If you want to use Redis, install the PHP Redis extension first:
echo Windows: Download php_redis.dll and add extension=redis to php.ini
echo Linux: sudo apt-get install php-redis

pause

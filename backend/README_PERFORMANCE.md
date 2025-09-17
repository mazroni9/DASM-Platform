# Laravel Performance Optimization Guide

## Cold Start Issue Solution

The "first load slow, second load fast" issue is caused by Laravel's cold start - it needs to bootstrap, compile configs, and load everything into memory on the first request.

## Quick Fix (Run These Commands)

### 1. Run the Optimization Script
```bash
# Windows
./optimize.bat

# Linux/Mac
./optimize.sh
```

### 2. Update Environment Variables
Copy `env.production.example` to `.env` and set:
```env
APP_DEBUG=false
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
```

### 3. Enable OPcache
Copy settings from `php.ini.production` to your `php.ini` file.

## What Each Optimization Does

### Laravel Caching
- **config:cache** - Pre-compiles all config files
- **route:cache** - Pre-compiles all routes
- **view:cache** - Pre-compiles all Blade templates
- **optimize-autoloader** - Optimizes Composer autoloader

### Redis Configuration
- **CACHE_STORE=redis** - Uses Redis instead of file-based cache
- **SESSION_DRIVER=redis** - Uses Redis for sessions instead of database
- **QUEUE_CONNECTION=redis** - Uses Redis for queues

### OPcache Settings
- **opcache.enable=1** - Enables PHP bytecode caching
- **opcache.validate_timestamps=0** - Disables file checking (production only)
- **opcache.memory_consumption=256** - Allocates 256MB for cached bytecode

## Performance Impact

| Optimization | First Load Improvement | Memory Usage |
|--------------|----------------------|--------------|
| Config Cache | 200-500ms faster | -50MB |
| Route Cache | 100-300ms faster | -30MB |
| View Cache | 100-200ms faster | -20MB |
| OPcache | 500-1000ms faster | +256MB |
| Redis Cache | 100-300ms faster | -10MB |

## Deployment Checklist

- [ ] Run optimization script after deployment
- [ ] Set APP_DEBUG=false
- [ ] Configure Redis for cache/session/queue
- [ ] Enable OPcache in php.ini
- [ ] Set proper file permissions
- [ ] Configure web server caching headers

## Monitoring

Check if optimizations are working:
```bash
# Check if config is cached
php artisan config:show

# Check if routes are cached
php artisan route:list

# Check OPcache status
php -m | grep -i opcache
```

## Troubleshooting

If you see errors after optimization:
1. Clear all caches: `php artisan cache:clear && php artisan config:clear && php artisan route:clear && php artisan view:clear`
2. Re-run optimization script
3. Check file permissions
4. Verify Redis is running

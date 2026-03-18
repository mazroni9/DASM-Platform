# Laravel with Supervisor in Docker

This Docker setup runs Laravel with Supervisor managing multiple processes:

## Services Managed by Supervisor

1. **Laravel Queue Worker** (`laravel-worker`)
   - Processes queued jobs from the database
   - Runs 2 worker processes
   - Auto-restarts on failure
   - Logs to: `/var/www/html/storage/logs/worker.log`

2. **Laravel Scheduler** (`laravel-scheduler`)
   - Runs `php artisan schedule:run` every minute
   - Executes scheduled tasks defined in `routes/console.php`
   - Logs to: `/var/www/html/storage/logs/scheduler.log`

3. **PHP Development Server** (`php-server`)
   - Runs the Laravel development server on port 8000
   - Handles HTTP requests
   - Logs to: `/var/www/html/storage/logs/php-server.log`

## Supervisor Commands

When inside the running container, you can use these commands:

```bash
# Check status of all services
supervisorctl status

# Start a specific service
supervisorctl start laravel-worker
supervisorctl start laravel-scheduler
supervisorctl start php-server

# Stop a specific service
supervisorctl stop laravel-worker
supervisorctl stop laravel-scheduler
supervisorctl stop php-server

# Restart a specific service
supervisorctl restart laravel-worker
supervisorctl restart laravel-scheduler
supervisorctl restart php-server

# Restart all services
supervisorctl restart all

# View logs in real-time
supervisorctl tail -f laravel-worker
supervisorctl tail -f laravel-scheduler
supervisorctl tail -f php-server

# Reload supervisor configuration
supervisorctl reread
supervisorctl update
```

## Log Files

- Supervisor main log: `/var/log/supervisor/supervisord.log`
- Laravel Worker logs: `/var/www/html/storage/logs/worker.log`
- Laravel Scheduler logs: `/var/www/html/storage/logs/scheduler.log`
- PHP Server logs: `/var/www/html/storage/logs/php-server.log`
- Laravel application logs: `/var/www/html/storage/logs/laravel.log`

## Building and Running

```bash
# Build the Docker image
docker build -t dasm-laravel .

# Run the container
docker run -d -p 8000:8000 --name dasm-app dasm-laravel

# Check container logs
docker logs dasm-app

# Enter the container to run supervisor commands
docker exec -it dasm-app bash
```

## Scheduled Jobs

The following jobs are scheduled in `routes/console.php`:

- `UpdateCarAuctionJob('instant')` - Daily at 19:00 Asia/Riyadh timezone
- `UpdateCarAuctionJob('late')` - Daily at 22:00 Asia/Riyadh timezone  
- `UpdateCarAuctionJob('live')` - Every minute

## Configuration Files

- `/etc/supervisor/supervisord.conf` - Main supervisor configuration
- `/etc/supervisor/conf.d/laravel-worker.conf` - Queue worker configuration
- `/etc/supervisor/conf.d/laravel-scheduler.conf` - Scheduler configuration
- `/etc/supervisor/conf.d/php-server.conf` - PHP server configuration

## Troubleshooting

1. **Queue not processing jobs**:
   ```bash
   supervisorctl status laravel-worker
   supervisorctl tail laravel-worker
   ```

2. **Scheduled tasks not running**:
   ```bash
   supervisorctl status laravel-scheduler
   supervisorctl tail laravel-scheduler
   ```

3. **Web server not responding**:
   ```bash
   supervisorctl status php-server
   supervisorctl tail php-server
   ```

4. **Check Laravel logs**:
   ```bash
   tail -f /var/www/html/storage/logs/laravel.log
   ```

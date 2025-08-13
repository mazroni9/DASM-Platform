#!/bin/bash

# Build and run DASM Laravel application with Supervisor

echo "Building DASM Laravel Docker image..."
docker build -t dasm-laravel .

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"

    echo "Stopping any existing container..."
    docker stop dasm-app 2>/dev/null || true
    docker rm dasm-app 2>/dev/null || true

    echo "Starting new container..."
    docker run -d \
        -p 8000:8000 \
        --name dasm-app \
        --restart unless-stopped \
        dasm-laravel

    if [ $? -eq 0 ]; then
        echo "✅ Container started successfully!"
        echo ""
        echo "🌐 Application is available at: http://localhost:8000"
        echo ""
        echo "📋 Useful commands:"
        echo "  View logs:           docker logs -f dasm-app"
        echo "  Enter container:     docker exec -it dasm-app bash"
        echo "  Check supervisor:    docker exec -it dasm-app supervisorctl status"
        echo "  Stop container:      docker stop dasm-app"
        echo ""
        echo "📁 Log files inside container:"
        echo "  Supervisor:          /var/log/supervisor/supervisord.log"
        echo "  Laravel Worker:      /var/www/html/storage/logs/worker.log"
        echo "  Laravel Scheduler:   /var/www/html/storage/logs/scheduler.log"
        echo "  PHP Server:          /var/www/html/storage/logs/php-server.log"
        echo "  Laravel App:         /var/www/html/storage/logs/laravel.log"
    else
        echo "❌ Failed to start container"
        exit 1
    fi
else
    echo "❌ Build failed"
    exit 1
fi

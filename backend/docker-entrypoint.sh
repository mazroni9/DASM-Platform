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
    # Create a temporary PHP script to run a raw SQL query to disable foreign key checks
    cat > /tmp/disable_fk.php << 'EOF'
<?php
$host = getenv('DB_HOST');
$port = getenv('DB_PORT');
$database = getenv('DB_DATABASE');
$username = getenv('DB_USERNAME');
$password = getenv('DB_PASSWORD');

try {
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$database", $username, $password);
    $pdo->exec('SET session_replication_role = replica;');
    echo "Foreign key checks disabled successfully\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
EOF

    # Execute the script to disable foreign key checks
    php /tmp/disable_fk.php
    
    # Run all migrations with --force flag
    php artisan migrate --force
    
    # Create a temporary PHP script to enable foreign key checks
    cat > /tmp/enable_fk.php << 'EOF'
<?php
$host = getenv('DB_HOST');
$port = getenv('DB_PORT');
$database = getenv('DB_DATABASE');
$username = getenv('DB_USERNAME');
$password = getenv('DB_PASSWORD');

try {
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$database", $username, $password);
    $pdo->exec('SET session_replication_role = DEFAULT;');
    echo "Foreign key checks enabled successfully\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
EOF

    # Execute the script to enable foreign key checks
    php /tmp/enable_fk.php
fi

# Execute the passed command
exec "$@"
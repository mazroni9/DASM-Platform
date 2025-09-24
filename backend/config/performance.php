<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Performance Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains performance-related configurations for the Laravel
    | application to optimize speed and resource usage.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Database Query Optimization
    |--------------------------------------------------------------------------
    */
    'database' => [
        'query_logging' => env('DB_QUERY_LOG', false),
        'slow_query_threshold' => env('DB_SLOW_QUERY_THRESHOLD', 1000), // milliseconds
        'connection_pooling' => env('DB_CONNECTION_POOLING', true),
        'prepared_statements' => env('DB_PREPARED_STATEMENTS', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache Configuration
    |--------------------------------------------------------------------------
    */
    'cache' => [
        'default_ttl' => env('CACHE_DEFAULT_TTL', 3600), // 1 hour
        'api_ttl' => env('CACHE_API_TTL', 300), // 5 minutes
        'view_ttl' => env('CACHE_VIEW_TTL', 1800), // 30 minutes
        'route_ttl' => env('CACHE_ROUTE_TTL', 86400), // 24 hours
        'config_ttl' => env('CACHE_CONFIG_TTL', 86400), // 24 hours
    ],

    /*
    |--------------------------------------------------------------------------
    | Session Optimization
    |--------------------------------------------------------------------------
    */
    'session' => [
        'lifetime' => env('SESSION_LIFETIME', 120), // 2 hours
        'encrypt' => env('SESSION_ENCRYPT', false),
        'secure' => env('SESSION_SECURE', false),
        'http_only' => env('SESSION_HTTP_ONLY', true),
        'same_site' => env('SESSION_SAME_SITE', 'lax'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Memory and Resource Limits
    |--------------------------------------------------------------------------
    */
    'memory' => [
        'max_execution_time' => env('MAX_EXECUTION_TIME', 30),
        'memory_limit' => env('MEMORY_LIMIT', '256M'),
        'max_input_vars' => env('MAX_INPUT_VARS', 3000),
    ],

    /*
    |--------------------------------------------------------------------------
    | API Rate Limiting
    |--------------------------------------------------------------------------
    */
    'rate_limiting' => [
        'enabled' => env('RATE_LIMITING_ENABLED', true),
        'default_limit' => env('RATE_LIMIT_DEFAULT', 60), // requests per minute
        'auth_limit' => env('RATE_LIMIT_AUTH', 5), // login attempts per minute
        'api_limit' => env('RATE_LIMIT_API', 100), // API requests per minute
    ],

    /*
    |--------------------------------------------------------------------------
    | File Upload Optimization
    |--------------------------------------------------------------------------
    */
    'uploads' => [
        'max_file_size' => env('MAX_FILE_SIZE', 10240), // 10MB in KB
        'allowed_extensions' => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx'],
        'image_compression' => env('IMAGE_COMPRESSION', true),
        'image_quality' => env('IMAGE_QUALITY', 85),
    ],

    /*
    |--------------------------------------------------------------------------
    | Queue Optimization
    |--------------------------------------------------------------------------
    */
    'queue' => [
        'max_tries' => env('QUEUE_MAX_TRIES', 3),
        'timeout' => env('QUEUE_TIMEOUT', 60),
        'retry_after' => env('QUEUE_RETRY_AFTER', 90),
        'batch_size' => env('QUEUE_BATCH_SIZE', 100),
    ],

    /*
    |--------------------------------------------------------------------------
    | Logging Configuration
    |--------------------------------------------------------------------------
    */
    'logging' => [
        'level' => env('LOG_LEVEL', 'error'),
        'slow_queries' => env('LOG_SLOW_QUERIES', true),
        'performance_metrics' => env('LOG_PERFORMANCE_METRICS', false),
        'api_requests' => env('LOG_API_REQUESTS', false),
    ],
];

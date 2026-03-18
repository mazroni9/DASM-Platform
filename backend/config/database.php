<?php

use Illuminate\Support\Str;

/**
 * ملاحظات مهمة على قسم Redis:
 * - بنبني مصفوفات الاتصال بعد تصفية القيم الفارغة (null أو '')،
 *   عشان ما نوصلش Predis بـ scheme='' أو url='' (بيسبب Unknown connection scheme: '').
 * - لو محتاج TLS: إمّا تحط REDIS_SCHEME=tls أو تستخدم rediss:// في REDIS_URL.
 */

$redisUrl     = env('REDIS_URL');
$redisScheme  = env('REDIS_SCHEME'); // tls | tcp | unix | (فارغ)
$useSsl       = ($redisScheme === 'tls') || Str::startsWith((string) $redisUrl, 'rediss://');

// helper لتصفية القيم الفارغة من مصفوفة الاتصال
$filterEmpty = function (array $arr) {
    return array_filter($arr, function ($v) {
        return !is_null($v) && $v !== '';
    });
};

// اتصالات Redis بعد التصفية
$redisDefault = $filterEmpty([
    'url'      => $redisUrl,                   // لو فاضي بيتشال
    'scheme'   => $redisScheme,                // لو فاضي بيتشال ويستخدم Predis الافتراضي (tcp)
    'host'     => env('REDIS_HOST', '127.0.0.1'),
    'username' => env('REDIS_USERNAME'),
    'password' => env('REDIS_PASSWORD'),
    'port'     => env('REDIS_PORT', '6379'),
    'database' => env('REDIS_DB', '0'),
]);

$redisCache = $filterEmpty([
    'url'      => $redisUrl,
    'scheme'   => $redisScheme,
    'host'     => env('REDIS_HOST', '127.0.0.1'),
    'username' => env('REDIS_USERNAME'),
    'password' => env('REDIS_PASSWORD'),
    'port'     => env('REDIS_PORT', '6379'),
    'database' => env('REDIS_CACHE_DB', '1'),
]);

return [

    /*
    |--------------------------------------------------------------------------
    | Default Database Connection Name
    |--------------------------------------------------------------------------
    */
    'default' => env('DB_CONNECTION', 'sqlite'),

    /*
    |--------------------------------------------------------------------------
    | Database Connections
    |--------------------------------------------------------------------------
    */
    'connections' => [

        'sqlite' => [
            'driver' => 'sqlite',
            'url' => env('DB_URL'),
            'database' => env('DB_DATABASE', database_path('database.sqlite')),
            'prefix' => '',
            'foreign_key_constraints' => env('DB_FOREIGN_KEYS', true),
            'busy_timeout' => null,
            'journal_mode' => null,
            'synchronous' => null,
        ],

        'mysql' => [
            'driver' => 'mysql',
            'url' => env('DB_URL'),
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '3306'),
            'database' => env('DB_DATABASE', 'laravel'),
            'username' => env('DB_USERNAME', 'root'),
            'password' => env('DB_PASSWORD', ''),
            'unix_socket' => env('DB_SOCKET', ''),
            'charset' => env('DB_CHARSET', 'utf8mb4'),
            'collation' => env('DB_COLLATION', 'utf8mb4_unicode_ci'),
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => true,
            'engine' => null,
            'options' => extension_loaded('pdo_mysql') ? array_filter([
                PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
            ]) : [],
        ],

        'mariadb' => [
            'driver' => 'mariadb',
            'url' => env('DB_URL'),
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '3306'),
            'database' => env('DB_DATABASE', 'laravel'),
            'username' => env('DB_USERNAME', 'root'),
            'password' => env('DB_PASSWORD', ''),
            'unix_socket' => env('DB_SOCKET', ''),
            'charset' => env('DB_CHARSET', 'utf8mb4'),
            'collation' => env('DB_COLLATION', 'utf8mb4_unicode_ci'),
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => true,
            'engine' => null,
            'options' => extension_loaded('pdo_mysql') ? array_filter([
                PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
            ]) : [],
        ],

        'pgsql' => [
            'driver' => 'pgsql',
            'url' => env('DB_URL'),
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '5432'),
            'database' => env('DB_DATABASE', 'laravel'),
            'username' => env('DB_USERNAME', 'postgres'),
            'password' => env('DB_PASSWORD', ''),
            'charset' => env('DB_CHARSET', 'utf8'),
            'prefix' => '',
            'prefix_indexes' => true,
            'search_path' => env('PGSQL_SEARCH_PATH', 'public'),
            'sslmode' => 'prefer',
        ],

        'sqlsrv' => [
            'driver' => 'sqlsrv',
            'url' => env('DB_URL'),
            'host' => env('DB_HOST', 'localhost'),
            'port' => env('DB_PORT', '1433'),
            'database' => env('DB_DATABASE', 'laravel'),
            'username' => env('DB_USERNAME', 'root'),
            'password' => env('DB_PASSWORD', ''),
            'charset' => env('DB_CHARSET', 'utf8'),
            'prefix' => '',
            'prefix_indexes' => true,
            // 'encrypt' => env('DB_ENCRYPT', 'yes'),
            // 'trust_server_certificate' => env('DB_TRUST_SERVER_CERTIFICATE', 'false'),
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Migration Repository Table
    |--------------------------------------------------------------------------
    */
    'migrations' => [
        'table' => 'migrations',
        'update_date_on_publish' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Redis Databases
    |--------------------------------------------------------------------------
    */
    'redis' => [

        // استخدم predis أو phpredis حسب .env
        'client' => env('REDIS_CLIENT', 'predis'),

        'options' => [
            'cluster'    => env('REDIS_CLUSTER', 'redis'),
            'prefix'     => env('REDIS_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_').'_'),
            'persistent' => (bool) env('REDIS_PERSISTENT', false),
            // SSL للتوافق مع rediss:// أو REDIS_SCHEME=tls
            'ssl'        => $useSsl ? ['verify_peer' => false] : false,
        ],

        'default' => $redisDefault,

        'cache' => $redisCache,

        // اتصال منفصل للـ Sessions (اختياري)
        // فعّله فقط لو فعلاً هتستخدم SESSION_DRIVER=redis
        // 'session' => $filterEmpty([
        //     'url'      => $redisUrl,
        //     'scheme'   => $redisScheme,
        //     'host'     => env('REDIS_HOST', '127.0.0.1'),
        //     'username' => env('REDIS_USERNAME'),
        //     'password' => env('REDIS_PASSWORD'),
        //     'port'     => env('REDIS_PORT', '6379'),
        //     'database' => env('REDIS_SESSION_DB', '2'),
        // ]),
    ],

];

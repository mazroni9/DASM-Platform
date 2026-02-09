<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    | IMPORTANT:
    | - استخدم paths محددة بدل ['*'] علشان تضمن الـ headers تتضاف فعلاً لطلبات /api
    | - supports_credentials = true لو بتستخدم Sanctum Cookies / Sessions
    */

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
        '_diag/*',
    ],

    'allowed_methods' => ['*'],

    // ✅ Allowed origins (Frontend domains)
    'allowed_origins' => [
        'http://localhost:3000',              // Local dev
        'http://127.0.0.1:3000',              // Local dev (alternative)

        'https://dasm.com.sa',
        'https://www.dasm.com.sa',
        'https://control.dasm.com.sa',        // ✅ control panel domain

        // ✅ Backend domain (optional - usually not needed, but ok)
        'https://dasm-laravel.onrender.com',
    ],

    'allowed_origins_patterns' => [
        // ✅ لو عندك preview domains (اختياري)
        // '/^https:\/\/.*\.vercel\.app$/',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [
        'Authorization',
        'Content-Type',
        'X-Requested-With',
        'X-CSRF-TOKEN',
        'X-XSRF-TOKEN',
    ],

    'max_age' => 0,

    // ✅ true لو فعلاً بتستخدم cookies / sanctum SPA auth
    'supports_credentials' => true,
];

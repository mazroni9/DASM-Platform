<?php

return [
    'paths' => ['*'],
    'allowed_methods' => ['*'],

    // ✅ Allowed origins (Frontend domains)
    'allowed_origins' => [
        'http://localhost:3000',        // Local dev
        'https://dasm.com.sa',
        'https://www.dasm.com.sa',
        'https://control.dasm.com.sa',  // ✅ Added control panel domain
        'https://dasm-laravel.onrender.com', // Backend domain (if needed)
    ],

    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => ['*'],
    'max_age' => 0,

    // ⚠️ keep true only if you really use cookies/sessions with cross-site requests
    'supports_credentials' => true,
];

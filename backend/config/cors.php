<?php

return [
    'paths' => ['*'],
    'allowed_methods' => ['*'],
    //'allowed_origins' => ['*'],
    'allowed_origins' => [
        'http://localhost:3000', // للبيئة المحلية
        'https://dasm.com.sa',
        'https://dasm-laravel.onrender.com', // Backend domain for same-origin
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => ['*'],
    'max_age' => 0,
    'supports_credentials' => true,
];

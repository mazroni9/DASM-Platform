<?php

return [
    // الأفضل تحديد مسارات الـ API بدل *
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // لازم تضيف origin بتاع لوحة التحكم
    'allowed_origins' => [
        'http://localhost:3000',
        'https://control.dasm.com.sa',     // ✅ Admin Panel
        'https://dasm.com.sa',
        'https://www.dasm.com.sa',
        'https://dasm-laravel.onrender.com',
        'https://api.dasm.com.sa',         // (اختياري) لو في أي تبادلات بين subdomains
    ],

    // يسمح لأي subdomain من dasm.com.sa (اختياري لكنه مفيد)
    'allowed_origins_patterns' => [
        '#^https?://([a-z0-9-]+\.)*dasm\.com\.sa$#i',
    ],

    'allowed_headers' => ['*'],

    // مش لازم تكون * عادة، بس سيبها لو محتاجها
    'exposed_headers' => ['*'],

    'max_age' => 0,

    // لو بتستخدم Cookies/Sanctum خليها true
    // لو شغال Bearer Token فقط تقدر تخليها false
    'supports_credentials' => true,
];

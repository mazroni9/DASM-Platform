<?php

return [
    'cloud_name' => env('CLOUDINARY_CLOUD_NAME', ''),
    'api_key' => env('CLOUDINARY_API_KEY', ''),
    'api_secret' => env('CLOUDINARY_API_SECRET', ''),

    // الافتراضي آمن (secure)
    'secure' => env('CLOUDINARY_SECURE', true),

    // احتفاظ بتوافق config السابق لو أي مكان بيقرأ cloudinary.url.secure
    'url' => [
        'secure' => env('CLOUDINARY_SECURE', true),
    ],

    // احتفاظ بتوافق config السابق (مش ضروري لعمل الرفع لكنه موجود عشان ما نكسرش أي كود)
    'scaling' => [
        'format' => env('CLOUDINARY_FORMAT', 'auto'),
        'quality' => env('CLOUDINARY_QUALITY', 'auto'),
    ],

    // ✅ خيارات HTTP آمنة
    // لو احتجت DEV فقط: CLOUDINARY_HTTP_VERIFY=false
    'http' => [
        'verify' => env('CLOUDINARY_HTTP_VERIFY', true),
        'timeout' => env('CLOUDINARY_HTTP_TIMEOUT', 30),
        'connect_timeout' => env('CLOUDINARY_HTTP_CONNECT_TIMEOUT', 10),
    ],
];

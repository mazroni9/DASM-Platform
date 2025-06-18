<?php

// Use the hardcoded values from .env as fallbacks
$defaultCloudName = 'djwcvewmf';
$defaultApiKey = '238883787975283';
$defaultApiSecret = '_5B112A1vNqzO8TOfU1z1Y_djGU';

return [
    'cloud_name' => env('CLOUDINARY_CLOUD_NAME', $defaultCloudName),
    'api_key' => env('CLOUDINARY_API_KEY', $defaultApiKey),
    'api_secret' => env('CLOUDINARY_API_SECRET', $defaultApiSecret),
    'secure' => true,
    'url' => [
        'secure' => true
    ],
    'scaling' => [
        'format' => 'auto',
        'quality' => 'auto'
    ]
];
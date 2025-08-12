<?php

return [
    'paths' => ['*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [env('FRONTEND_URL'), 'https://dasm-platform-git-development-mohammed-alzahranis-projects.vercel.app','https://dasm-laravel.onrender.com'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,

];

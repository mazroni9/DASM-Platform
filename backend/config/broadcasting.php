<?php

return [

    'default' => env('BROADCAST_CONNECTION', 'log'),

    'connections' => [
        'log' => [
            'driver' => 'log',
        ],
        'null' => [
            'driver' => 'null',
        ],
        // نترك redis معرف لكن مش الافتراضي
        'redis' => [
            'driver' => 'redis',
            'connection' => 'default',
        ],
        'pusher' => [
            'driver' => 'pusher',
            'key' => env('PUSHER_APP_KEY'),
            'secret' => env('PUSHER_APP_SECRET'),
            'app_id' => env('PUSHER_APP_ID'),
            'options' => [
                'host' => env('PUSHER_HOST'),
                'port' => env('PUSHER_PORT'),
                'scheme' => env('PUSHER_SCHEME', 'https'),
                'encrypted' => true,
                'useTLS' => true,
            ],
        ],
    ],

];

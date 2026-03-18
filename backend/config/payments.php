<?php

return [
    'default' => env('PAYMENT_PROVIDER', 'myfatoorah'),
    'myfatoorah' => [
        'key' => env('MYFATOORAH_API_KEY'),
        'callback_secret' => env('MYFATOORAH_CALLBACK_SECRET'),
    ],
];

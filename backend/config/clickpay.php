<?php

return [
    /*
    |--------------------------------------------------------------------------
    | ClickPay Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Alinma ClickPay payment gateway integration.
    | Used for the DASM-e Dual-Page Payment Model - Phase 1 (Online Service Fees).
    |
    */

    'profile_id' => env('CLICKPAY_PROFILE_ID'),
    'server_key' => env('CLICKPAY_SERVER_KEY'),

    /*
    |--------------------------------------------------------------------------
    | Base URL
    |--------------------------------------------------------------------------
    |
    | The base URL for ClickPay API.
    | Production: https://secure.clickpay.com.sa
    | Sandbox: https://secure.clickpay.com.sa (same, use test credentials)
    |
    */
    'base_url' => env('CLICKPAY_BASE_URL', 'https://secure.clickpay.com.sa'),

    /*
    |--------------------------------------------------------------------------
    | Currency
    |--------------------------------------------------------------------------
    |
    | Default currency for transactions.
    |
    */
    'currency' => env('CLICKPAY_CURRENCY', 'SAR'),
];

<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Configure to allow Next.js frontend (localhost, IP, production)
    |
    */

    'paths' => ['*'],

    'allowed_methods' => ['*'],

    // Allow Next.js origins: localhost, IP addresses, production
    'allowed_origins' => env('CORS_ALLOWED_ORIGINS')
        ? explode(',', env('CORS_ALLOWED_ORIGINS'))
        : [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://192.168.1.163:3000',
            'https://bullmoney.online',
            'https://www.bullmoney.online',
        ],

    'allowed_origins_patterns' => [
        '/^http:\/\/localhost:\d+$/',
        '/^http:\/\/127\.0\.0\.1:\d+$/',
        '/^http:\/\/192\.168\.\d+\.\d+:\d+$/',
        '/^http:\/\/10\.\d+\.\d+\.\d+:\d+$/',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];

<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        'dice/*',
        'mines/*',
        'crash/*',
        'payment/*',
        'withdraw/*',
        '/user/card',
        'user/wheel/status',
        'api/*',
        'slots/*'
    ];
}

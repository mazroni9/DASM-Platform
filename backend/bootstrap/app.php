<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\HandleInertiaRequests;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Global middleware
        $middleware->append([
            \App\Http\Middleware\SecurityHeadersMiddleware::class,
            \App\Http\Middleware\PerformanceMiddleware::class,
        ]);

        // API middleware
        $middleware->api(append: [
            // \App\Http\Middleware\ApiCacheMiddleware::class, // Disabled to prevent unwanted API caching
            \App\Http\Middleware\QueryOptimizationMiddleware::class,
            \App\Http\Middleware\ResponseOptimizationMiddleware::class,
        ]);

        // Register your custom middleware alias here
        $middleware->alias([
            'dealer' => \App\Http\Middleware\DealerMiddleware::class,
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
            'moderator' => \App\Http\Middleware\ModeratorMiddleware::class,
            'bid.rate.limit' => \App\Http\Middleware\BidRateLimitMiddleware::class,
            'performance' => \App\Http\Middleware\PerformanceMiddleware::class,
            'api.cache' => \App\Http\Middleware\ApiCacheMiddleware::class,
            'security.headers' => \App\Http\Middleware\SecurityHeadersMiddleware::class,
        ]);

        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();

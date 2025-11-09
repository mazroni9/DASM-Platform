<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\HandleInertiaRequests;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        channels: __DIR__ . '/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Global middleware
        // ملاحظة: PerformanceHeaders يضيف هيدرز قياس فقط إذا PERF_HEADERS=true في .env
        $middleware->append([
            \App\Http\Middleware\SecurityHeadersMiddleware::class,
            \App\Http\Middleware\PerformanceHeaders::class, // <-- تم التبديل ليتطابق مع اسم الكلاس/الملف
        ]);

       // $middleware->statefulApi();
        // API middleware
        $middleware->api(append: [
            // \App\Http\Middleware\ApiCacheMiddleware::class, // Disabled to prevent unwanted API caching
            \App\Http\Middleware\QueryOptimizationMiddleware::class,
            \App\Http\Middleware\ResponseOptimizationMiddleware::class,
        ]);

        // Register your custom middleware alias here
        $middleware->alias([
            'dealer'            => \App\Http\Middleware\DealerMiddleware::class,
            'admin'             => \App\Http\Middleware\AdminMiddleware::class,
            'moderator'         => \App\Http\Middleware\ModeratorMiddleware::class,

            // role middleware with parameters ->middleware('role:venue_owner,dealer')
            'role'              => \App\Http\Middleware\RoleMiddleware::class,

            'bid.rate.limit'    => \App\Http\Middleware\BidRateLimitMiddleware::class,

            // aliases محدثة:
            'performance'       => \App\Http\Middleware\PerformanceHeaders::class, // <-- بدل PerformanceMiddleware
            'api.cache'         => \App\Http\Middleware\ApiCacheMiddleware::class,
            'security.headers'  => \App\Http\Middleware\SecurityHeadersMiddleware::class,
        ]);

        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();

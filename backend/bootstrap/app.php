<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Auth\Access\AuthorizationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        channels: __DIR__ . '/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        /**
         * Global middleware
         */
        $middleware->append([
            \App\Http\Middleware\SecurityHeadersMiddleware::class,
            \App\Http\Middleware\PerformanceHeaders::class,
        ]);

        /**
         * API middleware
         */
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);

        $middleware->api(append: [
            // \App\Http\Middleware\ApiCacheMiddleware::class, // فعّلها فقط لو موجودة فعلاً
            \App\Http\Middleware\QueryOptimizationMiddleware::class,
            \App\Http\Middleware\ResponseOptimizationMiddleware::class,
        ]);

        /**
         * Middleware aliases
         */
        $middleware->alias([
            // Project middlewares
            'dealer'            => \App\Http\Middleware\DealerMiddleware::class,
            'admin'             => \App\Http\Middleware\AdminMiddleware::class,
            'moderator'         => \App\Http\Middleware\ModeratorMiddleware::class,

            'set.organization'  => \App\Http\Middleware\SetSpatieTeamContext::class,
            'bid.rate.limit'    => \App\Http\Middleware\BidRateLimitMiddleware::class,

            // Utility aliases
            'performance'       => \App\Http\Middleware\PerformanceHeaders::class,
            'security.headers'  => \App\Http\Middleware\SecurityHeadersMiddleware::class,

            // ✅ Spatie Permission (Laravel 11 + spatie v6) - namespace singular
            'role'              => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission'        => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission'=> \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,

            /**
             * اختياري:
             * لو عندك Middleware اسمها App\Http\Middleware\RoleMiddleware فعلاً وكنت بتستخدم 'type'
             * سيب السطر ده. لو مش موجودة احذفه لتجنب أخطاء مستقبلية.
             */
            // 'type'           => \App\Http\Middleware\RoleMiddleware::class,

            /**
             * اختياري:
             * لو عندك ApiCacheMiddleware فعلاً وعايز alias ليها
             */
            // 'api.cache'       => \App\Http\Middleware\ApiCacheMiddleware::class,
        ]);

        /**
         * Web middleware (Inertia)
         */
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (AuthorizationException|AccessDeniedHttpException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'ليس لديك صلاحية للقيام بهذا الإجراء.',
                ], 403);
            }
        });
    })
    ->create();

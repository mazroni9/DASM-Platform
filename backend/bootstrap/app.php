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
        
        // ═══════════════════════════════════════════════════════════════
        // GLOBAL MIDDLEWARE (Applied to all requests)
        // ═══════════════════════════════════════════════════════════════
        $middleware->append([
            \App\Http\Middleware\SecurityHeadersMiddleware::class,
            \App\Http\Middleware\PerformanceHeaders::class,
        ]);

        // ═══════════════════════════════════════════════════════════════
        // API MIDDLEWARE
        // ═══════════════════════════════════════════════════════════════
        
        // Prepend CORS handler
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);

        // Append optimization middleware
        $middleware->api(append: [
            \App\Http\Middleware\QueryOptimizationMiddleware::class,
            \App\Http\Middleware\ResponseOptimizationMiddleware::class,
        ]);

        // ═══════════════════════════════════════════════════════════════
        // WEB MIDDLEWARE
        // ═══════════════════════════════════════════════════════════════
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);

        // ═══════════════════════════════════════════════════════════════
        // MIDDLEWARE ALIASES
        // ═══════════════════════════════════════════════════════════════
        $middleware->alias([
            // ─────────────────────────────────────────────────────────────
            // Authentication & Authorization
            // ─────────────────────────────────────────────────────────────
            'auth'              => \App\Http\Middleware\Authenticate::class,
            'auth.basic'        => \Illuminate\Auth\Middleware\AuthenticateWithBasicAuth::class,
            'auth.session'      => \Illuminate\Session\Middleware\AuthenticateSession::class,
            'guest'             => \App\Http\Middleware\RedirectIfAuthenticated::class,
            'verified'          => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
            
            // ─────────────────────────────────────────────────────────────
            // Role-based Access Control
            // ─────────────────────────────────────────────────────────────
            'admin'             => \App\Http\Middleware\AdminMiddleware::class,
            'moderator'         => \App\Http\Middleware\ModeratorMiddleware::class,
            'dealer'            => \App\Http\Middleware\DealerMiddleware::class,
            
            // Role middleware with parameters: ->middleware('role:venue_owner,dealer')
            'role'              => \App\Http\Middleware\RoleMiddleware::class,
            'type'              => \App\Http\Middleware\RoleMiddleware::class, // Alias for 'role'
            
            // ─────────────────────────────────────────────────────────────
            // Organization & Team Context
            // ─────────────────────────────────────────────────────────────
            'set.organization'  => \App\Http\Middleware\SetSpatieTeamContext::class,
            
            // ─────────────────────────────────────────────────────────────
            // Rate Limiting
            // ─────────────────────────────────────────────────────────────
            'throttle'          => \Illuminate\Routing\Middleware\ThrottleRequests::class,
            'bid.rate.limit'    => \App\Http\Middleware\BidRateLimitMiddleware::class,
            
            // ─────────────────────────────────────────────────────────────
            // Security & Diagnostics
            // ─────────────────────────────────────────────────────────────
            'diag.token'        => \App\Http\Middleware\DiagTokenMiddleware::class,
            'security.headers'  => \App\Http\Middleware\SecurityHeadersMiddleware::class,
            'signed'            => \App\Http\Middleware\ValidateSignature::class,
            
            // ─────────────────────────────────────────────────────────────
            // Performance & Caching
            // ─────────────────────────────────────────────────────────────
            'performance'       => \App\Http\Middleware\PerformanceHeaders::class,
            'api.cache'         => \App\Http\Middleware\ApiCacheMiddleware::class,
            'cache.headers'     => \Illuminate\Http\Middleware\SetCacheHeaders::class,
            
            // ─────────────────────────────────────────────────────────────
            // Laravel Defaults
            // ─────────────────────────────────────────────────────────────
            'can'               => \Illuminate\Auth\Middleware\Authorize::class,
            'password.confirm'  => \Illuminate\Auth\Middleware\RequirePassword::class,
            'precognitive'      => \Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        
        // ═══════════════════════════════════════════════════════════════
        // CUSTOM EXCEPTION HANDLING
        // ═══════════════════════════════════════════════════════════════
        
        // Authorization exceptions (403)
        $exceptions->render(function (AuthorizationException|AccessDeniedHttpException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'ليس لديك صلاحية للقيام بهذا الإجراء.',
                    'error'   => 'forbidden',
                ], 403);
            }
        });

        // Model not found (404)
        $exceptions->render(function (\Illuminate\Database\Eloquent\ModelNotFoundException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'العنصر المطلوب غير موجود.',
                    'error'   => 'not_found',
                ], 404);
            }
        });

        // Validation exceptions (422)
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'بيانات غير صالحة.',
                    'errors'  => $e->errors(),
                ], 422);
            }
        });

        // Authentication exceptions (401)
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'يجب تسجيل الدخول للوصول لهذا المورد.',
                    'error'   => 'unauthenticated',
                ], 401);
            }
        });

        // Rate limit exceeded (429)
        $exceptions->render(function (\Illuminate\Http\Exceptions\ThrottleRequestsException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success'    => false,
                    'message'    => 'تم تجاوز الحد المسموح من الطلبات. حاول مرة أخرى لاحقاً.',
                    'error'      => 'too_many_requests',
                    'retry_after'=> $e->getHeaders()['Retry-After'] ?? 60,
                ], 429);
            }
        });

        // Generic server errors (500) - Only in production
        if (app()->environment('production')) {
            $exceptions->render(function (\Throwable $e, Request $request) {
                if ($request->expectsJson() && !$e instanceof \Symfony\Component\HttpKernel\Exception\HttpException) {
                    \Illuminate\Support\Facades\Log::error('Unhandled exception', [
                        'exception' => get_class($e),
                        'message'   => $e->getMessage(),
                        'file'      => $e->getFile(),
                        'line'      => $e->getLine(),
                        'url'       => $request->fullUrl(),
                        'user_id'   => auth()->id(),
                    ]);

                    return response()->json([
                        'success' => false,
                        'message' => 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.',
                        'error'   => 'server_error',
                    ], 500);
                }
            });
        }
    })
    ->create();

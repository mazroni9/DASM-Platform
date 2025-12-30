<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * DiagTokenMiddleware
 * 
 * يحمي endpoints التشخيص الحساسة بـ token سري.
 * 
 * Usage:
 * - Header: X-Diag-Token: your-secret-token
 * - Query: ?token=your-secret-token
 * 
 * Configuration:
 * - Set DIAG_TOKEN in .env file
 * - Or set app.diag_token in config/app.php
 */
class DiagTokenMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get token from header or query string
        $providedToken = $request->header('X-Diag-Token') ?? $request->query('token');
        
        // Get expected token from config or env
        $expectedToken = config('app.diag_token') ?? env('DIAG_TOKEN', '');

        // Security checks
        if (empty($expectedToken)) {
            // No token configured = diagnostics disabled in production
            if (app()->environment('production')) {
                abort(404);
            }
            // In non-production, allow without token (for development)
            return $next($request);
        }

        // Token required but not provided
        if (empty($providedToken)) {
            abort(404); // Return 404 instead of 401/403 to hide endpoint existence
        }

        // Constant-time comparison to prevent timing attacks
        if (!hash_equals($expectedToken, $providedToken)) {
            abort(404);
        }

        return $next($request);
    }
}

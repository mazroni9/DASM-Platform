<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SecurityHeadersMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Security headers
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

        // Content Security Policy
        $csp = $this->getContentSecurityPolicy($request);
        $response->headers->set('Content-Security-Policy', $csp);

        // Strict Transport Security (HTTPS only)
        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        // Cache control for sensitive pages and API routes
        if ($this->isSensitivePage($request) || $request->is('api/*')) {
            $response->headers->set('Cache-Control', 'no-cache, no-store, must-revalidate');
            $response->headers->set('Pragma', 'no-cache');
            $response->headers->set('Expires', '0');
        }

        return $response;
    }

    /**
     * Get Content Security Policy based on request
     */
    private function getContentSecurityPolicy(Request $request): string
    {
        $isApi = $request->is('api/*');
        $isAdmin = $request->is('admin/*') || $request->is('moderator/*');

        $directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https: blob:",
            "media-src 'self' https:",
            "connect-src 'self' https: wss: ws:",
            "frame-src 'self' https://www.youtube.com https://player.vimeo.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ];

        // Relax CSP for admin pages
        if ($isAdmin) {
            $directives[] = "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:";
            $directives[] = "style-src 'self' 'unsafe-inline' https:";
        }

        // API-specific CSP
        if ($isApi) {
            $directives = [
                "default-src 'none'",
                "connect-src 'self'",
            ];
        }

        return implode('; ', $directives);
    }

    /**
     * Check if page is sensitive and shouldn't be cached
     */
    private function isSensitivePage(Request $request): bool
    {
        $sensitivePaths = [
            'admin/',
            'moderator/',
            'dashboard/',
            'user/profile',
            'user/wallet',
            'auth/',
        ];

        $path = $request->path();

        foreach ($sensitivePaths as $sensitivePath) {
            if (str_contains($path, $sensitivePath)) {
                return true;
            }
        }

        return false;
    }
}

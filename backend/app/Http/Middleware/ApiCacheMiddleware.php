<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;

class ApiCacheMiddleware
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
        // Only cache GET requests
        if ($request->method() !== 'GET') {
            return $next($request);
        }

        // Skip caching for authenticated users on sensitive endpoints
        if (Auth::check() && $this->isSensitiveEndpoint($request)) {
            return $next($request);
        }

        // Generate cache key
        $cacheKey = $this->generateCacheKey($request);

        // Check if response is cached
        if (Cache::has($cacheKey)) {
            $cachedResponse = Cache::get($cacheKey);
            
            // Add cache headers
            $cachedResponse->headers->set('X-Cache', 'HIT');
            $cachedResponse->headers->set('X-Cache-Key', $cacheKey);
            
            return $cachedResponse;
        }

        // Process request
        $response = $next($request);

        // Cache successful responses
        if ($response->getStatusCode() === 200) {
            $ttl = $this->getCacheTTL($request);
            
            // Clone response to avoid issues with headers
            $responseToCache = clone $response;
            $responseToCache->headers->set('X-Cache', 'MISS');
            $responseToCache->headers->set('X-Cache-Key', $cacheKey);
            
            Cache::put($cacheKey, $responseToCache, $ttl);
        }

        return $response;
    }

    /**
     * Generate cache key for the request
     */
    private function generateCacheKey(Request $request): string
    {
        $key = 'api_cache:' . $request->method() . ':' . $request->path();
        
        // Include query parameters
        if ($request->query()) {
            $key .= ':' . md5(serialize($request->query()));
        }
        
        // Include user ID if authenticated
        if (Auth::check()) {
            $key .= ':user:' . Auth::id();
        }
        
        return $key;
    }

    /**
     * Get cache TTL based on endpoint
     */
    private function getCacheTTL(Request $request): int
    {
        $path = $request->path();
        
        // Different TTL for different endpoints
        if (str_contains($path, 'user/profile')) {
            return config('performance.cache.api_ttl', 300) * 2; // 10 minutes
        }
        
        if (str_contains($path, 'auctions') || str_contains($path, 'cars')) {
            return config('performance.cache.api_ttl', 300); // 5 minutes
        }
        
        if (str_contains($path, 'notifications')) {
            return 60; // 1 minute
        }
        
        return config('performance.cache.api_ttl', 300); // Default 5 minutes
    }

    /**
     * Check if endpoint is sensitive and shouldn't be cached
     */
    private function isSensitiveEndpoint(Request $request): bool
    {
        $sensitivePaths = [
            'user/profile',
            'user/wallet',
            'user/transactions',
            'admin/',
            'moderator/',
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

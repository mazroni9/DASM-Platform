<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ResponseOptimizationMiddleware
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

        // Optimize JSON responses
        if ($response instanceof JsonResponse) {
            $this->optimizeJsonResponse($response, $request);
        }

        // Add compression headers
        $response->headers->set('Vary', 'Accept-Encoding');
        
        // Add ETag for caching
        if ($request->is('api/*') && $response->getStatusCode() === 200) {
            $this->addETag($response, $request);
        }

        return $response;
    }

    /**
     * Optimize JSON response structure
     */
    private function optimizeJsonResponse(JsonResponse $response, Request $request)
    {
        $data = $response->getData(true);

        // Remove null values from response
        if (is_array($data)) {
            $data = $this->removeNullValues($data);
        }

        // Add pagination metadata if present
        if (isset($data['data']) && isset($data['links'])) {
            $response->headers->set('X-Pagination-Count', $data['total'] ?? 0);
            $response->headers->set('X-Pagination-Page', $data['current_page'] ?? 1);
            $response->headers->set('X-Pagination-Per-Page', $data['per_page'] ?? 15);
        }

        $response->setData($data);
    }

    /**
     * Remove null values from array recursively
     */
    private function removeNullValues(array $data): array
    {
        return array_filter(array_map(function ($value) {
            if (is_array($value)) {
                return $this->removeNullValues($value);
            }
            return $value;
        }, $data), function ($value) {
            return $value !== null;
        });
    }

    /**
     * Add ETag for response caching
     */
    private function addETag(JsonResponse $response, Request $request)
    {
        $content = $response->getContent();
        $etag = md5($content);
        
        $response->headers->set('ETag', '"' . $etag . '"');
        
        // Check if client has cached version
        $ifNoneMatch = $request->header('If-None-Match');
        if ($ifNoneMatch && $ifNoneMatch === '"' . $etag . '"') {
            $response->setStatusCode(304);
            $response->setContent('');
        }
    }
}

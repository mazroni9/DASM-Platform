<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class QueryOptimizationMiddleware
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
        $enableQueryLog = config('app.debug')
            && config('performance.database.query_logging', false)
            && $request->is('api/*');

        if ($enableQueryLog) {
            DB::enableQueryLog();
        }

        $response = $next($request);

        // Log slow queries
        if ($enableQueryLog) {
            $queries = DB::getQueryLog();
            $slowQueries = array_filter($queries, function ($query) {
                return $query['time'] > config('performance.database.slow_query_threshold', 1000);
            });

            if (!empty($slowQueries)) {
                Log::warning('Slow queries detected', [
                    'url' => $request->fullUrl(),
                    'queries' => $slowQueries,
                ]);
            }

            // Add query count to response headers
            $response->headers->set('X-Query-Count', count($queries));
            $response->headers->set('X-Query-Time', array_sum(array_column($queries, 'time')) . 'ms');
        }

        return $response;
    }
}

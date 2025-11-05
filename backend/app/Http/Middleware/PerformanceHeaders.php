<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PerformanceHeaders
{
    public function handle(Request $request, Closure $next)
    {
        // شغّل/اقفل من ENV (خليه false في الإنتاج المستقر)
        $enabled = filter_var(env('PERF_HEADERS', false), FILTER_VALIDATE_BOOLEAN);
        if (!$enabled) {
            return $next($request);
        }

        // قياس زمن التنفيذ الكلي + زمن استعلامات DB
        $startNs = hrtime(true);
        $dbMs = 0.0;

        DB::listen(function ($query) use (&$dbMs) {
            // time بالمللي ثانية
            $dbMs += $query->time;
        });

        $response = $next($request);

        $durMs = (hrtime(true) - $startNs) / 1e6;

        // هيدرز مفيدة للفحص
        $response->headers->set('X-Response-Time', sprintf('%.1fms', $durMs));
        $response->headers->set('Server-Timing', sprintf('app;dur=%.1f, db;dur=%.1f', $durMs, $dbMs));
        // لو الفرونت على دومين مختلف وعايز تشوف Server-Timing من المتصفح:
        $response->headers->set('Timing-Allow-Origin', '*');

        return $response;
    }
}

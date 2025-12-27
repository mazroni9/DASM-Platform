<?php

namespace App\Http\Controllers\Monitoring;

use App\Http\Controllers\Controller;
use App\Models\Monitoring\{
    PlatformHealthMetric,
    ApiPerformanceLog,
    DatabasePerformanceLog,
    PagePerformanceLog,
    FeatureUsageLog
};
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class PlatformHealthController extends Controller
{
    /**
     * Check if user is Super Admin
     */
    private function isSuperAdmin(User $user): bool
    {
        return $user->type->value === 'super_admin';
    }

    /**
     * Get current health status
     */
    public function currentStatus(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$this->isSuperAdmin($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $latest = PlatformHealthMetric::latest('check_time')->first();

        if (!$latest) {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'status' => 'no_data',
                    'message' => 'No health metrics available yet',
                ],
            ]);
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $latest->id,
                'cpu_usage' => $latest->cpu_usage,
                'memory_usage' => $latest->memory_usage,
                'disk_usage' => $latest->disk_usage,
                'active_users' => $latest->active_users,
                'api_requests_per_minute' => $latest->api_requests_per_minute,
                'avg_response_time' => $latest->avg_response_time,
                'error_count' => $latest->error_count,
                'database_connections' => $latest->database_connections,
                'database_query_time' => $latest->database_query_time,
                'is_healthy' => $latest->is_healthy,
                'alerts' => $latest->alerts,
                'check_time' => $latest->check_time,
            ],
        ]);
    }

    /**
     * Get health history
     */
    public function history(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$this->isSuperAdmin($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $hours = $request->input('hours', 24);
        $startTime = Carbon::now()->subHours($hours);

        $metrics = PlatformHealthMetric::where('check_time', '>=', $startTime)
            ->orderBy('check_time')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $metrics,
        ]);
    }

    /**
     * Get API performance metrics
     */
    public function apiPerformance(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$this->isSuperAdmin($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $hours = $request->input('hours', 24);
        $startTime = Carbon::now()->subHours($hours);

        $query = ApiPerformanceLog::where('request_time', '>=', $startTime);

        // Filter by endpoint
        if ($request->has('endpoint')) {
            $query->where('endpoint', 'like', '%' . $request->endpoint . '%');
        }

        // Filter by method
        if ($request->has('method')) {
            $query->where('method', $request->method);
        }

        // Filter by status code
        if ($request->has('status_code')) {
            $query->where('status_code', $request->status_code);
        }

        $logs = $query->orderBy('request_time', 'desc')->paginate(50);

        // Calculate statistics
        $stats = [
            'total_requests' => $query->count(),
            'avg_response_time' => round($query->avg('response_time'), 2),
            'min_response_time' => $query->min('response_time'),
            'max_response_time' => $query->max('response_time'),
            'error_rate' => round(
                ($query->where('status_code', '>=', 400)->count() / max($query->count(), 1)) * 100,
                2
            ),
        ];

        return response()->json([
            'status' => 'success',
            'statistics' => $stats,
            'data' => $logs,
        ]);
    }

    /**
     * Get database performance metrics
     */
    public function databasePerformance(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$this->isSuperAdmin($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $hours = $request->input('hours', 24);
        $startTime = Carbon::now()->subHours($hours);

        $query = DatabasePerformanceLog::where('executed_at', '>=', $startTime);

        // Get slow queries
        $slowQueries = (clone $query)
            ->where('is_slow', true)
            ->orderBy('execution_time', 'desc')
            ->limit(20)
            ->get();

        // Get statistics by table
        $tableStats = (clone $query)
            ->selectRaw('table_name, COUNT(*) as count, AVG(execution_time) as avg_time, MAX(execution_time) as max_time')
            ->groupBy('table_name')
            ->orderBy('avg_time', 'desc')
            ->get();

        // Overall statistics
        $stats = [
            'total_queries' => $query->count(),
            'avg_execution_time' => round($query->avg('execution_time'), 2),
            'slow_queries_count' => $query->where('is_slow', true)->count(),
            'error_queries_count' => $query->whereNotNull('error_message')->count(),
        ];

        return response()->json([
            'status' => 'success',
            'statistics' => $stats,
            'slow_queries' => $slowQueries,
            'table_statistics' => $tableStats,
        ]);
    }

    /**
     * Get page performance metrics
     */
    public function pagePerformance(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$this->isSuperAdmin($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $pages = PagePerformanceLog::latest('measurement_time')
            ->limit(50)
            ->get()
            ->map(fn($page) => [
                'page_path' => $page->page_path,
                'page_name' => $page->page_name,
                'load_time' => $page->load_time,
                'render_time' => $page->render_time,
                'total_requests' => $page->total_requests,
                'failed_requests' => $page->failed_requests,
                'unique_visitors' => $page->unique_visitors,
                'bounce_rate' => $page->bounce_rate,
                'status' => $page->status,
                'measurement_time' => $page->measurement_time,
            ]);

        // Calculate average metrics
        $avgMetrics = [
            'avg_load_time' => round(PagePerformanceLog::avg('load_time'), 2),
            'avg_render_time' => round(PagePerformanceLog::avg('render_time'), 2),
            'avg_bounce_rate' => round(PagePerformanceLog::avg('bounce_rate'), 2),
        ];

        return response()->json([
            'status' => 'success',
            'average_metrics' => $avgMetrics,
            'data' => $pages,
        ]);
    }

    /**
     * Get feature usage statistics
     */
    public function featureUsage(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$this->isSuperAdmin($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $days = $request->input('days', 30);
        $startDate = Carbon::now()->subDays($days);

        $features = FeatureUsageLog::where('created_at', '>=', $startDate)
            ->selectRaw('feature_name, feature_category, COUNT(*) as usage_count, AVG(avg_duration) as avg_duration, SUM(CASE WHEN is_successful = 1 THEN 1 ELSE 0 END) as successful_count')
            ->groupBy('feature_name', 'feature_category')
            ->orderBy('usage_count', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $features,
        ]);
    }

    /**
     * Record health check
     */
    public function recordHealthCheck(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$this->isSuperAdmin($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'cpu_usage' => 'required|numeric|min:0|max:100',
            'memory_usage' => 'required|numeric|min:0|max:100',
            'disk_usage' => 'required|numeric|min:0|max:100',
            'active_users' => 'required|integer|min:0',
            'api_requests_per_minute' => 'required|integer|min:0',
            'avg_response_time' => 'required|numeric|min:0',
            'error_count' => 'required|integer|min:0',
            'database_connections' => 'required|integer|min:0',
            'database_query_time' => 'required|numeric|min:0',
            'alerts' => 'nullable|string',
        ]);

        // Determine health status
        $isHealthy = $validated['cpu_usage'] < 80 &&
                    $validated['memory_usage'] < 80 &&
                    $validated['disk_usage'] < 90 &&
                    $validated['avg_response_time'] < 1000 &&
                    $validated['error_count'] < 100;

        $metric = PlatformHealthMetric::create([
            ...$validated,
            'is_healthy' => $isHealthy,
            'check_time' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Health check recorded',
            'data' => $metric,
        ]);
    }

    /**
     * Get health summary
     */
    public function summary(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$this->isSuperAdmin($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $days = $request->input('days', 7);
        $startTime = Carbon::now()->subDays($days);

        $metrics = PlatformHealthMetric::where('check_time', '>=', $startTime)->get();

        if ($metrics->isEmpty()) {
            return response()->json([
                'status' => 'success',
                'data' => ['message' => 'No data available'],
            ]);
        }

        $summary = [
            'period_days' => $days,
            'total_checks' => $metrics->count(),
            'healthy_checks' => $metrics->where('is_healthy', true)->count(),
            'unhealthy_checks' => $metrics->where('is_healthy', false)->count(),
            'uptime_percentage' => round(
                ($metrics->where('is_healthy', true)->count() / $metrics->count()) * 100,
                2
            ),
            'avg_cpu_usage' => round($metrics->avg('cpu_usage'), 2),
            'avg_memory_usage' => round($metrics->avg('memory_usage'), 2),
            'avg_disk_usage' => round($metrics->avg('disk_usage'), 2),
            'avg_response_time' => round($metrics->avg('avg_response_time'), 2),
            'max_cpu_usage' => $metrics->max('cpu_usage'),
            'max_memory_usage' => $metrics->max('memory_usage'),
            'max_disk_usage' => $metrics->max('disk_usage'),
        ];

        return response()->json([
            'status' => 'success',
            'data' => $summary,
        ]);
    }
}

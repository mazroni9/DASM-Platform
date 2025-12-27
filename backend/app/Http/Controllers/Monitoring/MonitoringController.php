<?php

namespace App\Http\Controllers\Monitoring;

use App\Http\Controllers\Controller;
use App\Models\Monitoring\{
    DeveloperMetric,
    PlatformHealthMetric,
    PlatformErrorLog,
    DeploymentLog,
    SystemAlert
};
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class MonitoringController extends Controller
{
    /**
     * Check if user is Super Admin
     */
    private function isSuperAdmin(User $user): bool
    {
        return $user->type->value === 'super_admin';
    }

    /**
     * Get main dashboard data
     */
    public function dashboard(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$this->isSuperAdmin($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $dashboardData = [
            'platform_health' => $this->getPlatformHealth(),
            'team_overview' => $this->getTeamOverview(),
            'recent_errors' => $this->getRecentErrors(10),
            'recent_deployments' => $this->getRecentDeployments(5),
            'system_alerts' => $this->getSystemAlerts(),
            'performance_summary' => $this->getPerformanceSummary(),
        ];

        return response()->json([
            'status' => 'success',
            'data' => $dashboardData,
            'timestamp' => now(),
        ]);
    }

    /**
     * Get platform health status
     */
    private function getPlatformHealth(): array
    {
        $latestHealth = PlatformHealthMetric::latest('check_time')->first();

        if (!$latestHealth) {
            return [
                'status' => 'unknown',
                'cpu_usage' => 0,
                'memory_usage' => 0,
                'disk_usage' => 0,
                'active_users' => 0,
                'api_requests_per_minute' => 0,
                'avg_response_time' => 0,
                'error_count' => 0,
                'is_healthy' => false,
            ];
        }

        return [
            'status' => $latestHealth->is_healthy ? 'healthy' : 'unhealthy',
            'cpu_usage' => $latestHealth->cpu_usage,
            'memory_usage' => $latestHealth->memory_usage,
            'disk_usage' => $latestHealth->disk_usage,
            'active_users' => $latestHealth->active_users,
            'api_requests_per_minute' => $latestHealth->api_requests_per_minute,
            'avg_response_time' => $latestHealth->avg_response_time,
            'error_count' => $latestHealth->error_count,
            'is_healthy' => $latestHealth->is_healthy,
            'last_check' => $latestHealth->check_time,
        ];
    }

    /**
     * Get team overview
     */
    private function getTeamOverview(): array
    {
        $developers = DeveloperMetric::with('user')
            ->where('user_id', '!=', null)
            ->get();

        $totalDevelopers = $developers->count();
        $topPerformers = $developers->sortByDesc('productivity_score')->take(3);
        $averageProductivity = $developers->avg('productivity_score');
        $averageCodeQuality = $developers->avg('code_quality_score');

        return [
            'total_developers' => $totalDevelopers,
            'average_productivity' => round($averageProductivity, 2),
            'average_code_quality' => round($averageCodeQuality, 2),
            'top_performers' => $topPerformers->map(fn($dev) => [
                'id' => $dev->user_id,
                'name' => $dev->user->first_name . ' ' . $dev->user->last_name,
                'score' => $dev->productivity_score,
            ])->values(),
            'total_commits' => $developers->sum('total_commits'),
            'total_pull_requests' => $developers->sum('total_pull_requests'),
        ];
    }

    /**
     * Get recent errors
     */
    private function getRecentErrors(int $limit = 10): array
    {
        $errors = PlatformErrorLog::latest('created_at')
            ->where('is_resolved', false)
            ->limit($limit)
            ->get()
            ->map(fn($error) => [
                'id' => $error->id,
                'type' => $error->error_type,
                'message' => $error->error_message,
                'severity' => $error->severity,
                'endpoint' => $error->endpoint,
                'created_at' => $error->created_at,
            ]);

        return $errors->toArray();
    }

    /**
     * Get recent deployments
     */
    private function getRecentDeployments(int $limit = 5): array
    {
        $deployments = DeploymentLog::with('deployedBy')
            ->latest('started_at')
            ->limit($limit)
            ->get()
            ->map(fn($deployment) => [
                'id' => $deployment->id,
                'branch' => $deployment->branch_name,
                'environment' => $deployment->environment,
                'status' => $deployment->status,
                'deployed_by' => $deployment->deployedBy->first_name . ' ' . $deployment->deployedBy->last_name,
                'started_at' => $deployment->started_at,
                'completed_at' => $deployment->completed_at,
                'duration' => $deployment->duration_seconds,
            ]);

        return $deployments->toArray();
    }

    /**
     * Get system alerts
     */
    private function getSystemAlerts(): array
    {
        $alerts = SystemAlert::where('is_resolved', false)
            ->where('is_acknowledged', false)
            ->latest('created_at')
            ->limit(10)
            ->get()
            ->map(fn($alert) => [
                'id' => $alert->id,
                'type' => $alert->alert_type,
                'severity' => $alert->severity,
                'title' => $alert->title,
                'description' => $alert->description,
                'created_at' => $alert->created_at,
            ]);

        return $alerts->toArray();
    }

    /**
     * Get performance summary
     */
    private function getPerformanceSummary(): array
    {
        $last24Hours = Carbon::now()->subHours(24);
        $last7Days = Carbon::now()->subDays(7);

        $errors24h = PlatformErrorLog::where('created_at', '>=', $last24Hours)->count();
        $errors7d = PlatformErrorLog::where('created_at', '>=', $last7Days)->count();
        $deployments24h = DeploymentLog::where('started_at', '>=', $last24Hours)->count();
        $deployments7d = DeploymentLog::where('started_at', '>=', $last7Days)->count();

        return [
            'errors_24h' => $errors24h,
            'errors_7d' => $errors7d,
            'deployments_24h' => $deployments24h,
            'deployments_7d' => $deployments7d,
            'uptime_percentage' => $this->calculateUptime(),
        ];
    }

    /**
     * Calculate uptime percentage
     */
    private function calculateUptime(): float
    {
        $last24Hours = Carbon::now()->subHours(24);
        $healthChecks = PlatformHealthMetric::where('check_time', '>=', $last24Hours)->get();

        if ($healthChecks->isEmpty()) {
            return 100.0;
        }

        $healthyChecks = $healthChecks->where('is_healthy', true)->count();
        return round(($healthyChecks / $healthChecks->count()) * 100, 2);
    }

    /**
     * Get detailed error logs
     */
    public function errorLogs(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$this->isSuperAdmin($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $query = PlatformErrorLog::query();

        // Filters
        if ($request->has('severity')) {
            $query->where('severity', $request->severity);
        }

        if ($request->has('is_resolved')) {
            $query->where('is_resolved', $request->boolean('is_resolved'));
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('error_type', 'like', "%{$search}%")
                    ->orWhere('error_message', 'like', "%{$search}%")
                    ->orWhere('endpoint', 'like', "%{$search}%");
            });
        }

        $errors = $query->latest('created_at')->paginate(20);

        return response()->json([
            'status' => 'success',
            'data' => $errors,
        ]);
    }

    /**
     * Resolve an error
     */
    public function resolveError(Request $request, int $errorId): JsonResponse
    {
        $user = auth()->user();
        
        if (!$this->isSuperAdmin($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $error = PlatformErrorLog::findOrFail($errorId);

        $error->update([
            'is_resolved' => true,
            'resolved_at' => now(),
            'resolution_notes' => $request->input('notes'),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Error resolved successfully',
            'data' => $error,
        ]);
    }

    /**
     * Get deployment history
     */
    public function deploymentHistory(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$this->isSuperAdmin($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $query = DeploymentLog::with('deployedBy');

        if ($request->has('environment')) {
            $query->where('environment', $request->environment);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $deployments = $query->latest('started_at')->paginate(20);

        return response()->json([
            'status' => 'success',
            'data' => $deployments,
        ]);
    }

    /**
     * Get system alerts
     */
    public function alerts(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$this->isSuperAdmin($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $query = SystemAlert::query();

        if ($request->has('severity')) {
            $query->where('severity', $request->severity);
        }

        if ($request->has('is_resolved')) {
            $query->where('is_resolved', $request->boolean('is_resolved'));
        }

        $alerts = $query->latest('created_at')->paginate(20);

        return response()->json([
            'status' => 'success',
            'data' => $alerts,
        ]);
    }

    /**
     * Acknowledge an alert
     */
    public function acknowledgeAlert(Request $request, int $alertId): JsonResponse
    {
        $user = auth()->user();
        
        if (!$this->isSuperAdmin($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $alert = SystemAlert::findOrFail($alertId);

        $alert->update([
            'is_acknowledged' => true,
            'acknowledged_at' => now(),
            'acknowledged_by' => $user->id,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Alert acknowledged',
            'data' => $alert,
        ]);
    }
}

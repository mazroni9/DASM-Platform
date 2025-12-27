<?php

namespace App\Http\Controllers\Monitoring;

use App\Http\Controllers\Controller;
use App\Models\Monitoring\{DeveloperMetric, DailyDeveloperSnapshot};
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class DeveloperMetricsController extends Controller
{
    /**
     * Check if user is Super Admin
     */
    private function isSuperAdmin(User $user): bool
    {
        return $user->type->value === 'super_admin';
    }

    /**
     * Get all developer metrics
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$this->isSuperAdmin($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $query = DeveloperMetric::with('user');

        // Sorting
        $sortBy = $request->input('sort_by', 'productivity_score');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $metrics = $query->paginate(20);

        return response()->json([
            'status' => 'success',
            'data' => $metrics,
        ]);
    }

    /**
     * Get developer detail
     */
    public function show(int $developerId): JsonResponse
    {
        $user = auth()->user();
        
        if (!$this->isSuperAdmin($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $metric = DeveloperMetric::with(['user', 'dailySnapshots'])->findOrFail($developerId);

        // Get performance trend
        $weekAgo = Carbon::now()->subWeek();
        $recentSnapshots = $metric->dailySnapshots()
            ->where('snapshot_date', '>=', $weekAgo)
            ->orderBy('snapshot_date')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'metric' => $metric,
                'recent_snapshots' => $recentSnapshots,
                'overall_score' => $metric->overall_score,
                'performance_trend' => $metric->performance_trend,
            ],
        ]);
    }

    /**
     * Get top performers
     */
    public function topPerformers(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$this->isSuperAdmin($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $limit = $request->input('limit', 10);

        $topPerformers = DeveloperMetric::with('user')
            ->topPerformers($limit)
            ->get()
            ->map(fn($dev) => [
                'id' => $dev->id,
                'user' => [
                    'id' => $dev->user->id,
                    'name' => $dev->user->first_name . ' ' . $dev->user->last_name,
                    'email' => $dev->user->email,
                ],
                'overall_score' => $dev->overall_score,
                'productivity_score' => $dev->productivity_score,
                'code_quality_score' => $dev->code_quality_score,
                'code_review_score' => $dev->code_review_score,
                'total_commits' => $dev->total_commits,
                'total_pull_requests' => $dev->total_pull_requests,
                'tasks_completed' => $dev->tasks_completed,
            ]);

        return response()->json([
            'status' => 'success',
            'data' => $topPerformers,
        ]);
    }

    /**
     * Get developers needing attention
     */
    public function needsAttention(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$this->isSuperAdmin($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $developers = DeveloperMetric::with('user')
            ->needsAttention()
            ->get()
            ->map(fn($dev) => [
                'id' => $dev->id,
                'user' => [
                    'id' => $dev->user->id,
                    'name' => $dev->user->first_name . ' ' . $dev->user->last_name,
                    'email' => $dev->user->email,
                ],
                'productivity_score' => $dev->productivity_score,
                'code_quality_score' => $dev->code_quality_score,
                'bugs_introduced' => $dev->total_bugs_introduced,
                'issues' => $this->identifyIssues($dev),
            ]);

        return response()->json([
            'status' => 'success',
            'data' => $developers,
        ]);
    }

    /**
     * Identify performance issues for a developer
     */
    private function identifyIssues(DeveloperMetric $dev): array
    {
        $issues = [];

        if ($dev->productivity_score < 50) {
            $issues[] = 'Low productivity score';
        }

        if ($dev->code_quality_score < 50) {
            $issues[] = 'Low code quality';
        }

        if ($dev->total_bugs_introduced > 10) {
            $issues[] = 'High bug introduction rate';
        }

        if ($dev->avg_response_time > 5) {
            $issues[] = 'Slow response time';
        }

        if ($dev->tasks_pending > $dev->tasks_completed) {
            $issues[] = 'More pending tasks than completed';
        }

        return $issues;
    }

    /**
     * Update developer metrics
     */
    public function update(Request $request, int $developerId): JsonResponse
    {
        $user = auth()->user();
        
        if (!$this->isSuperAdmin($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $metric = DeveloperMetric::findOrFail($developerId);

        $validated = $request->validate([
            'github_username' => 'nullable|string',
            'total_commits' => 'nullable|integer|min:0',
            'total_pull_requests' => 'nullable|integer|min:0',
            'code_quality_score' => 'nullable|integer|min:0|max:100',
            'productivity_score' => 'nullable|integer|min:0|max:100',
            'code_review_score' => 'nullable|integer|min:0|max:100',
        ]);

        $metric->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Developer metrics updated',
            'data' => $metric,
        ]);
    }

    /**
     * Get daily snapshots for a developer
     */
    public function dailySnapshots(Request $request, int $developerId): JsonResponse
    {
        $user = auth()->user();
        
        if (!$this->isSuperAdmin($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $days = $request->input('days', 30);
        $startDate = Carbon::now()->subDays($days);

        $snapshots = DailyDeveloperSnapshot::where('developer_metric_id', $developerId)
            ->where('snapshot_date', '>=', $startDate)
            ->orderBy('snapshot_date')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $snapshots,
        ]);
    }

    /**
     * Create daily snapshot
     */
    public function createSnapshot(Request $request, int $developerId): JsonResponse
    {
        $user = auth()->user();
        
        if (!$this->isSuperAdmin($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'snapshot_date' => 'required|date',
            'commits_count' => 'nullable|integer|min:0',
            'pull_requests_count' => 'nullable|integer|min:0',
            'code_reviews_count' => 'nullable|integer|min:0',
            'bugs_fixed' => 'nullable|integer|min:0',
            'bugs_introduced' => 'nullable|integer|min:0',
            'code_quality_score' => 'nullable|integer|min:0|max:100',
            'tasks_completed' => 'nullable|integer|min:0',
            'working_hours' => 'nullable|integer|min:0|max:24',
            'notes' => 'nullable|string',
        ]);

        $snapshot = DailyDeveloperSnapshot::create([
            'developer_metric_id' => $developerId,
            ...$validated,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Snapshot created',
            'data' => $snapshot,
        ]);
    }

    /**
     * Get team statistics
     */
    public function teamStats(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$this->isSuperAdmin($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $developers = DeveloperMetric::with('user')->get();

        $stats = [
            'total_developers' => $developers->count(),
            'average_productivity' => round($developers->avg('productivity_score'), 2),
            'average_code_quality' => round($developers->avg('code_quality_score'), 2),
            'average_code_review' => round($developers->avg('code_review_score'), 2),
            'total_commits' => $developers->sum('total_commits'),
            'total_pull_requests' => $developers->sum('total_pull_requests'),
            'total_bugs_fixed' => $developers->sum('total_bugs_fixed'),
            'total_bugs_introduced' => $developers->sum('total_bugs_introduced'),
            'total_tasks_completed' => $developers->sum('tasks_completed'),
            'total_tasks_pending' => $developers->sum('tasks_pending'),
            'developers_needing_attention' => $developers->filter(fn($d) => $d->productivity_score < 50)->count(),
        ];

        return response()->json([
            'status' => 'success',
            'data' => $stats,
        ]);
    }

    /**
     * Compare developers
     */
    public function compare(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$this->isSuperAdmin($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $developerIds = $request->input('developer_ids', []);

        if (empty($developerIds)) {
            return response()->json(['error' => 'No developers selected'], 400);
        }

        $developers = DeveloperMetric::with('user')
            ->whereIn('id', $developerIds)
            ->get()
            ->map(fn($dev) => [
                'id' => $dev->id,
                'name' => $dev->user->first_name . ' ' . $dev->user->last_name,
                'productivity_score' => $dev->productivity_score,
                'code_quality_score' => $dev->code_quality_score,
                'code_review_score' => $dev->code_review_score,
                'total_commits' => $dev->total_commits,
                'total_pull_requests' => $dev->total_pull_requests,
                'tasks_completed' => $dev->tasks_completed,
                'avg_response_time' => $dev->avg_response_time,
                'overall_score' => $dev->overall_score,
            ]);

        return response()->json([
            'status' => 'success',
            'data' => $developers,
        ]);
    }
}

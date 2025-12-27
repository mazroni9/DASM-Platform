<?php

namespace App\Models\Monitoring;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeveloperMetric extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'github_username',
        'total_commits',
        'total_pull_requests',
        'total_deployments',
        'code_quality_score',
        'total_bugs_fixed',
        'total_bugs_introduced',
        'avg_response_time',
        'tasks_completed',
        'tasks_in_progress',
        'tasks_pending',
        'productivity_score',
        'code_review_score',
        'last_activity_at',
    ];

    protected $casts = [
        'last_activity_at' => 'datetime',
    ];

    /**
     * Get the user associated with this metric
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get daily snapshots for this developer
     */
    public function dailySnapshots(): HasMany
    {
        return $this->hasMany(DailyDeveloperSnapshot::class, 'developer_metric_id');
    }

    /**
     * Calculate overall performance score
     */
    public function getOverallScoreAttribute(): float
    {
        $weights = [
            'productivity' => 0.3,
            'code_quality' => 0.25,
            'code_review' => 0.2,
            'bug_ratio' => 0.15,
            'response_time' => 0.1,
        ];

        $scores = [
            'productivity' => $this->productivity_score ?? 0,
            'code_quality' => $this->code_quality_score ?? 0,
            'code_review' => $this->code_review_score ?? 0,
            'bug_ratio' => $this->calculateBugRatio(),
            'response_time' => $this->calculateResponseTimeScore(),
        ];

        $totalScore = 0;
        foreach ($weights as $key => $weight) {
            $totalScore += ($scores[$key] * $weight);
        }

        return round($totalScore, 2);
    }

    /**
     * Calculate bug ratio score (lower bugs = higher score)
     */
    private function calculateBugRatio(): float
    {
        if ($this->total_bugs_fixed === 0) {
            return 100;
        }

        $bugRatio = $this->total_bugs_introduced / max($this->total_bugs_fixed, 1);
        return max(0, 100 - ($bugRatio * 50));
    }

    /**
     * Calculate response time score (lower time = higher score)
     */
    private function calculateResponseTimeScore(): float
    {
        $avgTime = $this->avg_response_time ?? 0;
        if ($avgTime <= 1) {
            return 100;
        }
        if ($avgTime >= 10) {
            return 0;
        }
        return 100 - (($avgTime - 1) / 9 * 100);
    }

    /**
     * Get performance trend (comparing to last week)
     */
    public function getPerformanceTrendAttribute(): array
    {
        $weekAgo = now()->subWeek();
        $recentSnapshots = $this->dailySnapshots()
            ->where('snapshot_date', '>=', $weekAgo)
            ->orderBy('snapshot_date')
            ->get();

        if ($recentSnapshots->isEmpty()) {
            return ['trend' => 'stable', 'change_percent' => 0];
        }

        $oldScore = $recentSnapshots->first()->code_quality_score ?? 0;
        $newScore = $recentSnapshots->last()->code_quality_score ?? 0;

        $changePercent = $oldScore > 0 ? (($newScore - $oldScore) / $oldScore) * 100 : 0;
        $trend = $changePercent > 5 ? 'improving' : ($changePercent < -5 ? 'declining' : 'stable');

        return [
            'trend' => $trend,
            'change_percent' => round($changePercent, 2),
        ];
    }

    /**
     * Update metrics from GitHub data
     */
    public function updateFromGitHub(array $githubData): void
    {
        $this->update([
            'total_commits' => $githubData['commits'] ?? $this->total_commits,
            'total_pull_requests' => $githubData['pull_requests'] ?? $this->total_pull_requests,
            'last_activity_at' => now(),
        ]);
    }

    /**
     * Scope: Get top performers
     */
    public function scopeTopPerformers($query, int $limit = 10)
    {
        return $query->orderByRaw('
            (productivity_score * 0.3 + code_quality_score * 0.25 + code_review_score * 0.2) DESC
        ')->limit($limit);
    }

    /**
     * Scope: Get developers needing attention
     */
    public function scopeNeedsAttention($query)
    {
        return $query->where('productivity_score', '<', 50)
            ->orWhere('code_quality_score', '<', 50)
            ->orWhere('total_bugs_introduced', '>', 10);
    }
}

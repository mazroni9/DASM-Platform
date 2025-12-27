<?php
namespace App\Models\Monitoring;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyDeveloperSnapshot extends Model
{
    protected $fillable = ['developer_metric_id', 'snapshot_date', 'commits_count', 'pull_requests_count', 'code_reviews_count', 'bugs_fixed', 'bugs_introduced', 'code_quality_score', 'tasks_completed', 'working_hours', 'notes'];
    protected $casts = ['snapshot_date' => 'date'];
    public function developerMetric(): BelongsTo { return $this->belongsTo(DeveloperMetric::class); }
}

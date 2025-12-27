<?php
namespace App\Models\Monitoring;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeploymentLog extends Model
{
    protected $fillable = ['deployed_by', 'branch_name', 'commit_hash', 'environment', 'status', 'started_at', 'completed_at', 'duration_seconds', 'deployment_notes', 'error_message', 'changes_summary', 'files_changed', 'lines_added', 'lines_removed'];
    protected $casts = ['started_at' => 'datetime', 'completed_at' => 'datetime', 'changes_summary' => 'json'];
    public function deployedBy(): BelongsTo { return $this->belongsTo(User::class, 'deployed_by'); }
}

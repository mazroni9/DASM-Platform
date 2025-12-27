<?php
namespace App\Models\Monitoring;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemAlert extends Model
{
    protected $fillable = ['alert_type', 'severity', 'title', 'description', 'metadata', 'is_acknowledged', 'acknowledged_at', 'acknowledged_by', 'resolution_notes', 'is_resolved', 'resolved_at'];
    protected $casts = ['metadata' => 'json', 'is_acknowledged' => 'boolean', 'acknowledged_at' => 'datetime', 'is_resolved' => 'boolean', 'resolved_at' => 'datetime'];
    public function acknowledgedBy(): BelongsTo { return $this->belongsTo(User::class, 'acknowledged_by'); }
}

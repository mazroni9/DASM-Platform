<?php
namespace App\Models\Monitoring;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlatformErrorLog extends Model
{
    protected $fillable = ['error_type', 'error_message', 'error_trace', 'file_path', 'line_number', 'severity', 'endpoint', 'method', 'user_id', 'request_data', 'response_data', 'ip_address', 'user_agent', 'is_resolved', 'resolved_at', 'resolution_notes'];
    protected $casts = ['request_data' => 'json', 'response_data' => 'json', 'is_resolved' => 'boolean', 'resolved_at' => 'datetime'];
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}

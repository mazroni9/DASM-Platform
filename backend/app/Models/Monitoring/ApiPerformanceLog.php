<?php
namespace App\Models\Monitoring;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApiPerformanceLog extends Model
{
    protected $fillable = ['endpoint', 'method', 'status_code', 'response_time', 'request_size', 'response_size', 'user_id', 'ip_address', 'error_message', 'is_cached', 'request_time'];
    protected $casts = ['request_time' => 'datetime', 'is_cached' => 'boolean'];
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}

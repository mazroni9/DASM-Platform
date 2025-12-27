<?php
namespace App\Models\Monitoring;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeatureUsageLog extends Model
{
    protected $fillable = ['feature_name', 'feature_category', 'user_id', 'usage_count', 'avg_duration', 'is_successful', 'error_message', 'metadata', 'last_used_at'];
    protected $casts = ['metadata' => 'json', 'last_used_at' => 'datetime', 'is_successful' => 'boolean'];
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}

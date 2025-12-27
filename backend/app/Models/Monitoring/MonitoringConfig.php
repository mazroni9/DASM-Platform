<?php
namespace App\Models\Monitoring;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonitoringConfig extends Model
{
    protected $fillable = ['config_key', 'config_value', 'description', 'is_active', 'updated_by'];
    protected $casts = ['config_value' => 'json', 'is_active' => 'boolean'];
    public function updatedBy(): BelongsTo { return $this->belongsTo(User::class); }
}

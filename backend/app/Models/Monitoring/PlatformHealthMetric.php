<?php
namespace App\Models\Monitoring;
use Illuminate\Database\Eloquent\Model;

class PlatformHealthMetric extends Model
{
    protected $fillable = ['check_time', 'cpu_usage', 'memory_usage', 'disk_usage', 'active_users', 'api_requests_per_minute', 'avg_response_time', 'error_count', 'database_connections', 'database_query_time', 'is_healthy', 'alerts'];
    protected $casts = ['check_time' => 'datetime', 'is_healthy' => 'boolean'];
}

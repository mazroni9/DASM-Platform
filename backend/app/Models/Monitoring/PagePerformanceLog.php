<?php
namespace App\Models\Monitoring;
use Illuminate\Database\Eloquent\Model;

class PagePerformanceLog extends Model
{
    protected $fillable = ['page_path', 'page_name', 'load_time', 'render_time', 'total_requests', 'failed_requests', 'avg_response_time', 'unique_visitors', 'total_visits', 'bounce_rate', 'status', 'measurement_time'];
    protected $casts = ['measurement_time' => 'datetime'];
}

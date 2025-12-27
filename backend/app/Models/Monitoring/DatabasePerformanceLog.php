<?php
namespace App\Models\Monitoring;
use Illuminate\Database\Eloquent\Model;

class DatabasePerformanceLog extends Model
{
    protected $fillable = ['query_type', 'table_name', 'execution_time', 'rows_affected', 'is_slow', 'query_hash', 'error_message', 'executed_at'];
    protected $casts = ['is_slow' => 'boolean', 'executed_at' => 'datetime'];
}

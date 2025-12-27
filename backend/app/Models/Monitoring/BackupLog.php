<?php
namespace App\Models\Monitoring;
use Illuminate\Database\Eloquent\Model;

class BackupLog extends Model
{
    protected $fillable = ['backup_type', 'status', 'started_at', 'completed_at', 'duration_seconds', 'backup_location', 'backup_size', 'error_message', 'is_verified', 'verified_at', 'verification_notes'];
    protected $casts = ['started_at' => 'datetime', 'completed_at' => 'datetime', 'verified_at' => 'datetime', 'is_verified' => 'boolean'];
}

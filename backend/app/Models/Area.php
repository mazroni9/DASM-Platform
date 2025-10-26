<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Area extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = ['name', 'code'];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
        ->setDescriptionForEvent(function(string $eventName) {
            switch ($eventName) {
                case 'created':
                    return "تم إنشاء المنطقة رقم {$this->id}";
                case 'updated':
                    return "تم تحديث المنطقة رقم {$this->id}";
                case 'deleted':
                    return "تم حذف المنطقة رقم {$this->id}";
            }
            return "Area {$eventName}";
        })->logFillable()
        ->useLogName('area_log');
    }
}

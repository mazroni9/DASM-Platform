<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Bid extends Model
{
    use HasFactory, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->setDescriptionForEvent(function(string $eventName) {
                return match ($eventName) {
                    'created' => "تم إنشاء المزايدة رقم {$this->id}",
                    'updated' => "تم تحديث المزايدة رقم {$this->id}",
                    'deleted' => "تم حذف المزايدة رقم {$this->id}",
                    default => "Bid {$eventName}",
                };
            })
            ->logFillable()
            ->useLogName('bid_log');
    }

    protected $fillable = [
        'auction_id',
        'user_id',
        'bid_amount',
        'no_account',
        'bidder_name',
        'auction_type_at_bid',
        'increment',
    ];

    // ✅ created_at فقط
    public $timestamps = true;
    const UPDATED_AT = null;

    protected $casts = [
        'no_account' => 'boolean',
        'created_at' => 'datetime',
    ];

    public function auction()
    {
        return $this->belongsTo(Auction::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getBidderNameAttribute()
    {
        if ($this->no_account) {
            return $this->bidder_name;
        }

        return $this->user
            ? trim(($this->user->first_name ?? '') . ' ' . ($this->user->last_name ?? ''))
            : 'Unknown';
    }
}

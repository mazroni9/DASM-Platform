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
            switch ($eventName) {
                case 'created':
                    return "تم إنشاء المزايدة رقم {$this->id}";
                case 'updated':
                    return "تم تحديث المزايدة رقم {$this->id}";
                case 'deleted':
                    return "تم حذف المزايدة رقم {$this->id}";
            }
            return "Bid {$eventName}";
        })->logFillable()
        ->useLogName('bid_log');
    }

    protected $fillable = [
        'auction_id',
        'user_id',
        'bid_amount',
        'no_account',
        'bidder_name',
        'auction_type_at_bid', // تمت إضافتها
        'increment',           // تمت إضافتها
    ];

    public $timestamps = false;
    const CREATED_AT = 'created_at';

    protected $casts = [
        'no_account' => 'boolean',
    ];

    // A Bid belongs to an Auction.
    public function auction()
    {
        return $this->belongsTo(Auction::class);
    }

    // A Bid belongs to a User (nullable for no_account bids).
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Get the bidder name (either from user or bidder_name field)
    public function getBidderNameAttribute()
    {
        if ($this->no_account) {
            return $this->bidder_name;
        }
        return $this->user ? $this->user->first_name . ' ' . $this->user->last_name : 'Unknown';
    }
}

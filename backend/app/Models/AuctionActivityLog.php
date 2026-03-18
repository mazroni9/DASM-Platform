<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuctionActivityLog extends Model
{
    protected $table = 'auction_activity_logs';

    protected $fillable = [
        'event_type',
        'subject_type',
        'subject_id',
        'payload',
        'occurred_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'occurred_at' => 'datetime',
    ];
}

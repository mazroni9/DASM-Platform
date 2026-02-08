<?php

namespace Modules\Test\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuctionTestEvent extends Model
{
    protected $table = 'auction_test_events';

    protected $fillable = [
        'run_id',
        'event_type',
        'latency_ms',
        'user_id',
        'bid_id',
        'bid_amount',
        'message',
        'meta',
        'occurred_at',
    ];

    protected $casts = [
        'occurred_at' => 'datetime',
        'meta' => 'array',
    ];

    public function run(): BelongsTo
    {
        return $this->belongsTo(AuctionTestRun::class, 'run_id');
    }
}

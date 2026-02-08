<?php

namespace Modules\Test\Entities;

use App\Models\Auction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AuctionTestRun extends Model
{
    protected $table = 'auction_test_runs';

    protected $fillable = [
        'scenario_key',
        'status',
        'user_count',
        'duration_seconds',
        'total_bids',
        'successful_bids',
        'failed_bids',
        'avg_latency_ms',
        'max_latency_ms',
        'auction_id',
        'options',
        'started_at',
        'completed_at',
        'error_message',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'options' => 'array',
    ];

    public function events(): HasMany
    {
        return $this->hasMany(AuctionTestEvent::class, 'run_id');
    }

    public function auction(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Auction::class);
    }
}

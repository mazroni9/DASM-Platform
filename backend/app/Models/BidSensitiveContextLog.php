<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Audit row for browser/session context at bid time.
 * Coordinates are for internal review only — never expose in public UI.
 *
 * @property-read User $user
 * @property-read Auction $auction
 * @property-read Car|null $car
 * @property-read Bid|null $bid
 */
class BidSensitiveContextLog extends Model
{
    protected $table = 'bid_sensitive_context_logs';

    protected $fillable = [
        'user_id',
        'auction_id',
        'car_id',
        'bid_id',
        'client_session_id',
        'ip_address',
        'user_agent',
        'online_status',
        'network_effective_type',
        'network_downlink',
        'geolocation_source',
        'permission_state',
        'latitude',
        'longitude',
        'accuracy_meters',
        'city',
        'region',
        'captured_at',
        'risk_flags',
        'metadata',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'accuracy_meters' => 'float',
        'network_downlink' => 'float',
        'captured_at' => 'datetime',
        'risk_flags' => 'array',
        'metadata' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function auction(): BelongsTo
    {
        return $this->belongsTo(Auction::class);
    }

    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }

    public function bid(): BelongsTo
    {
        return $this->belongsTo(Bid::class);
    }
}

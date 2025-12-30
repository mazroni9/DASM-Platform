<?php

namespace App\Models;

use App\Enums\AuctionStatus;
use App\Enums\AuctionType;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Schema;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Auction extends Model
{
    use HasFactory, LogsActivity;

    public const EXTENSION_THRESHOLD_SECONDS = 60;
    public const EXTENSION_DURATION_MINUTES = 5;

    private static array $auctionsColumnCache = [];

    private static function auctionsTableHas(string $column): bool
    {
        if (!array_key_exists($column, self::$auctionsColumnCache)) {
            try {
                self::$auctionsColumnCache[$column] = Schema::hasColumn('auctions', $column);
            } catch (\Throwable $e) {
                self::$auctionsColumnCache[$column] = false;
            }
        }
        return (bool) self::$auctionsColumnCache[$column];
    }

    protected $fillable = [
        'car_id',
        'session_id',
        'start_time',
        'end_time',
        'minimum_bid',
        'maximum_bid',
        'current_bid',
        'reserve_price',
        'status',
        'auction_type',
        'opening_price',
        'control_room_approved',
        'approved_for_live',
        'extended_until',
        'last_bid_time',
        // 'starting_bid' intentionally not mass-assignable (we support it via accessor/mutator safely)
    ];

    protected $casts = [
        'status' => AuctionStatus::class,
        'auction_type' => AuctionType::class,
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'extended_until' => 'datetime',
        'last_bid_time' => 'datetime',
        'control_room_approved' => 'boolean',
        'approved_for_live' => 'boolean',
    ];

    protected $appends = [
        'time_remaining',
        'status_label',
        'current_price',  // ✅ alias للفرونت
        'starting_bid',   // ✅ compatibility: used in jobs/events/logs
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->setDescriptionForEvent(function (string $eventName) {
                return match ($eventName) {
                    'created' => "تم إنشاء المزاد رقم {$this->id}",
                    'updated' => "تم تحديث المزاد رقم {$this->id}",
                    'deleted' => "تم حذف المزاد رقم {$this->id}",
                    default => "Auction {$eventName}",
                };
            })
            ->logFillable()
            ->useLogName('auction_log');
    }

    /**
     * ✅ alias: current_price -> current_bid
     */
    public function getCurrentPriceAttribute(): float
    {
        return (float)($this->current_bid ?? 0);
    }

    /**
     * ✅ Compatibility: starting_bid (لو موجود في DB هنقراه، لو مش موجود هنستخدم opening_price/minimum_bid)
     */
    public function getStartingBidAttribute(): float
    {
        if (self::auctionsTableHas('starting_bid')) {
            $raw = $this->attributes['starting_bid'] ?? null;
            if ($raw !== null && $raw !== '') return (float)$raw;
        }

        $opening = $this->attributes['opening_price'] ?? null;
        if ($opening !== null && $opening !== '') return (float)$opening;

        $min = $this->attributes['minimum_bid'] ?? null;
        if ($min !== null && $min !== '') return (float)$min;

        return 0.0;
    }

    /**
     * ✅ لو حد بعت starting_bid (أو الكود القديم بيستخدمه) نطبعها صح
     */
    public function setStartingBidAttribute($value): void
    {
        if ($value === null || $value === '') return;

        $v = (float)$value;

        if (self::auctionsTableHas('starting_bid')) {
            $this->attributes['starting_bid'] = $v;
        }

        // keep compatible fields
        if (self::auctionsTableHas('opening_price') && empty($this->attributes['opening_price'])) {
            $this->attributes['opening_price'] = $v;
        }
        if (self::auctionsTableHas('minimum_bid') && empty($this->attributes['minimum_bid'])) {
            $this->attributes['minimum_bid'] = $v;
        }
    }

    /**
     * ✅ Safe normalize قبل الحفظ (يمنع كسر enum casting)
     */
    public function setStatusAttribute($value): void
    {
        if ($value instanceof AuctionStatus) {
            $this->attributes['status'] = $value->value;
            return;
        }

        $this->attributes['status'] = AuctionStatus::normalize((string)$value);
    }

    /**
     * ✅ قيمة status دايمًا سترينج موحّد
     */
    public function statusValue(): string
    {
        $s = $this->status;
        if ($s instanceof AuctionStatus) return $s->value;
        return AuctionStatus::normalize((string)$s);
    }

    public function getEffectiveEndTime(): ?Carbon
    {
        return $this->extended_until ?? $this->end_time;
    }

    public function maybeExtendOnLastMinuteBid(?Carbon $bidTime = null): void
    {
        $bidTime = $bidTime ?? Carbon::now();

        $endTime = $this->getEffectiveEndTime();
        if (!$endTime) return;

        if ($bidTime->greaterThanOrEqualTo($endTime)) return;

        $remainingSeconds = $bidTime->diffInSeconds($endTime, false);
        if ($remainingSeconds <= 0) return;

        if ($remainingSeconds <= self::EXTENSION_THRESHOLD_SECONDS) {
            $newEnd = $endTime->copy()->addMinutes(self::EXTENSION_DURATION_MINUTES);
            $this->extended_until = $newEnd;
            $this->save();
        }
    }

    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(AuctionSession::class, 'session_id');
    }

    public function isInLiveAuctionPeriod(): bool
    {
        $now = Carbon::now();
        $hour = (int) $now->format('H');
        return $hour >= 16 && $hour < 19;
    }

    public function isInLiveInstantPeriod(): bool
    {
        $now = Carbon::now();
        $hour = (int) $now->format('H');
        return $hour >= 19 && $hour < 22;
    }

    public function isInSilentPeriod(): bool
    {
        $now = Carbon::now();
        $hour = (int) $now->format('H');
        return $hour >= 22 || $hour < 16;
    }

    public function updateAuctionTypeBasedOnTime(): self
    {
        $previousType = $this->auction_type;
        $hadPreviousBids = ((float)($this->current_bid ?? 0)) > 0;

        if ($this->isInLiveAuctionPeriod() && $this->approved_for_live) {
            $this->auction_type = AuctionType::LIVE;
        } elseif ($this->isInLiveInstantPeriod()) {
            $this->auction_type = AuctionType::LIVE_INSTANT;

            if ($previousType === AuctionType::LIVE && $hadPreviousBids) {
                $this->opening_price = $this->current_bid;
            }
        } else {
            $this->auction_type = AuctionType::SILENT_INSTANT;

            if ($previousType === AuctionType::LIVE_INSTANT && $hadPreviousBids) {
                $this->opening_price = $this->current_bid;
            }
        }

        $this->save();
        return $this;
    }

    public function processBid($amount, $userId): array
    {
        if (!$this->isActive()) {
            return ['success' => false, 'message' => 'This auction is not active'];
        }

        $current = (float) ($this->current_bid ?? 0);
        if ((float)$amount <= $current) {
            return ['success' => false, 'message' => 'Bid must be higher than current bid'];
        }

        // ✅ base price آمن (لو opening_price null)
        $basePrice = (float)($this->opening_price ?? 0);
        if ($basePrice <= 0) $basePrice = (float)($this->reserve_price ?? 0);
        if ($basePrice <= 0) $basePrice = (float)($this->minimum_bid ?? 0);
        if ($basePrice <= 0) $basePrice = max(1.0, $current);

        switch ($this->auction_type) {
            case AuctionType::LIVE:
                // standard rules
                break;

            case AuctionType::LIVE_INSTANT:
            case AuctionType::SILENT_INSTANT:
                $minAllowed = $basePrice * 0.9; // -10%
                $maxAllowed = $basePrice * 1.3; // +30%

                if ((float)$amount < $minAllowed || (float)$amount > $maxAllowed) {
                    return ['success' => false, 'message' => 'Bid must be within the allowed range'];
                }

                if ($this->auction_type === AuctionType::SILENT_INSTANT && (float)$amount >= (float)($this->reserve_price ?? 0)) {
                    $this->acceptBid($amount, $userId);
                    return [
                        'success' => true,
                        'message' => 'Bid accepted automatically',
                        'auto_accept' => true
                    ];
                }
                break;

            default:
                break;
        }

        $increment = (float)$amount - $current;

        $bid = Bid::create([
            'auction_id' => $this->id,
            'user_id' => $userId,
            'bid_amount' => $amount,
            'auction_type_at_bid' => ($this->auction_type instanceof AuctionType) ? $this->auction_type->value : (string)$this->auction_type,
            'increment' => $increment,
        ]);

        $now = Carbon::now();
        $this->current_bid = $amount;
        $this->last_bid_time = $now;
        $this->save();

        $this->maybeExtendOnLastMinuteBid($now);

        return ['success' => true, 'message' => 'Bid placed successfully', 'bid' => $bid];
    }

    public function acceptBid($amount, $userId): self
    {
        Bid::firstOrCreate([
            'auction_id' => $this->id,
            'user_id' => $userId,
            'bid_amount' => $amount
        ], [
            'auction_type_at_bid' => ($this->auction_type instanceof AuctionType) ? $this->auction_type->value : (string)$this->auction_type,
            'increment' => 0,
        ]);

        $this->current_bid = $amount;
        $this->status = AuctionStatus::ENDED;
        $this->save();

        if ($this->car) {
            $this->car->auction_status = 'sold';
            $this->car->save();
        }

        Settlement::create([
            'auction_id' => $this->id,
            'seller_id' => $this->car?->dealer_id,
            'buyer_id' => $userId,
            'car_id' => $this->car_id,
            'final_price' => $amount,
            'platform_fee' => $this->calculatePlatformFee($amount),
            'tam_fee' => 0,
            'net_amount' => $amount - $this->calculatePlatformFee($amount),
            'status' => 'pending'
        ]);

        return $this;
    }

    protected function calculatePlatformFee($amount): float
    {
        return (float)$amount * 0.05;
    }

    public function approveByControlRoom($openingPrice, $approveForLive = false): self
    {
        $this->opening_price = $openingPrice;

        if (!$this->minimum_bid) {
            $this->minimum_bid = $openingPrice;
        }

        $this->control_room_approved = true;
        $this->approved_for_live = $approveForLive;
        $this->save();

        return $this;
    }

    /**
     * ✅ Active = live OR active
     */
    public function isActive(): bool
    {
        return in_array($this->statusValue(), AuctionStatus::activeValues(), true);
    }

    public function start(): self
    {
        if ($this->statusValue() === AuctionStatus::SCHEDULED->value && $this->control_room_approved) {
            $this->status = AuctionStatus::ACTIVE; // live
            $this->updateAuctionTypeBasedOnTime();
            $this->save();

            if ($this->car) {
                $this->car->auction_status = 'in_auction';
                $this->car->save();
            }

            if (in_array($this->auction_type, [AuctionType::LIVE, AuctionType::LIVE_INSTANT], true)) {
                $this->liveStreamingSession()->create([
                    'status' => 'pending',
                    'started_at' => Carbon::now()
                ]);
            }
        }

        return $this;
    }

    public function end(): self
    {
        if ($this->isActive()) {
            if ((float)($this->current_bid ?? 0) >= (float)($this->reserve_price ?? 0)) {
                $this->status = AuctionStatus::ENDED;
            } else {
                $this->status = AuctionStatus::FAILED;

                if ($this->car) {
                    $this->car->auction_status = 'available';
                    $this->car->save();
                }
            }

            $this->save();
        }

        return $this;
    }

    public function updateStatusBasedOnTime(): self
    {
        $now = Carbon::now();

        if ($this->statusValue() === AuctionStatus::SCHEDULED->value && $this->start_time && $now >= $this->start_time && $this->control_room_approved) {
            $this->start();
        } elseif ($this->isActive()) {
            $this->updateAuctionTypeBasedOnTime();

            $endTime = $this->getEffectiveEndTime();
            if ($endTime && $now > $endTime) {
                $this->end();
            }
        }

        return $this;
    }

    public function getTimeRemainingAttribute(): int
    {
        if (!$this->isActive()) return 0;

        $endTime = $this->getEffectiveEndTime();
        if (!$endTime) return 0;

        $now = Carbon::now();
        if ($now > $endTime) return 0;

        return $now->diffInSeconds($endTime);
    }

    public function liveStreamingSession(): HasOne
    {
        return $this->hasOne(LiveStreamingSession::class);
    }

    public function bids(): HasMany
    {
        return $this->hasMany(Bid::class);
    }

    public function getStatusLabelAttribute(): string
    {
        $s = $this->status;
        return ($s instanceof AuctionStatus) ? $s->label() : '';
    }

    public function broadcasts()
    {
        return $this->hasMany(Broadcast::class, 'auction_id', 'id');
    }
}

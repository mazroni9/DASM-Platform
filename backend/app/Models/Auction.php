<?php

namespace App\Models;

use App\Enums\AuctionStatus;
use App\Enums\AuctionType; // Add the new enum
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Auction extends Model
{
    use HasFactory, LogsActivity;

    /**
     * عدد الثواني المسموح فيها بالتمديد (آخر دقيقة)
     */
    public const EXTENSION_THRESHOLD_SECONDS = 60;

    /**
     * مدة التمديد بالدقائق عند حدوث مزايدة في آخر دقيقة
     */
    public const EXTENSION_DURATION_MINUTES = 5;

    protected $fillable = [
        'car_id',
        'session_id',
        'start_time',
        'end_time',
        'minimum_bid',
        'maximum_bid', // Renamed from max_price
        'current_bid',
        'reserve_price', // Renamed from min_price
        'status',
        'auction_type',
        'opening_price', // Set by control room
        'control_room_approved', // Approval status
        'approved_for_live', // Can enter live auction
        'extended_until', // For auction extensions
        'last_bid_time', // Track when the last bid was placed
    ];

    public function getActivitylogOptions(): LogOptions
    {
        //events: created, updated, deleted
        return LogOptions::defaults()
            ->setDescriptionForEvent(function (string $eventName) {
                switch ($eventName) {
                    case 'created':
                        return "تم إنشاء المزاد رقم {$this->id}";
                    case 'updated':
                        return "تم تحديث المزاد رقم {$this->id}";
                    case 'deleted':
                        return "تم حذف المزاد رقم {$this->id}";
                }
                return "Auction {$eventName}";
            })->logFillable()
            //->logOnlyDirty()
            ->useLogName('auction_log');
        //->setDescriptionForEvent(fn(string $eventName) => "This model has been {$eventName}");
    }

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
        'status_label'
    ];

    /**
     * الوقت الفعلي لانتهاء المزاد (يا extended_until يا end_time)
     */
    public function getEffectiveEndTime(): ?Carbon
    {
        return $this->extended_until ?? $this->end_time;
    }

    /**
     * تمديد المزاد تلقائياً لو حصلت مزايدة في آخر دقيقة
     */
    public function maybeExtendOnLastMinuteBid(?Carbon $bidTime = null): void
    {
        $bidTime = $bidTime ?? Carbon::now();

        $endTime = $this->getEffectiveEndTime();
        if (!$endTime) {
            return;
        }

        // لو المزايدة بعد وقت الانتهاء الحقيقي، مفيش تمديد
        if ($bidTime->greaterThanOrEqualTo($endTime)) {
            return;
        }

        // الثواني المتبقية وقت المزايدة
        $remainingSeconds = $bidTime->diffInSeconds($endTime, false);

        // لو متبقي وقت سالب أو صفر، مفيش تمديد
        if ($remainingSeconds <= 0) {
            return;
        }

        // شرط التمديد: مزايدة في آخر دقيقة
        if ($remainingSeconds <= self::EXTENSION_THRESHOLD_SECONDS) {
            // نبدأ من وقت الانتهاء الفعلي الحالي (سواء end_time أو extended_until)
            $newEnd = $endTime->copy()->addMinutes(self::EXTENSION_DURATION_MINUTES);
            $this->extended_until = $newEnd;
            $this->save();
        }
    }

    /**
     * Get the car associated with the auction.
     */
    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }

    /**
     * Get the session associated with the auction.
     */
    public function session(): BelongsTo
    {
        return $this->belongsTo(AuctionSession::class, 'session_id');
    }

    /**
     * Check if the auction is in the live auction period
     */
    public function isInLiveAuctionPeriod(): bool
    {
        $now = Carbon::now();
        $hour = (int) $now->format('H');

        // Live Auction period is 16:00 - 19:00 (4PM - 7PM)
        return $hour >= 16 && $hour < 19;
    }

    /**
     * Check if the auction is in the live instant period
     */
    public function isInLiveInstantPeriod(): bool
    {
        $now = Carbon::now();
        $hour = (int) $now->format('H');

        // Live Instant period is 19:00 - 22:00 (7PM - 10PM)
        return $hour >= 19 && $hour < 22;
    }

    /**
     * Check if the auction is in the silent auction period
     */
    public function isInSilentPeriod(): bool
    {
        $now = Carbon::now();
        $hour = (int) $now->format('H');

        // Silent period is 22:00 - 16:00 next day (10PM - 4PM)
        return $hour >= 22 || $hour < 16;
    }

    /**
     * Update the auction type based on current time
     */
    public function updateAuctionTypeBasedOnTime(): self
    {
        $previousType = $this->auction_type;
        $hadPreviousBids = $this->current_bid > 0;

        // Determine the new auction type
        if ($this->isInLiveAuctionPeriod() && $this->approved_for_live) {
            $this->auction_type = AuctionType::LIVE;
        } elseif ($this->isInLiveInstantPeriod()) {
            $this->auction_type = AuctionType::LIVE_INSTANT;

            // If transitioning from LIVE to LIVE_INSTANT and we had bids, update opening price
            if ($previousType === AuctionType::LIVE && $hadPreviousBids) {
                $this->opening_price = $this->current_bid;
            }
        } else {
            $this->auction_type = AuctionType::SILENT_INSTANT;

            // If transitioning from LIVE_INSTANT to SILENT_INSTANT and we had bids, update opening price
            if ($previousType === AuctionType::LIVE_INSTANT && $hadPreviousBids) {
                $this->opening_price = $this->current_bid;
            }
        }

        $this->save();

        return $this;
    }

    /**
     * Process a new bid based on auction type rules
     */
    public function processBid($amount, $userId): array
    {
        // Validation checks
        if (!$this->isActive()) {
            return [
                'success' => false,
                'message' => 'This auction is not active'
            ];
        }

        if ($amount <= $this->current_bid) {
            return [
                'success' => false,
                'message' => 'Bid must be higher than current bid'
            ];
        }

        // Apply auction type specific rules
        switch ($this->auction_type) {
            case AuctionType::LIVE:
                // Live auction has standard rules
                break;

            case AuctionType::LIVE_INSTANT:
            case AuctionType::SILENT_INSTANT:
                // Check if bid is within allowed range
                $minAllowed = $this->opening_price * 0.9; // -10%
                $maxAllowed = $this->opening_price * 1.3; // +30%

                if ($amount < $minAllowed || $amount > $maxAllowed) {
                    return [
                        'success' => false,
                        'message' => 'Bid must be within the allowed range'
                    ];
                }

                // ❗ التمديد القديم 15 دقيقة عند الوصول لـ reserve_price تم إلغاؤه
                // لأننا الآن بنستخدم منطق التمديد في آخر دقيقة فقط

                // For Silent Instant, auto-accept if reserve price is reached
                if (
                    $this->auction_type === AuctionType::SILENT_INSTANT &&
                    $amount >= $this->reserve_price
                ) {
                    $this->acceptBid($amount, $userId);
                    return [
                        'success' => true,
                        'message' => 'Bid accepted automatically',
                        'auto_accept' => true
                    ];
                }
                break;
        }

        // Create the bid
        $bid = Bid::create([
            'auction_id' => $this->id,
            'user_id' => $userId,
            'bid_amount' => $amount
        ]);

        // Update auction
        $now = Carbon::now();
        $this->current_bid = $amount;
        $this->last_bid_time = $now;
        $this->save();

        // ✅ تمديد المزاد لو المزايدة صارت في آخر دقيقة
        $this->maybeExtendOnLastMinuteBid($now);

        return [
            'success' => true,
            'message' => 'Bid placed successfully',
            'bid' => $bid
        ];
    }

    /**
     * Accept a bid (for seller manual accepts or auto-accept)
     */
    public function acceptBid($amount, $userId): self
    {
        // Create final bid if it doesn't exist
        $bid = Bid::firstOrCreate(
            [
                'auction_id' => $this->id,
                'user_id' => $userId,
                'bid_amount' => $amount
            ]
        );

        // Update auction
        $this->current_bid = $amount;
        $this->status = AuctionStatus::ENDED;
        $this->save();

        // Update car status
        if ($this->car) {
            $this->car->auction_status = 'sold';
            $this->car->save();
        }

        // Create settlement
        Settlement::create([
            'auction_id' => $this->id,
            'seller_id' => $this->car->dealer_id,
            'buyer_id' => $userId,
            'car_id' => $this->car_id,
            'final_price' => $amount,
            'platform_fee' => $this->calculatePlatformFee($amount),
            'tam_fee' => 0, // Set appropriate value
            'net_amount' => $amount - $this->calculatePlatformFee($amount),
            'status' => 'pending'
        ]);

        return $this;
    }

    /**
     * Calculate platform fee based on final amount
     */
    protected function calculatePlatformFee($amount): float
    {
        // Implement your fee calculation logic
        return $amount * 0.05; // Example: 5% fee
    }

    /**
     * Control room approval
     */
    public function approveByControlRoom($openingPrice, $approveForLive = false): self
    {
        $this->opening_price = $openingPrice;
        // Set minimum_bid to match opening price if not already set
        if (!$this->minimum_bid) {
            $this->minimum_bid = $openingPrice;
        }
        $this->control_room_approved = true;
        $this->approved_for_live = $approveForLive;
        $this->save();

        return $this;
    }

    /**
     * Check if the auction is active
     */
    public function isActive(): bool
    {
        return $this->status === AuctionStatus::ACTIVE;
    }

    /**
     * Start the auction if scheduled
     */
    public function start(): self
    {
        if ($this->status === AuctionStatus::SCHEDULED && $this->control_room_approved) {
            $this->status = AuctionStatus::ACTIVE;
            $this->updateAuctionTypeBasedOnTime(); // Set the proper auction type
            $this->save();

            // Update car status
            if ($this->car) {
                $this->car->auction_status = 'active';
                $this->car->save();
            }

            // If this is a live auction type that needs streaming, create session
            if (in_array($this->auction_type, [AuctionType::LIVE, AuctionType::LIVE_INSTANT])) {
                $this->liveStreamingSession()->create([
                    'status' => 'pending',
                    'started_at' => Carbon::now()
                ]);
            }
        }

        return $this;
    }

    /**
     * End the auction
     */
    public function end(): self
    {
        if ($this->status === AuctionStatus::ACTIVE) {
            // If current bid meets or exceeds reserve price, consider auction successful
            if ($this->current_bid >= $this->reserve_price) {
                $this->status = AuctionStatus::ENDED;
                // Car status should be updated to "sold" when accepted by seller or automatically
            } else {
                $this->status = AuctionStatus::FAILED;
                if ($this->car) {
                    $this->car->auction_status = 'failed';
                    $this->car->save();
                }
            }

            $this->save();
        }

        return $this;
    }

    /**
     * Check if auction needs status update based on current time
     */
    public function updateStatusBasedOnTime(): self
    {
        $now = Carbon::now();

        if ($this->status === AuctionStatus::SCHEDULED && $now >= $this->start_time && $this->control_room_approved) {
            $this->start();
        } elseif ($this->status === AuctionStatus::ACTIVE) {
            // Check if auction type needs to change
            $this->updateAuctionTypeBasedOnTime();

            // Check if auction has ended
            $endTime = $this->getEffectiveEndTime();
            if ($endTime && $now > $endTime) {
                $this->end();
            }
        }

        return $this;
    }

    /**
     * Get time remaining
     */
    public function getTimeRemainingAttribute()
    {
        if ($this->status !== AuctionStatus::ACTIVE) {
            return 0;
        }

        $endTime = $this->getEffectiveEndTime();
        if (!$endTime) {
            return 0;
        }

        $now = Carbon::now();

        if ($now > $endTime) {
            return 0;
        }

        return $now->diffInSeconds($endTime);
    }

    /**
     * Get the live streaming session for this auction
     */
    public function liveStreamingSession(): HasOne
    {
        return $this->hasOne(LiveStreamingSession::class);
    }

    /**
     * Get the bids for this auction
     */
    public function bids(): HasMany
    {
        return $this->hasMany(Bid::class);
    }

    public function getStatusLabelAttribute()
    {
        return $this->status ? $this->status->label() : '';
    }

    public function broadcasts()
    {
        return $this->hasMany(Broadcast::class, 'auction_id', 'id');
    }
}

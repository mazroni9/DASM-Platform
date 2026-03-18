<?php

namespace App\Models;

use App\Enums\AuctionStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Broadcast extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'is_live',
        'auction_id',
        'stream_url',
        'status',
        'youtube_stream_id',
        'youtube_embed_url',
        'youtube_chat_embed_url',
        'scheduled_start_time',
        'actual_start_time',
        'end_time',
        'created_by',
        'updated_by',
        'current_car_id',
        'moderator_id',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'is_live' => 'boolean',
        'scheduled_start_time' => 'datetime',
        'actual_start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function moderator()
    {
        return $this->belongsTo(User::class, 'moderator_id');
    }

    public function currentCar()
    {
        return $this->belongsTo(Car::class, 'current_car_id');
    }

    /**
     * ✅ Current auction for current car (supports live + active legacy)
     */
    public function currentAuction()
    {
        return $this->hasOneThrough(
            Auction::class,
            Car::class,
            'id',
            'car_id',
            'current_car_id',
            'id'
        )->whereIn('status', AuctionStatus::activeValues());
    }

    /**
     * ✅ Active auction for this broadcast via auction_id
     */
    public function activeAuction()
    {
        return $this->belongsTo(Auction::class, 'auction_id', 'id')
            ->whereIn('status', AuctionStatus::activeValues());
    }

    public function auction()
    {
        return $this->belongsTo(Auction::class, 'auction_id', 'id');
    }

    public function getFormattedEmbedUrlAttribute()
    {
        if (!$this->youtube_embed_url) {
            return null;
        }

        $baseUrl = $this->youtube_embed_url;
        $separator = strpos($baseUrl, '?') !== false ? '&' : '?';

        return $baseUrl . $separator . 'autoplay=1&rel=0&modestbranding=1&enablejsapi=1&origin=' .
            urlencode(config('app.frontend_url'));
    }
}

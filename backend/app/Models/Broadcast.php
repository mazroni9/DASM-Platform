<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Broadcast extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
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

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_live' => 'boolean',
        'scheduled_start_time' => 'datetime',
        'actual_start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    /**
     * Removed venue relationship as YouTube is now the only streaming platform
     */

    /**
     * Get the user who created the broadcast.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the moderator that manages the broadcast.
     */
    public function moderator()
    {
        return $this->belongsTo(User::class, 'moderator_id');
    }



    /**
     * Get the current car being displayed.
     */
    public function currentCar()
    {
        return $this->belongsTo(Car::class, 'current_car_id');
    }

    /**
     * Get the current auction for the displayed car.
     */
    public function currentAuction()
    {
        return $this->hasOneThrough(
            Auction::class,
            Car::class,
            'id', // Foreign key on cars table
            'car_id', // Foreign key on auctions table
            'current_car_id', // Local key on broadcasts table
            'id' // Local key on cars table
        )->where('status', 'active');
    }

    /**
     * Get the active auction associated with this broadcast.
     */
    public function activeAuction()
    {
        return $this->hasOne(Auction::class, 'broadcast_id')
            ->where('status', 'active');
    }

    /*
    public function auction()
    {
        return $this->belongsTo(Auction::class);
    }
*/
       public function auction()
    {
        // assumes broadcasts.auction_id → auctions.id
        return $this->belongsTo(Auction::class, 'auction_id', 'id');
        // If you want a safe empty object when auction is missing:
        // return $this->belongsTo(Auction::class, 'auction_id', 'id')->withDefault();
    }
    /**
     * Get formatted YouTube embed URL with parameters.
     *
     * @return string|null
     */
    public function getFormattedEmbedUrlAttribute()
    {
        if (!$this->youtube_embed_url) {
            return null;
        }

        // Parse URL to add required parameters
        $baseUrl = $this->youtube_embed_url;
        $separator = strpos($baseUrl, '?') !== false ? '&' : '?';
        
        // Add parameters for better embedding experience
        return $baseUrl . $separator . 'autoplay=1&rel=0&modestbranding=1&enablejsapi=1&origin=' . 
               urlencode(config('app.frontend_url'));
    }
}
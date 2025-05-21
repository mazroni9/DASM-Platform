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
        'venue_id',
        'is_live',
        'youtube_stream_id',
        'youtube_embed_url',
        'youtube_chat_embed_url',
        'scheduled_start_time',
        'actual_start_time',
        'end_time',
        'created_by',
        'updated_by',
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
     * Get the venue associated with the broadcast.
     */
    public function venue()
    {
        return $this->belongsTo(Venue::class);
    }

    /**
     * Get the user who created the broadcast.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the active auction associated with this broadcast.
     */
    public function activeAuction()
    {
        return $this->hasOne(Auction::class, 'broadcast_id')
            ->where('status', 'active');
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
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LiveStreamingSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'auction_id', 
        'stream_url', 
        'status', 
        'started_at', 
        'ended_at'
    ];

    // A LiveStreamingSession belongs to an Auction.
    public function auction()
    {
        return $this->belongsTo(Auction::class);
    }
}

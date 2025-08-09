<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bid extends Model
{
    use HasFactory;

    protected $fillable = [
        'auction_id',
        'user_id',
        'bid_amount',
        'no_account',
        'bidder_name'
    ];

    protected $casts = [
        'no_account' => 'boolean',
    ];

    public $timestamps = false;
    // A Bid belongs to an Auction.
    public function auction()
    {
        return $this->belongsTo(Auction::class);
    }

    // A Bid belongs to a User (nullable for no_account bids).
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Get the bidder name (either from user or bidder_name field)
    public function getBidderNameAttribute()
    {
        if ($this->no_account) {
            return $this->bidder_name;
        }
        return $this->user ? $this->user->first_name . ' ' . $this->user->last_name : 'Unknown';
    }
}

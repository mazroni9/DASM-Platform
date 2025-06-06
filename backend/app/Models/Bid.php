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
        'bid_amount'
    ];

    // A Bid belongs to an Auction.
    public function auction()
    {
        return $this->belongsTo(Auction::class);
    }

    // A Bid belongs to a User.
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

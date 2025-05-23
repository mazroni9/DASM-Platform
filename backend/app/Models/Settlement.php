<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Settlement extends Model
{
    use HasFactory;

    protected $fillable = [
        'auction_id', 
        'seller_id', 
        'buyer_id', 
        'car_id', 
        'final_price', 
        'platform_fee', 
        'tam_fee', 
        'net_amount', 
        'status'
    ];

    // A Settlement belongs to an Auction.
    public function auction()
    {
        return $this->belongsTo(Auction::class);
    }

    // A Settlement belongs to a Dealer (seller).
    public function dealer()
    {
        return $this->belongsTo(Dealer::class, 'seller_id');
    }

    // A Settlement belongs to a User (buyer).
    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    // A Settlement belongs to a Car.
    public function car()
    {
        return $this->belongsTo(Car::class);
    }
}

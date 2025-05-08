<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Dealer extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'company_name',
        'commercial_registry',
        'verification_status',
        'rating',
        'description'
    ];

    /**
     * Get the user that owns the dealer.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the cars for the dealer.
     */
    public function cars()
    {
        return $this->hasMany(Car::class);
    }

    /**
     * Get the auctions initiated by the dealer.
     */
    public function auctions()
    {
        return $this->hasMany(Auction::class);
    }
}
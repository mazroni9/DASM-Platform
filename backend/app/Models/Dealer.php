<?php

namespace App\Models;

use App\Enums\DealerStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Dealer extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'company_name',
        'commercial_registry',
        'is_active',
        'status',
        'rating',
        'description'
    ];
    
    protected $casts = [
        'status' => DealerStatus::class,
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
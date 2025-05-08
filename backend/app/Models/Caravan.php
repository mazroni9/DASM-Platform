<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Caravan extends Model
{
    use HasFactory;

    protected $fillable = [
        'dealer_id',
        'make',
        'model',
        'year',
        'title',
        'description',
        'full_description',
        'length',
        'width',
        'height',
        'weight',
        'engine',
        'fuel',
        'transmission',
        'drive',
        'mileage',
        'capacity',
        'features',
        'images',
        'location',
        'condition',
        'evaluation_price',
        'auction_status'
    ];

    protected $casts = [
        'features' => 'array',
        'images' => 'array',
        'length' => 'float',
        'width' => 'float',
        'height' => 'float',
        'weight' => 'float',
        'evaluation_price' => 'float',
    ];

    protected static function boot()
    {
        parent::boot();
        
        // Set default auction_status to 'pending' if not provided
        static::creating(function ($caravan) {
            if (!$caravan->auction_status) {
                $caravan->auction_status = 'pending';
            }
        });
    }

    // A Caravan belongs to a Dealer.
    public function dealer()
    {
        return $this->belongsTo(Dealer::class);
    }

    // A Caravan may have many Auctions.
    public function auctions()
    {
        return $this->hasMany(Auction::class, 'caravan_id');
    }

    // Get active auction
    public function activeAuction()
    {
        return $this->auctions()->whereIn('status', ['scheduled', 'live'])->latest()->first();
    }
} 
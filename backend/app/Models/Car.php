<?php

namespace App\Models;

use App\Models\CarReportImage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Car extends Model
{
    use HasFactory;

    protected $fillable = [
        'dealer_id',
        'user_id',  // Added user_id to fillable
        'make',
        'model',
        'year',
        'vin',
        'odometer',
        'condition',
        'evaluation_price',
        'auction_status',
        'color',
        'engine',
        'transmission',
        'description',
        'registration_card_image',
        'images'
    ];

    protected $casts = [
        'images' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();

        // Set default auction_status to 'pending' if not provided
        static::creating(function ($car) {
            if (!$car->auction_status) {
                $car->auction_status = 'pending';
            }
        });
    }

    // A Car belongs to a Dealer.
    public function dealer()
    {
        return $this->belongsTo(Dealer::class);
    }

    // A Car can also belong directly to a User (for non-dealer users)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // A Car may have many Auctions.
    public function auctions()
    {
        return $this->hasMany(Auction::class);
    }

    // Get the owner of the car (either dealer or user)
    public function getOwnerAttribute()
    {
        return $this->dealer_id ? $this->dealer->user : $this->user;
    }

    public function reportImages()
    {
        return $this->hasMany(CarReportImage::class);
    }
}

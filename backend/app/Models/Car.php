<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Car extends Model
{
    use HasFactory;

    protected $fillable = [
<<<<<<< Updated upstream
        'dealer_id', 
        'user_id',  // Added user_id to fillable
        'make', 
        'model', 
        'year', 
        'vin', 
        'odometer', 
        'condition', 
        'evaluation_price', 
=======
        'dealer_id',
        'user_id',
        'make',
        'model',
        'year',
        'vin',
        'odometer',
        'condition',
        'evaluation_price',
>>>>>>> Stashed changes
        'auction_status',
        'color',
        'engine_size',  // ✅ التصحيح هنا
        'transmission',
        'description',
<<<<<<< Updated upstream
        'images'
=======
        'registration_card_image',
        'images',

        // الحقول الجديدة لدعم الفورم
        'car_type',
        'fuel_type',
        'doors',
        'features',
        'auction_start_price',
        'auction_min_price',
        'auction_max_price',
        'auction_start_date',
        'auction_end_date',
        'city',
>>>>>>> Stashed changes
    ];

    protected $casts = [
        'images' => 'array',
        'features' => 'array',
        'auction_start_date' => 'datetime',
        'auction_end_date' => 'datetime',
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
}

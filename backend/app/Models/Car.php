<?php

namespace App\Models;

use App\Enums\CarCondition;
use App\Enums\AuctionStatus;
use App\Enums\CarTransmission;
use App\Enums\CarsMarketsCategory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;
use App\Models\CarReportImage;
use App\Models\CarAttribute;

class Car extends Model
{
    use HasFactory, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->setDescriptionForEvent(function (string $eventName) {
                switch ($eventName) {
                    case 'created':
                        return "تم إنشاء السيارة رقم {$this->id}";
                    case 'updated':
                        return "تم تحديث السيارة رقم {$this->id}";
                    case 'deleted':
                        return "تم حذف السيارة رقم {$this->id}";
                }
                return "Car {$eventName}";
            })->logFillable()
            ->useLogName('car_log');
    }

    protected $fillable = [
    'dealer_id',
    'user_id',
    'make',
    'model',
    'year',
    'vin',
    'odometer',
    'condition',
    'evaluation_price',
    'auction_status',
    'market_category',
    'color',
    'engine',
    'transmission',
    'description',
    'registration_card_image',
    'images',
    'main_auction_duration',
    'province',
    'city',
    'plate',
    'min_price',
    'max_price',

    // AI Review
    'review_status',
    'review_request_id',
    'review_score',
    'review_details',
    'review_reason',
    'reviewed_at',
];

    protected $casts = [
    'images'          => 'array',
    'market_category' => CarsMarketsCategory::class,
    'condition'       => CarCondition::class,
    'transmission'    => CarTransmission::class,

    // AI Review
    'review_details'  => 'array',
    'reviewed_at'     => 'datetime',
];


    protected $hidden = [
        'min_price',
        'max_price',
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

   public function activeAuction()
{
    return $this->hasOne(Auction::class)->where('status', AuctionStatus::ACTIVE->value);
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

    public function activeAuctionBids()
    {
        return $this->hasManyThrough(Bid::class, Auction::class)
            ->where('auctions.status', AuctionStatus::ACTIVE);
    }

    /**
     * خصائص إضافية للسيارة (car_attributes)
     * JSON key في الـ API هي: car_attributes
     */
    public function carAttributes()
    {
        return $this->hasMany(CarAttribute::class);
    }
}

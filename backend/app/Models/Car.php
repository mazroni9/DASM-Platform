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
        'user_id',
        'make',
        'model',
        'year',
        'vin',
        'odometer',

        // ⚠️ لاحظ: لو condition / transmission في DB فعلاً enum string يبقى تمام
        // لو في DB مخزنين JSON object زي API اللي بعته، يبقى لازم تغير cast بتاعهم ل array (شوف ملاحظة أسفل)
        'condition',
        'evaluation_price',
        'auction_status',
        'market_category',
        'color',
        'engine',
        'transmission',
        'description',
        'registration_card_image',

        // ✅ عندك عمود image (JSON) وهو الأساسي
        'image',

        // ✅ لو عندك عمود images قديم/اختياري، هنسيبه برضه
        'images',

        'main_auction_duration',
        'min_price',
        'max_price',
    ];

    /**
     * ✅ IMPORTANT:
     * - image: JSON => array (هو اللي بيتحول منه images في الـ API)
     * - images: لو موجود كعمود قديم JSON هنخليه array كمان
     *
     * ⚠️ condition/transmission:
     * - لو انت مخزنهم كـ Enum value (string) في DB: سيب enum cast
     * - لو مخزنهم كـ JSON object (ar/en/color/icon) زي الريسبونس: خليهم array بدل enum
     */
    protected $casts = [
        'image'           => 'array',
        'images'          => 'array',

        'market_category' => CarsMarketsCategory::class,

        // ✅ لو DB فيها enum strings:
        'condition'       => CarCondition::class,
        'transmission'    => CarTransmission::class,

        // ✅ لو DB فيها JSON objects بدل enum strings، علّق اللي فوق وافتح اللي تحت:
        // 'condition'    => 'array',
        // 'transmission' => 'array',
    ];

    protected $hidden = [
        'min_price',
        'max_price',
    ];

    /**
     * ✅ هنطلع images + image_url تلقائي في JSON
     * - images: array of urls
     * - image_url: main image url
     */
    protected $appends = [
        'images_list',
        'image_url',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($car) {
            if (!$car->auction_status) {
                $car->auction_status = 'pending';
            }
        });
    }

    // ===========================
    // ✅ Relationships
    // ===========================
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function auctions()
    {
        return $this->hasMany(Auction::class);
    }

    public function activeAuction()
    {
        return $this->hasOne(Auction::class)->where('status', AuctionStatus::ACTIVE);
    }

    public function getOwnerAttribute()
    {
        return $this->user;
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

    public function carAttributes()
    {
        return $this->hasMany(CarAttribute::class);
    }

    // ===========================
    // ✅ Image / Images Accessors
    // ===========================

    /**
     * ✅ images_list: يرجع Array URLs للصور من العمود image (JSON)
     * - يدعم: image = ["url1","url2"]
     * - يدعم: image = "https://..."
     * - يدعم: image = [{url:"..."}, ...]
     * - ولو image فاضي، يحاول يستخدم عمود images القديم لو موجود
     */
    public function getImagesListAttribute(): array
    {
        $val = $this->getAttribute('image');

        // fallback لو image فاضي و images القديم موجود
        if (empty($val)) {
            $old = $this->getAttribute('images');
            $val = $old;
        }

        if (empty($val)) {
            return [];
        }

        // string URL
        if (is_string($val)) {
            return [$val];
        }

        // array
        if (is_array($val)) {
            $out = [];

            foreach ($val as $item) {
                if (is_string($item)) {
                    $out[] = $item;
                    continue;
                }

                if (is_array($item)) {
                    if (!empty($item['url']) && is_string($item['url'])) {
                        $out[] = $item['url'];
                        continue;
                    }
                    if (!empty($item['path']) && is_string($item['path'])) {
                        $out[] = $item['path'];
                        continue;
                    }
                }
            }

            return $out;
        }

        return [];
    }

    /**
     * ✅ image_url: الصورة الرئيسية = أول صورة من images_list
     */
    public function getImageUrlAttribute(): ?string
    {
        return $this->images_list[0] ?? null;
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SubscriptionPlan extends Model
{
    use HasFactory;

    protected $table = 'subscription_plans';

    public const CREATED_AT = 'createdAt';
    public const UPDATED_AT = 'updatedAt';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'userType',
        'price',
        'durationMonths',
        'isActive',
        'orderIndex',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'durationMonths' => 'integer',
        'isActive' => 'boolean',
        'orderIndex' => 'integer',
    ];

    protected $appends = [
        'monthlyPrice',
        'userTypeText',
        'durationText'
    ];

    // Auto-generate slug when creating
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($plan) {
            if (empty($plan->slug)) {
                $plan->slug = Str::slug($plan->name);
            }
        });

        static::updating(function ($plan) {
            if ($plan->isDirty('name') && empty($plan->slug)) {
                $plan->slug = Str::slug($plan->name);
            }
        });
    }

    // Get active plans for specific user type
    public static function getActiveForUserType($userType)
    {
        return self::where('userType', $userType)
            ->where('isActive', true)
            ->orderBy('orderIndex')
            ->orderBy('price')
            ->get();
    }

    // Get monthly price attribute
    public function getMonthlyPriceAttribute()
    {
        return $this->durationMonths > 0 ? round($this->price / $this->durationMonths, 2) : 0;
    }

    // Get user type text in Arabic
    public function getUserTypeTextAttribute()
    {
        $types = [
            'user' => 'مستخدم',
            'dealer' => 'تاجر',
           
        ];

        return $types[$this->userType] ?? $this->userType;
    }

    // Get duration text in Arabic
    public function getDurationTextAttribute()
    {
        if ($this->durationMonths == 1) {
            return 'شهر واحد';
        } elseif ($this->durationMonths == 2) {
            return 'شهرين';
        } elseif ($this->durationMonths <= 10) {
            return $this->durationMonths . ' أشهر';
        } else {
            return $this->durationMonths . ' شهراً';
        }
    }

    // Get available user types
    public static function getUserTypes()
    {
        return [
            'user' => 'مستخدم',
            'dealer' => 'تاجر',

        ];
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('isActive', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('orderIndex')->orderBy('price');
    }
}

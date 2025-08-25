<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommissionTier extends Model
{
    use HasFactory;

    protected $table = 'commission_tiers';

    public const CREATED_AT = 'createdAt';
    public const UPDATED_AT = 'updatedAt';

    protected $fillable = [
        'name',
        'minPrice',
        'maxPrice',
        'commissionAmount',
        'isProgressive',
        'isActive',
    ];

    protected $casts = [
        'minPrice' => 'decimal:2',
        'maxPrice' => 'decimal:2',
        'commissionAmount' => 'decimal:2',
        'isProgressive' => 'boolean',
        'isActive' => 'boolean',
    ];

    public static function getCommissionForPrice($price)
    {
        $tier = self::where('isActive', true)
            ->where('minPrice', '<=', $price)
            ->where(function ($q) use ($price) {
                $q->whereNull('maxPrice')->orWhere('maxPrice', '>=', $price);
            })
            ->orderBy('minPrice', 'desc')
            ->first();

        if (!$tier) {
            return 0;
        }

        if ($tier->isProgressive && $price > 200000) {
            $excess = $price - 200000;
            $hundreds = (int) ceil($excess / 100000);
            return (float) $tier->commissionAmount + ($hundreds * 1000);
        }

        return (float) $tier->commissionAmount;
    }
}



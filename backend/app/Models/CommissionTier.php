<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * CommissionTier
 *
 * ملاحظات مهمة:
 * - نفترض أن commissionAmount = نسبة مئوية (%).
 * - يوجد وضعان للحساب:
 *    1) flat  : اختيار شريحة واحدة تغطي السعر وتطبيق نسبتها على كامل السعر.
 *    2) progressive: حساب مجزّأ على الشرائح (كل جزء من السعر حسب شريحته).
 *
 * - الحقول createdAt/updatedAt بصيغة camelCase في الجدول، لذا نحدد الثوابت CREATED_AT/UPDATED_AT.
 */
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
        'commissionAmount', // نسبة مئوية
        'isProgressive',
        'isActive',
    ];

    // نستخدم float للعمليات الحسابية السليمة (بدل decimal:2 التي ترجع string)
    protected $casts = [
        'minPrice'         => 'float',
        'maxPrice'         => 'float',
        'commissionAmount' => 'float',
        'isProgressive'    => 'boolean',
        'isActive'         => 'boolean',
        // createdAt/updatedAt سيُداران تلقائياً عبر الثوابت أعلاه
    ];

    /* ==============================
       Scopes
    ============================== */

    public function scopeActive($query)
    {
        return $query->where('isActive', true);
    }

    public function scopeForPrice($query, float $price)
    {
        return $query->active()
            ->where('minPrice', '<=', $price)
            ->where(function ($q) use ($price) {
                $q->whereNull('maxPrice')->orWhere('maxPrice', '>=', $price);
            })
            ->orderBy('minPrice', 'desc');
    }

    /* ==============================
       Helpers (حساب العمولة)
    ============================== */

    /**
     * اختَر الشريحة المناسبة للسعر (flat)
     */
    public static function pickTierForPrice(float $price): ?self
    {
        return self::forPrice($price)->first();
    }

    /**
     * حساب عمولة بنمط flat (نسبة الشريحة المختارة على كامل السعر).
     */
    public static function flatCommission(float $price): float
    {
        $tier = self::pickTierForPrice($price);
        if (!$tier) {
            return 0.0;
        }
        return round($price * ($tier->commissionAmount / 100.0), 2);
    }

    /**
     * حساب عمولة بنمط progressive (تجزئة السعر على الشرائح المتعاقبة).
     * مثال: لو الشرائح 0-100k (1%)، 100k-200k (0.8%)، 200k+ (0.5%)
     * سيتم حساب كل جزء بنسبة شريحته ثم الجمع.
     */
    public static function progressiveCommission(float $price): float
    {
        $tiers = self::active()->orderBy('minPrice')->get();
        if ($tiers->isEmpty() || $price <= 0) {
            return 0.0;
        }

        $amount = 0.0;
        foreach ($tiers as $t) {
            $start = (float) $t->minPrice;
            $end   = is_null($t->maxPrice) ? $price : min((float) $t->maxPrice, $price);

            if ($price <= $start) {
                break; // لا مزيد من الأجزاء
            }

            $segment = max(0.0, $end - $start);
            if ($segment > 0) {
                $amount += $segment * ($t->commissionAmount / 100.0);
            }

            if (!is_null($t->maxPrice) && $price <= (float) $t->maxPrice) {
                break;
            }
        }

        return round($amount, 2);
    }

    /**
     * واجهة موحّدة لتقدير العمولة.
     * @param float $price
     * @param string $mode 'flat' | 'progressive'
     */
    public static function estimate(float $price, string $mode = 'flat'): float
    {
        return $mode === 'progressive'
            ? self::progressiveCommission($price)
            : self::flatCommission($price);
    }

    /**
     * (قديمة/متوافقة للخلفية) حساب عمولة لسعر معيّن.
     * كانت سابقاً تحتوي منطقاً ثابتاً، الآن تُحوّل إلى flat القياسي.
     * لاستخدام التجزئة: استعمل estimate($price, 'progressive')
     */
    public static function getCommissionForPrice($price)
    {
        $price = (float) $price;
        return self::estimate($price, 'flat');
    }
}

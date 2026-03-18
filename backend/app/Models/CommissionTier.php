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
        'commissionAmount',
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
     * حساب عمولة بنمط flat (مبلغ ثابت حسب الشريحة المختارة).
     * commissionAmount يمثل مبلغ ثابت بالريال وليس نسبة مئوية.
     */
    public static function flatCommission(float $price): float
    {
        $tier = self::pickTierForPrice($price);
        if (!$tier) {
            return 0.0;
        }
        // commissionAmount هو مبلغ ثابت بالريال وليس نسبة مئوية
        return round($tier->commissionAmount, 2);
    }

    /**
     * حساب عمولة بنمط progressive.
     * بما أن commissionAmount يمثل مبلغ ثابت لكل شريحة (وليس نسبة مئوية)،
     * فإن النتيجة هي نفس طريقة flat.
     */
    public static function progressiveCommission(float $price): float
    {
        // مع المبالغ الثابتة لكل شريحة، النتيجة هي نفس flat
        return self::flatCommission($price);
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

    /**
     * Calculate complete service fees breakdown for DASM Dual-Page Model
     * 
     * Business Decision (2025-12-22): Platform absorbs payment gateway fees.
     * Customer is NOT charged for payment processing fees anymore.
     * 
     * @param float $carPrice The car's auction price
     * @return array{commission: float, vat: float, admin_fee: float, subtotal: float, gateway_fee: float, gateway_vat: float, total: float}
     */
    public static function calculateServiceFees(float $carPrice): array
    {
        // Platform commission from commission tiers
        $commission = self::getCommissionForPrice($carPrice);

        // VAT on commission (15%)
        $commissionVat = round($commission * 0.15, 2);

        // Fixed admin + transfer fee (600 SAR covers Traffic, Tam, Ownership Transfer)
        $adminFee = 600.00;

        // Subtotal before gateway fees
        $subtotal = $commission + $commissionVat + $adminFee;

        // Gateway fees: Platform absorbs these - customer pays 0
        $gatewayFee = 0.00;
        $gatewayFeeVat = 0.00;

        // Total service fees = Commission + VAT + Admin Fee (no gateway fees)
        $total = round($subtotal, 2);

        return [
            'commission' => $commission,
            'vat' => $commissionVat,
            'admin_fee' => $adminFee,
            'subtotal' => $subtotal,
            'gateway_fee' => $gatewayFee,
            'gateway_vat' => $gatewayFeeVat,
            'total' => $total,
        ];
    }
}

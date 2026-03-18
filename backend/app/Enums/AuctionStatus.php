<?php

namespace App\Enums;

enum AuctionStatus: string
{
    case SCHEDULED = 'scheduled';

    // ✅ الموجود عندك في DB/سيستم: live
    case ACTIVE = 'live';

    // ✅ Legacy/Compatibility: بعض أجزاء النظام بتقول active
    case ACTIVE_ALT = 'active';

    case ENDED = 'ended';

    // ✅ موجود عندك
    case CANCELED = 'canceled';

    // ✅ Legacy/Compatibility: cancelled
    case CANCELLED = 'cancelled';

    case FAILED = 'failed';
    case COMPLETED = 'completed';

    public function label(): string
    {
        return match($this) {
            self::SCHEDULED => 'مجدول',
            self::ACTIVE, self::ACTIVE_ALT => 'نشط',
            self::ENDED => 'منتهي',
            self::CANCELED, self::CANCELLED => 'ملغي',
            self::FAILED => 'فاشل',
            self::COMPLETED => 'مكتمل',
        };
    }

    public function englishLabel(): string
    {
        return match($this) {
            self::SCHEDULED => 'Scheduled',
            self::ACTIVE, self::ACTIVE_ALT => 'Live',
            self::ENDED => 'Ended',
            self::CANCELED, self::CANCELLED => 'Canceled',
            self::FAILED => 'Failed',
            self::COMPLETED => 'Completed',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::SCHEDULED => 'blue',
            self::ACTIVE, self::ACTIVE_ALT => 'green',
            self::ENDED => 'gray',
            self::CANCELED, self::CANCELLED => 'red',
            self::FAILED => 'orange',
            self::COMPLETED => 'green',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * ✅ قيم "نشط" المعتمدة في النظام (live + active)
     */
    public static function activeValues(): array
    {
        return [self::ACTIVE->value, self::ACTIVE_ALT->value];
    }

    /**
     * ✅ قيم "ملغي" المعتمدة (canceled + cancelled)
     */
    public static function canceledValues(): array
    {
        return [self::CANCELED->value, self::CANCELLED->value];
    }

    /**
     * ✅ Normalize أي سترينج جاي من أي مكان لقيمة آمنة
     * - بيرجّع قيمة موجودة فعلاً في enum، عشان مايكسرش casting
     */
    public static function normalize(string $status): string
    {
        $s = strtolower(trim($status));

        // normalize cancellation spelling
        if ($s === 'cancelled' || $s === 'canceled') return self::CANCELED->value;

        // normalize active spelling
        if ($s === 'active' || $s === 'live') return self::ACTIVE->value;

        // keep if valid
        if (in_array($s, self::values(), true)) return $s;

        // fallback safe (avoid invalid enum value crash)
        return self::SCHEDULED->value;
    }

    public static function getTranslations(): array
    {
        $translations = [];
        foreach (self::cases() as $status) {
            $translations[$status->value] = [
                'ar' => $status->label(),
                'en' => $status->englishLabel(),
                'color' => $status->color()
            ];
        }
        return $translations;
    }
}

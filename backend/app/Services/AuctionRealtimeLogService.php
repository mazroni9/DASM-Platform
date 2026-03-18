<?php

namespace App\Services;

use App\Jobs\ProcessAuctionActivityLogJob;
use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

/**
 * سجل نشاط المزادات الفوري: مزايدات، تغيير حالة، عرض حسب النوع.
 * يعمل عبر Queue ولا يكتب مباشرة لضمان أداء عالي.
 * يُفعّل من الإعدادات (auction_realtime_log_enabled) ولا يعمل افتراضياً.
 */
class AuctionRealtimeLogService
{
    private const CACHE_KEY_ENABLED = 'auction_realtime_log_enabled';
    private const CACHE_TTL_SECONDS = 60;

    public static function isEnabled(): bool
    {
        $value = Cache::remember(self::CACHE_KEY_ENABLED, self::CACHE_TTL_SECONDS, function () {
            $fromSetting = Setting::getValue('auction_realtime_log_enabled');
            if ($fromSetting !== null) {
                return filter_var($fromSetting, FILTER_VALIDATE_BOOLEAN);
            }
            return config('auction_log.enabled', false);
        });

        return (bool) $value;
    }

    /**
     * تسجيل حدث (يُرسل إلى الـ queue فقط إذا كان التسجيل مفعّلاً).
     *
     * @param  array<string, mixed>  $payload  بيانات إضافية (يُفضّل أن تكون قابلة للتسلسل: أرقام، نصوص، مصفوفات بسيطة)
     */
    public static function log(
        string $eventType,
        ?string $subjectType = null,
        ?int $subjectId = null,
        array $payload = []
    ): void {
        if (! self::isEnabled()) {
            return;
        }

        $maxKb = (int) config('auction_log.max_payload_kb', 64);
        $encoded = json_encode($payload);
        if ($encoded !== false && strlen($encoded) > $maxKb * 1024) {
            $payload = ['_truncated' => true, 'message' => 'Payload too large'];
        }

        ProcessAuctionActivityLogJob::dispatch(
            $eventType,
            $subjectType,
            $subjectId,
            $payload
        );
    }

    /**
     * مسح الكاش عند تغيير إعداد التشغيل (استدعاء من مكان تحديث الإعداد).
     */
    public static function clearEnabledCache(): void
    {
        Cache::forget(self::CACHE_KEY_ENABLED);
    }
}

<?php

/**
 * Real-time Auction Activity Log
 * مراقبة منطق المزادات: مزايدات، تغيير حالة المزاد، عرض حسب النوع.
 * يُفعّل من الإعدادات (auction_realtime_log_enabled) ولا يعمل افتراضياً لتفادي ضغط السيرفر.
 */
return [
    'enabled' => env('AUCTION_REALTIME_LOG_ENABLED', false),
    'queue' => env('AUCTION_LOG_QUEUE', 'auction-log'),
    'channel' => env('AUCTION_LOG_CHANNEL', 'admin.auction-log'),
    'broadcast_event' => 'AuctionActivityLogged',
    'max_payload_kb' => (int) env('AUCTION_LOG_MAX_PAYLOAD_KB', 64),

    /**
     * مدة الاحتفاظ بالسجلات (أيام). بعدها يمكن حذف/أرشفة السجلات عبر Job أو أمر artisan.
     * راجع docs/SCENARIOS_AND_LOGGING_POLICY.md
     */
    'keep_days' => (int) env('AUCTION_LOG_KEEP_DAYS', 30),

    /**
     * إن كان true يُسجّل النشاط فقط للمزادات التجريبية (auctions.is_test = true).
     * يساعد في تقليل حجم السجل في الإنتاج إن رغبت بتفعيل التسجيل للمختبرات فقط.
     */
    'enable_for_test_only' => filter_var(env('AUCTION_LOG_FOR_TEST_ONLY', false), FILTER_VALIDATE_BOOLEAN),
];

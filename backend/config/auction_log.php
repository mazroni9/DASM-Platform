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
    'max_payload_kb' => 64,
];

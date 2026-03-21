<?php

return [
    /*
    |--------------------------------------------------------------------------
    | عناوين مسموح بتشغيل أمر إخفاء سيارات من قائمة المالك
    |--------------------------------------------------------------------------
    |
    | في بيئة production يُرفض الأمر إذا كان البريد الممرَّر عبر --email
    | غير موجود في هذه القائمة (تُبنى من المتغير البيئي).
    | مثال: INVENTORY_OWNER_CLEANUP_EMAILS=demo@example.com,qa@example.com
    |
    */
    'allowed_owner_emails' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('INVENTORY_OWNER_CLEANUP_EMAILS', ''))
    ))),
];

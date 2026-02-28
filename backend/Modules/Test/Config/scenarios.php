<?php

/**
 * تعريف سيناريوهات اختبار المزادات (حمل، توزيع مزايدات).
 * يستخدمها ScenarioRunner لتوليد مزادات تجريبية وضخ bids.
 */
return [
    'scenarios' => [
        'small_load' => [
            'key' => 'small_load',
            'name_ar' => 'حمل هادئ',
            'name_en' => 'Small Load',
            'description' => 'عدد قليل من المزايدين، مزايدات متفرقة على مدى المزاد',
            'default_users' => 5,
            'default_duration_seconds' => 300, // 5 min
            'bid_pattern' => 'random',
            'bids_per_minute_min' => 2,
            'bids_per_minute_max' => 6,
        ],
        'medium_load' => [
            'key' => 'medium_load',
            'name_ar' => 'حمل متوسط',
            'name_en' => 'Medium Load',
            'description' => 'عدد متوسط من المزايدين مع نشاط متواصل',
            'default_users' => 20,
            'default_duration_seconds' => 600,
            'bid_pattern' => 'random',
            'bids_per_minute_min' => 8,
            'bids_per_minute_max' => 20,
        ],
        'peak_load' => [
            'key' => 'peak_load',
            'name_ar' => 'ضغط عالي',
            'name_en' => 'Peak Load',
            'description' => 'عدد كبير من المزايدين مع تركيز في آخر الدقائق',
            'default_users' => 50,
            'default_duration_seconds' => 600,
            'bid_pattern' => 'burst_end',
            'burst_last_seconds' => 60,
            'burst_percentage' => 0.6, // 60% of bids in last minute
            'bids_per_minute_min' => 15,
            'bids_per_minute_max' => 40,
        ],
        'sniper_ending' => [
            'key' => 'sniper_ending',
            'name_ar' => 'سنايبر في آخر الثواني',
            'name_en' => 'Sniper Ending',
            'description' => 'معظم المزايدات في آخر 30–60 ثانية من المزاد',
            'default_users' => 30,
            'default_duration_seconds' => 300,
            'bid_pattern' => 'burst_end',
            'burst_last_seconds' => 30,
            'burst_percentage' => 0.8,
            'bids_per_minute_min' => 20,
            'bids_per_minute_max' => 60,
        ],
        'multi_auction' => [
            'key' => 'multi_auction',
            'name_ar' => 'مزادات متعددة',
            'name_en' => 'Multi Auction',
            'description' => 'مزاد واحد مع عدد كبير من المزايدين (20–50) لمحاكاة ضغط حقيقي',
            'default_users' => 40,
            'default_duration_seconds' => 600,
            'bid_pattern' => 'random',
            'bids_per_minute_min' => 10,
            'bids_per_minute_max' => 30,
        ],

        // ─── اختبارات المنطق (test_suite): تشغيل من نفس pipeline السيناريوهات
        'logic' => [
            'type' => 'test_suite',
            'key' => 'logic',
            'name_ar' => 'منطق المزادات',
            'name_en' => 'Auction Logic',
            'description' => 'تشغيل اختبارات المنطق (الحالات، الأسعار، القواعد)',
            'category' => 'logic',
        ],
        'transitions' => [
            'type' => 'test_suite',
            'key' => 'transitions',
            'name_ar' => 'الانتقال بين الأنواع',
            'name_en' => 'Type Transitions',
            'description' => 'تشغيل اختبارات الانتقال التلقائي بين أنواع المزاد',
            'category' => 'transitions',
        ],
        'price_updates' => [
            'type' => 'test_suite',
            'key' => 'price_updates',
            'name_ar' => 'تحديثات الأسعار',
            'name_en' => 'Price Updates',
            'description' => 'تشغيل اختبارات تحديث السعر والمزايدات اللحظية',
            'category' => 'price_updates',
        ],
        'state_consistency' => [
            'type' => 'test_suite',
            'key' => 'state_consistency',
            'name_ar' => 'استقرار الحالات',
            'name_en' => 'State Consistency',
            'description' => 'تشغيل اختبارات استقرار الحالات وعدم التضارب',
            'category' => 'state_consistency',
        ],
    ],

    'bid_patterns' => [
        'random' => 'عشوائي على مدى الوقت',
        'burst_end' => 'تجمّع في نهاية المزاد',
        'constant' => 'معدل ثابت',
    ],
];

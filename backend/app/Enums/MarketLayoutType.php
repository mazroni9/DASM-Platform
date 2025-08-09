<?php

namespace App\Enums;

enum MarketLayoutType: string
{
    case LiveVideo = 'live_video';
    case GridWithFilters = 'grid_with_filters';
    case ShowcaseCards = 'showcase_cards';
    case Table = 'table';
    case DefaultGrid = 'default_grid';

    public static function labels(): array
    {
        return [
            self::LiveVideo->value => 'بث مباشر',
            self::GridWithFilters->value => 'شبكة مع فلاتر',
            self::ShowcaseCards->value => 'بطاقات عرض',
            self::Table->value => 'جدول',
            self::DefaultGrid->value => 'شبكة افتراضية',
        ];
    }
}

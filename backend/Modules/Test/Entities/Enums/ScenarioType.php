<?php

namespace Modules\Test\Entities\Enums;

enum ScenarioType: string
{
    case SMALL_LOAD = 'small_load';
    case MEDIUM_LOAD = 'medium_load';
    case PEAK_LOAD = 'peak_load';
    case SNIPER_ENDING = 'sniper_ending';
    case MULTI_AUCTION = 'multi_auction';

    public function label(): string
    {
        return match ($this) {
            self::SMALL_LOAD => 'حمل هادئ',
            self::MEDIUM_LOAD => 'حمل متوسط',
            self::PEAK_LOAD => 'ضغط عالي',
            self::SNIPER_ENDING => 'سنايبر في آخر الثواني',
            self::MULTI_AUCTION => 'مزادات متعددة',
        };
    }

    public function englishLabel(): string
    {
        return match ($this) {
            self::SMALL_LOAD => 'Small Load',
            self::MEDIUM_LOAD => 'Medium Load',
            self::PEAK_LOAD => 'Peak Load',
            self::SNIPER_ENDING => 'Sniper Ending',
            self::MULTI_AUCTION => 'Multi Auction',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

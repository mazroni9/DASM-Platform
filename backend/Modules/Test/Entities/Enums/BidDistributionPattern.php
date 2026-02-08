<?php

namespace Modules\Test\Entities\Enums;

enum BidDistributionPattern: string
{
    case RANDOM = 'random';
    case BURST_END = 'burst_end';
    case CONSTANT = 'constant';

    public function label(): string
    {
        return match ($this) {
            self::RANDOM => 'عشوائي',
            self::BURST_END => 'تجمّع في النهاية',
            self::CONSTANT => 'ثابت',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

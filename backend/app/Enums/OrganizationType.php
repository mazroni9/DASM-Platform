<?php

namespace App\Enums;

enum OrganizationType: string
{
    case SHOWROOM = 'showroom';
    case WORKSHOP = 'workshop';
    case PLATFORM = 'platform';
    case INVESTMENT_FUND = 'investment_fund';

    public function label(): string
    {
        return match ($this) {
            self::SHOWROOM => 'معرض',
            self::WORKSHOP => 'ورشة',
            self::PLATFORM => 'المنصة',
            self::INVESTMENT_FUND => 'صندوق استثماري',
        };
    }
}

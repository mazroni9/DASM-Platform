<?php

namespace App\Enums;

enum AuctionType: string
{
    case LIVE = 'live';
    case LIVE_INSTANT = 'live_instant';
    case SILENT_INSTANT = 'silent_instant';
    case FIXED = 'fixed';

    public function getLabel(): string
    {
        return match($this) {
            self::LIVE => 'Live',
            self::LIVE_INSTANT => 'Live Instant Auction',
            self::SILENT_INSTANT => 'Silent Instant Auction',
            self::FIXED => 'Fixed',
        };
    }

    public function labelAr(): string
    {
        return match($this) {
            self::LIVE => 'الحراج المباشر',
            self::LIVE_INSTANT => 'المزاد الفوري المباشر',
            self::SILENT_INSTANT => 'المزاد الفوري الصامت',
            self::FIXED => 'المزاد الثابت',
        };
    }

    public function requiresLivestream(): bool
    {
        return $this === self::LIVE;
    }

    public function allowsAutoExtension(): bool
    {
        return $this === self::LIVE_INSTANT;
    }

    public function allowsAutoAcceptance(): bool
    {
        return $this === self::SILENT_INSTANT;
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function getTranslations(): array
    {
        $translations = [];
        foreach (self::cases() as $t) {
            $translations[$t->value] = [
                'ar' => $t->labelAr(),
                'en' => $t->getLabel(),
            ];
        }
        return $translations;
    }
}

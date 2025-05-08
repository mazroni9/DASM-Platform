<?php

namespace App\Enums;

enum AuctionType: string
{
    case LIVE = 'live';
    case LIVE_INSTANT = 'live_instant';
    case SILENT_INSTANT = 'silent_instant';

    public function label(): string
    {
        return match($this) {
            self::LIVE => 'Live Auction',
            self::LIVE_INSTANT => 'Live Instant Auction',
            self::SILENT_INSTANT => 'Silent Instant Auction',
        };
    }

    public function labelAr(): string
    {
        return match($this) {
            self::LIVE => 'الحراج المباشر',
            self::LIVE_INSTANT => 'المزاد الفوري المباشر',
            self::SILENT_INSTANT => 'المزاد الفوري الصامت',
        };
    }
    
    public function requiresLivestream(): bool
    {
        return match($this) {
            self::LIVE => true,
            default => false,
        };
    }
    
    public function allowsAutoExtension(): bool
    {
        return match($this) {
            self::LIVE_INSTANT => true,
            default => false,
        };
    }
    
    public function allowsAutoAcceptance(): bool
    {
        return match($this) {
            self::SILENT_INSTANT => true,
            default => false,
        };
    }
}
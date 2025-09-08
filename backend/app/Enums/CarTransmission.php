<?php

namespace App\Enums;

enum CarTransmission: string
{
    case AUTOMATIC = 'automatic';
    case MANUAL = 'manual';
    case CVT = 'cvt';

    public function label(): string
    {
        return match ($this) {
            self::AUTOMATIC => 'أوتوماتيك',
            self::MANUAL => 'يدوي',
            self::CVT => 'نصف أوتوماتيك',
        };
    }

    public function englishLabel(): string
    {
        return match ($this) {
            self::AUTOMATIC => 'Automatic',
            self::MANUAL => 'Manual',
            self::CVT => 'CVT',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::AUTOMATIC => '⚙️',
            self::MANUAL => '🔧',
            self::CVT => '⚡',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function getTransmissions(): array
    {
        $transmissions = [];
        foreach (self::cases() as $transmission) {
            $transmissions[$transmission->value] =  $transmission->label();
        }
        return $transmissions;
    }
    public static function getTranslations(): array
    {
        $translations = [];
        foreach (self::cases() as $transmission) {
            $translations[$transmission->value] = [
                'ar' => $transmission->label(),
                'en' => $transmission->englishLabel(),
                'icon' => $transmission->icon()
            ];
        }
        return $translations;
    }
}

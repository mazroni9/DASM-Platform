<?php

namespace App\Enums;

enum CarCondition: string
{
    case EXCELLENT = 'excellent';
    case GOOD = 'good';
    case FAIR = 'fair';
    case POOR = 'poor';

    public function label(): string
    {
        return match ($this) {
            self::EXCELLENT => 'ممتازة',
            self::GOOD => 'جيدة',
            self::FAIR => 'متوسطة',
            self::POOR => 'تحتاج إصلاح',
        };
    }

    public function englishLabel(): string
    {
        return match ($this) {
            self::EXCELLENT => 'Excellent',
            self::GOOD => 'Good',
            self::FAIR => 'Fair',
            self::POOR => 'Poor',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::EXCELLENT => 'green',
            self::GOOD => 'blue',
            self::FAIR => 'yellow',
            self::POOR => 'red',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function getCarConditions(): array
    {
        $translations = [];
        foreach (self::cases() as $condition) {
            $translations[$condition->value] = $condition->label();
        }
        return $translations;
    }

    public static function getTranslations(): array
    {
        $translations = [];
        foreach (self::cases() as $condition) {
            $translations[$condition->value] = [
                'ar' => $condition->label(),
                'en' => $condition->englishLabel(),
                'color' => $condition->color()
            ];
        }
        return $translations;
    }
}

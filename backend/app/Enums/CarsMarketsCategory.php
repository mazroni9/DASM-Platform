<?php

namespace App\Enums;

enum CarsMarketsCategory: string
{
    case LUXURY_CARS   = 'luxuryCars';
    case CLASSIC       = 'classic';
    case CARAVAN       = 'caravan';

    // ✅ فصل بدل busesTrucks:
    case TRUCKS        = 'trucks';
    case BUSES         = 'buses';

    case COMPANIES_CARS = 'companiesCars';
    // ❌ تمت إزالة GOVERNMENT

    public function label(): string
    {
        return match ($this) {
            self::LUXURY_CARS   => 'سوق السيارات الفارهة',
            self::CLASSIC       => 'سوق السيارات الكلاسيكية',
            self::CARAVAN       => 'سوق الكرافانات',
            self::TRUCKS        => 'سوق الشاحنات',
            self::BUSES         => 'سوق الحافلات',
            self::COMPANIES_CARS=> 'سوق سيارات الشركات',
        };
    }

    public function englishLabel(): string
    {
        return match ($this) {
            self::LUXURY_CARS   => 'Luxury Cars',
            self::CLASSIC       => 'Classic Cars',
            self::CARAVAN       => 'Caravans',
            self::TRUCKS        => 'Trucks',
            self::BUSES         => 'Buses',
            self::COMPANIES_CARS=> 'Companies Cars',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function getCategories(): array
    {
        $categories = [];
        foreach (self::cases() as $category) {
            $categories[$category->value] = $category->label();
        }
        return $categories;
    }

    public static function getTranslations(): array
    {
        $translations = [];
        foreach (self::cases() as $carsMarket) {
            $translations[$carsMarket->value] = [
                'ar' => $carsMarket->label(),
                'en' => $carsMarket->englishLabel(),
            ];
        }
        return $translations;
    }
}

<?php

namespace App\Enums;

enum CarsMarketsCategory: string
{
    /*[
    { name: 'سوق السيارات الفارهة',  'luxuryCars'},
    { name: 'سوق السيارات الكلاسيكية',  'classic'},
    { name: 'سوق الكرافانات', slug: 'caravan'},

    { name: 'سوق الشاحنات والحافلات',  'busesTrucks'},
    { name: 'سوق سيارات الشركات',  'companiesCars',},
    { name: 'سوق سيارات الجهات الحكومية',  'government',},
  ];
  */
    case LUXURY_CARS = 'luxuryCars';
    case CLASSIC = 'classic';
    case CARAVAN = 'caravan';
    case BUSES_TRUCKS = 'busesTrucks';
    case COMPANIES_CARS = 'companiesCars';
    case GOVERNMENT = 'government';

    public function label(): string
    {
        return match ($this) {
            self::LUXURY_CARS => 'سوق السيارات الفارهة',
            self::CLASSIC => 'سوق السيارات الكلاسيكية',
            self::CARAVAN => 'سوق الكرافانات',
            self::BUSES_TRUCKS => 'سوق الشاحنات والحافلات',
            self::COMPANIES_CARS => 'سوق سيارات الشركات',
            self::GOVERNMENT => 'سوق سيارات الجهات الحكومية',
        };
    }

    public function englishLabel(): string
    {
        return match ($this) {
            self::LUXURY_CARS => 'Luxury Cars',
            self::CLASSIC => 'Classic Cars',
            self::CARAVAN => 'Caravans',
            self::BUSES_TRUCKS => 'Buses and Trucks',
            self::COMPANIES_CARS => 'Companies Cars',
            self::GOVERNMENT => 'Government Cars',
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

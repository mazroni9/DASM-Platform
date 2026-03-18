<?php

namespace App\Enums;

enum CarsMarketsCategory: string
{
    case LUXURY_CARS   = 'luxuryCars';
    case CLASSIC       = 'classic';
    case CARAVAN       = 'caravan';

    // ✅ الجديد
    case TRUCKS        = 'trucks';
    case BUSES         = 'buses';

    case COMPANIES_CARS = 'companiesCars';

    // ✅ Legacy/Compatibility (كان موجود قبل كده)
    case BUSES_TRUCKS  = 'busesTrucks';

    // ✅ Legacy/Compatibility (كان موجود/مذكور في سيستم)
    case GOVERNMENT    = 'government';

    public function label(): string
    {
        return match ($this) {
            self::LUXURY_CARS   => 'سوق السيارات الفارهة',
            self::CLASSIC       => 'سوق السيارات الكلاسيكية',
            self::CARAVAN       => 'سوق الكرافانات',
            self::TRUCKS        => 'سوق الشاحنات',
            self::BUSES         => 'سوق الحافلات',
            self::COMPANIES_CARS=> 'سوق سيارات الشركات',
            self::BUSES_TRUCKS  => 'سوق الحافلات والشاحنات',
            self::GOVERNMENT    => 'سوق حكومي',
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
            self::BUSES_TRUCKS  => 'Buses & Trucks',
            self::GOVERNMENT    => 'Government',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * ✅ المسموح في الإنشاء (نستبعد government)
     */
    public static function allowedForCreate(): array
    {
        return array_values(array_filter(self::values(), fn($v) => $v !== self::GOVERNMENT->value));
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

    /**
     * ✅ Normalize aliases جاية من API routes
     */
    public static function normalize(string $value): ?string
    {
        $v = strtolower(trim($value));

        // direct match
        foreach (self::cases() as $c) {
            if (strtolower($c->value) === $v) return $c->value;
        }

        $aliases = [
            'luxury' => self::LUXURY_CARS->value,
            'luxurycars' => self::LUXURY_CARS->value,
            'companies' => self::COMPANIES_CARS->value,
            'companiescars' => self::COMPANIES_CARS->value,
            'caravans' => self::CARAVAN->value,
        ];

        return $aliases[$v] ?? null;
    }
}

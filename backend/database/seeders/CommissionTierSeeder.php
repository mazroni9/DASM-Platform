<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CommissionTier;

class CommissionTierSeeder extends Seeder
{
    public function run(): void
    {
        $tiers = [
            ['name' => 'الفئة الأولى', 'minPrice' => 0, 'maxPrice' => 50000, 'commissionAmount' => 350, 'isProgressive' => false, 'isActive' => true],
            ['name' => 'الفئة الثانية', 'minPrice' => 50001, 'maxPrice' => 100000, 'commissionAmount' => 700, 'isProgressive' => false, 'isActive' => true],
            ['name' => 'الفئة الثالثة', 'minPrice' => 100001, 'maxPrice' => 150000, 'commissionAmount' => 1000, 'isProgressive' => false, 'isActive' => true],
            ['name' => 'الفئة الرابعة', 'minPrice' => 150001, 'maxPrice' => 200000, 'commissionAmount' => 1500, 'isProgressive' => false, 'isActive' => true],
            ['name' => 'الفئة الخامسة', 'minPrice' => 200001, 'maxPrice' => null, 'commissionAmount' => 2000, 'isProgressive' => true, 'isActive' => true],
        ];

        foreach ($tiers as $t) {
            CommissionTier::updateOrCreate(
                ['name' => $t['name']],
                $t
            );
        }
    }
}



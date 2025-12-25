<?php

namespace Database\Seeders;

use App\Models\Area;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AreaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        //  الكود  // اسم المنطقة
        // 011   // منطقة الرياض

        // 012 // منطقة مكة المكرمة

        // 013 // المنطقة الشرقية

        // 014 // منطقة تبوك، منطقة المدينة المنورة، منطقة الحدود الشمالية
        // 016 // منطقة القصيم، المجمعة، حائل
        // 017 // منطقة عسير
        $areas = [
            [
                'code' => '011',
                'name' => 'منطقة الرياض',
            ],
            [
                'code' => '012',
                'name' => 'منطقة مكة المكرمة',
            ],
            [
                'code' => '013',
                'name' => 'المنطقة الشرقية',
            ],

            [
                'code' => "014",
                'name' => 'منطقة تبوك',
            ],
            [
                'code' => "014",
                'name' => 'منطقة المدينة المنورة',
            ],
            [
                'code' => "014",
                'name' => 'منطقة الحدود الشمالية',
            ],
            [
                'code' => "016",
                'name' => 'منطقة القصيم',
            ],
            [
                'code' => "016",
                'name' => 'منطقة المجمعة',
            ],
            [
                'code' => "016",
                'name' => 'منطقة حائل',
            ],
            [
                'code' => '017',
                'name' => 'منطقة عسير',
            ],
        ];
        foreach ($areas as $area) {
            Area::updateOrCreate($area);
        }
    }
}

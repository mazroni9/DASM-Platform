<?php

namespace Database\Seeders;

use App\Models\MarketCategory;
use Illuminate\Database\Seeder;

class MarketCouncilCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name_ar' => 'قصص السوق',           'slug' => 'qisas-al-suq',        'sort_order' => 1],
            ['name_ar' => 'علم المزاد',           'slug' => 'ilm-al-muzad',       'sort_order' => 2],
            ['name_ar' => 'أخلاقيات التجارة',     'slug' => 'akhlaqiyat-al-tijara', 'sort_order' => 3],
            ['name_ar' => 'تجارب المستخدمين',     'slug' => 'tajribat-al-mustakhdimin', 'sort_order' => 4],
            ['name_ar' => 'نقاشات',               'slug' => 'munqashaat',         'sort_order' => 5],
        ];

        foreach ($categories as $data) {
            MarketCategory::updateOrCreate(
                ['slug' => $data['slug']],
                [
                    'name_ar'   => $data['name_ar'],
                    'name_en'   => null,
                    'slug'      => $data['slug'],
                    'description' => null,
                    'sort_order' => $data['sort_order'],
                    'is_active'  => true,
                ]
            );
        }
    }
}

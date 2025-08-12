<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            // Bidder Plans
            [
                'id' => 1,
                'name' => 'باقة المزايد الأساسية',
                'description' => 'باقة اشتراك أساسية للمزايدين تتيح المشاركة في المزادات الأساسية',
                'userType' => 'user',
                'price' => 99.00,
                'durationMonths' => 1,
                'isActive' => true,
                'orderIndex' => 1,
            ],
            [
                'id' => 2,
                'name' => 'باقة المزايد المتقدمة',
                'description' => 'باقة متقدمة للمزايدين مع ميزات إضافية وعمولة مخفضة',
                'userType' => 'user',
                'price' => 499.00,
                'durationMonths' => 6,
                'isActive' => true,
                'orderIndex' => 2,
            ],
            [
                'id' => 3,
                'name' => 'باقة المزايد الذهبية',
                'description' => 'باقة سنوية متميزة للمزايدين مع جميع الميزات وأولوية في المزادات',
                'userType' => 'user',
                'price' => 899.00,
                'durationMonths' => 12,
                'isActive' => true,
                'orderIndex' => 3,
            ],

            // Dealer Plans
            [
                'id' => 4,
                'name' => 'باقة التاجر المبتدئ',
                'description' => 'باقة للتجار الجدد تتيح عرض عدد محدود من السيارات',
                'userType' => 'dealer',
                'price' => 299.00,
                'durationMonths' => 1,
                'isActive' => true,
                'orderIndex' => 1,
            ],
            [
                'id' => 5,
                'name' => 'باقة التاجر المحترف',
                'description' => 'باقة متقدمة للتجار مع إمكانية عرض المزيد من السيارات وأدوات تحليل',
                'userType' => 'dealer',
                'price' => 1499.00,
                'durationMonths' => 6,
                'isActive' => true,
                'orderIndex' => 2,
            ],
            [
                'id' => 6,
                'name' => 'باقة التاجر المميز',
                'description' => 'باقة سنوية شاملة للتجار الكبار مع جميع الميزات والدعم المتقدم',
                'userType' => 'dealer',
                'price' => 2499.00,
                'durationMonths' => 12,
                'isActive' => true,
                'orderIndex' => 3,
            ],



        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::updateOrCreate(
                ['id' => $plan['id']],
                $plan
            );
        }
    }
}

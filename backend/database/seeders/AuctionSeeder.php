<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Auction;
use App\Models\Car;
use App\Models\User;
use App\Models\Dealer;
use App\Models\Bid;
use App\Enums\AuctionStatus;
use App\Enums\AuctionType;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AuctionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // تأكد من وجود مستخدمين وتجار وسيارات قبل إنشاء المزادات
        $this->checkPrerequisites();

        // تنظيف البيانات القديمة
        $this->cleanOldData();

        // إضافة بيانات المزادات من جدول Excel محاكي
        $this->seedInstantAuctions();
    }

    /**
     * التأكد من وجود البيانات الأساسية المطلوبة
     */
    private function checkPrerequisites(): void
    {
        // إذا لم يكن هناك مستخدمين، قم بإنشاء مستخدم افتراضي
        if (User::count() === 0) {
            User::create([
                'first_name' => 'مستخدم',
                'last_name' => 'افتراضي',
                'email' => 'user@example.com',
                'phone' => '0500000000',
                'password_hash' => bcrypt('password'),
                'role' => 'buyer',
                'kyc_status' => 'verified'
            ]);

            User::create([
                'first_name' => 'تاجر',
                'last_name' => 'افتراضي',
                'email' => 'dealer@example.com',
                'phone' => '0500000001',
                'password_hash' => bcrypt('password'),
                'role' => 'seller',
                'kyc_status' => 'verified'
            ]);
        }

        // إذا لم يكن هناك تجار، قم بإنشاء تاجر افتراضي
        if (Dealer::count() === 0) {
            $dealerUser = User::where('role', 'seller')->first();
            if ($dealerUser) {
                Dealer::create([
                    'user_id' => $dealerUser->id,
                    'company_name' => 'شركة السيارات الافتراضية',
                    'cr_number' => '123456789',
                    'vat_number' => '987654321',
                    'status' => 'active'
                ]);
            }
        }

        // إذا لم يكن هناك سيارات، قم بإنشاء سيارات افتراضية
        if (Car::count() === 0) {
            $dealer = Dealer::first();
            if ($dealer) {
                // سيارة تويوتا كامري
                Car::create([
                    'dealer_id' => $dealer->id,
                    'make' => 'تويوتا',
                    'model' => 'كامري',
                    'year' => 2023,
                    'vin' => 'ABC-1234',
                    'odometer' => 55000,
                    'condition' => 'excellent',
                    'evaluation_price' => 60000,
                    'auction_status' => 'pending',
                    'color' => 'أبيض',
                    'engine' => 'بنزين',
                    'transmission' => 'أوتوماتيك',
                    'description' => 'تويوتا كامري 2023 بحالة ممتازة',
                    'images' => json_encode(['/showroom.png'])
                ]);

                // سيارة لكزس ES 350
                Car::create([
                    'dealer_id' => $dealer->id,
                    'make' => 'لكزس',
                    'model' => 'ES 350',
                    'year' => 2022,
                    'vin' => 'DEF-5678',
                    'odometer' => 110500,
                    'condition' => 'good',
                    'evaluation_price' => 120000,
                    'auction_status' => 'pending',
                    'color' => 'أسود',
                    'engine' => 'هايبرد',
                    'transmission' => 'أوتوماتيك',
                    'description' => 'لكزس ES 350 موديل 2022 بحالة جيدة جدًا',
                    'images' => json_encode(['/grok auctioneer.jpg'])
                ]);

                // سيارة هيونداي سوناتا
                Car::create([
                    'dealer_id' => $dealer->id,
                    'make' => 'هيونداي',
                    'model' => 'سوناتا',
                    'year' => 2021,
                    'vin' => 'GHI-9101',
                    'odometer' => 80000,
                    'condition' => 'good',
                    'evaluation_price' => 70000,
                    'auction_status' => 'pending',
                    'color' => 'فضي',
                    'engine' => 'بنزين',
                    'transmission' => 'أوتوماتيك',
                    'description' => 'هيونداي سوناتا 2021 بحالة جيدة',
                    'images' => json_encode(['/showroom.png'])
                ]);
            }
        }
    }

    /**
     * تنظيف البيانات القديمة قبل إضافة بيانات جديدة
     */
    private function cleanOldData(): void
    {
        // حذف المزايدات القديمة
        Bid::where('created_at', '<', Carbon::now()->subDays(30))->delete();

        // حذف المزادات القديمة (غير المباعة)
        Auction::where('status', 'ended')
            ->where('created_at', '<', Carbon::now()->subDays(30))
            ->where('current_bid', 0)
            ->delete();
    }

    /**
     * إضافة بيانات المزادات الفورية من جدول Excel محاكي
     */
    private function seedInstantAuctions(): void
    {
        // بيانات Excel التي تم استيرادها
        $excelData = $this->getExcelData();

        foreach ($excelData as $item) {
            $car = Car::where('make', $item['make'])
                ->where('model', $item['model'])
                ->where('year', $item['year'])
                ->first();

            if (!$car) {
                // إذا لم تكن السيارة موجودة، تخطى هذا المزاد
                continue;
            }

            // حساب أوقات المزاد
            $startTime = Carbon::now()->subHours(rand(1, 48));
            $endTime = Carbon::now()->addHours(rand(1, 72));

            // إنشاء المزاد
            $auction = Auction::create([
                'car_id' => $car->id,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'minimum_bid' => $item['opening_bid'],
                'maximum_bid' => $item['opening_bid'] * 1.3, // افتراضي: 130% من سعر الافتتاح
                'current_bid' => $item['current_bid'],
                'reserve_price' => $item['reserve_price'],
                'status' => $item['status'],
                'auction_type' => 'instant',
                'opening_price' => $item['opening_price'],
                'control_room_approved' => true,
                'approved_for_live' => false,
            ]);

            // إذا كان هناك مزايدة حالية، أضف سجلات المزايدات
            if ($item['current_bid'] > 0) {
                $bidCount = $item['bid_count'];
                $user = User::where('role', 'buyer')->first();

                if ($user) {
                    // إضافة المزايدات بشكل متتالي
                    $incrementAmount = ($item['current_bid'] - $item['opening_bid']) / $bidCount;
                    $currentAmount = $item['opening_bid'];

                    for ($i = 0; $i < $bidCount; $i++) {
                        $currentAmount += $incrementAmount;
                        $bidTime = Carbon::now()->subHours(rand(1, 24))->subMinutes(rand(1, 59));

                        Bid::create([
                            'auction_id' => $auction->id,
                            'user_id' => $user->id,
                            'bid_amount' => round($currentAmount, 2),
                            'created_at' => $bidTime
                        ]);
                    }

                    // تحديث آخر وقت مزايدة
                    $auction->last_bid_time = Bid::where('auction_id', $auction->id)
                        ->orderBy('created_at', 'desc')
                        ->first()
                        ->created_at;
                    $auction->save();
                }
            }

            // تحديث حالة السيارة
            $car->auction_status = 'active';
            $car->save();
        }
    }

    /**
     * الحصول على بيانات Excel المحاكية
     */
    private function getExcelData(): array
    {
        return [
            [
                'make' => 'تويوتا',
                'model' => 'كامري',
                'year' => 2023,
                'opening_bid' => 50000,
                'opening_price' => 50000,
                'current_bid' => 55000,
                'reserve_price' => 58824, // تقريبًا 50000 / 0.85
                'status' => AuctionStatus::ACTIVE->value,
                'bid_count' => 12
            ],
            [
                'make' => 'لكزس',
                'model' => 'ES 350',
                'year' => 2022,
                'opening_bid' => 105000,
                'opening_price' => 105000,
                'current_bid' => 110000,
                'reserve_price' => 123530, // تقريبًا 105000 / 0.85
                'status' => AuctionStatus::ACTIVE->value,
                'bid_count' => 8
            ],
            [
                'make' => 'هيونداي',
                'model' => 'سوناتا',
                'year' => 2021,
                'opening_bid' => 60000,
                'opening_price' => 60000,
                'current_bid' => 68500,
                'reserve_price' => 70588, // تقريبًا 60000 / 0.85
                'status' => AuctionStatus::ENDED->value,
                'bid_count' => 15
            ]
        ];
    }
}

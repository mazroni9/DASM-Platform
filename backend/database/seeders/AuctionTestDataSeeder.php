<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Wallet;
use App\Models\AuctionSession;
use App\Models\Car;
use App\Models\Auction;
use App\Enums\AuctionStatus;
use App\Enums\AuctionType;
use App\Enums\CarCondition;
use App\Enums\CarsMarketsCategory;
use App\Enums\CarTransmission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class AuctionTestDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $columnName = Schema::hasColumn('users', 'type') ? 'type' : 'role';

        echo "🔵 Starting Auction Test Data Seeder...\n";

        // =====================================================
        // 1. إنشاء حسابات المستخدمين للاختبار
        // =====================================================

        $users = [];

        // Exhibitor (صاحب معرض)
        $exhibitor = User::firstOrCreate(
            ['email' => 'exhibitor1@test.com'],
            [
                'first_name' => 'أحمد',
                'last_name' => 'المعرض',
                'email' => 'exhibitor1@test.com',
                'phone' => '0501234567',
                'password_hash' => Hash::make('exhibitor123'),
                $columnName => 'venue_owner',
                'email_verified_at' => now(),
                'is_active' => true,
                'status' => 'active',
            ]
        );
        $users['exhibitor'] = $exhibitor;
        echo "✅ Created Exhibitor: {$exhibitor->email}\n";

        // Dealer 1
        $dealer1 = User::firstOrCreate(
            ['email' => 'dealer1@test.com'],
            [
                'first_name' => 'محمد',
                'last_name' => 'التاجر',
                'email' => 'dealer1@test.com',
                'phone' => '0507654321',
                'password_hash' => Hash::make('dealer123'),
                $columnName => 'dealer',
                'email_verified_at' => now(),
                'is_active' => true,
                'status' => 'active',
            ]
        );
        $users['dealer1'] = $dealer1;
        echo "✅ Created Dealer 1: {$dealer1->email}\n";

        // User 1 (مزايد)
        $user1 = User::firstOrCreate(
            ['email' => 'user1@test.com'],
            [
                'first_name' => 'سعد',
                'last_name' => 'المستخدم',
                'email' => 'user1@test.com',
                'phone' => '0501111111',
                'password_hash' => Hash::make('user123'),
                $columnName => 'user',
                'email_verified_at' => now(),
                'is_active' => true,
                'status' => 'active',
            ]
        );
        $users['user1'] = $user1;
        echo "✅ Created User 1: {$user1->email}\n";

        // User 2 (مزايد)
        $user2 = User::firstOrCreate(
            ['email' => 'user2@test.com'],
            [
                'first_name' => 'خالد',
                'last_name' => 'المزايد',
                'email' => 'user2@test.com',
                'phone' => '0502222222',
                'password_hash' => Hash::make('user123'),
                $columnName => 'user',
                'email_verified_at' => now(),
                'is_active' => true,
                'status' => 'active',
            ]
        );
        $users['user2'] = $user2;
        echo "✅ Created User 2: {$user2->email}\n";

        // Moderator
        $moderator = User::firstOrCreate(
            ['email' => 'moderator1@test.com'],
            [
                'first_name' => 'فهد',
                'last_name' => 'المشرف',
                'email' => 'moderator1@test.com',
                'phone' => '0503333333',
                'password_hash' => Hash::make('moderator123'),
                $columnName => 'moderator',
                'email_verified_at' => now(),
                'is_active' => true,
                'status' => 'active',
            ]
        );
        $users['moderator'] = $moderator;
        echo "✅ Created Moderator: {$moderator->email}\n";

        // Admin
        $admin = User::firstOrCreate(
            ['email' => 'admin1@test.com'],
            [
                'first_name' => 'علي',
                'last_name' => 'المدير',
                'email' => 'admin1@test.com',
                'phone' => '0504444444',
                'password_hash' => Hash::make('admin123'),
                $columnName => 'admin',
                'email_verified_at' => now(),
                'is_active' => true,
                'status' => 'active',
            ]
        );
        $users['admin'] = $admin;
        echo "✅ Created Admin: {$admin->email}\n";

        // =====================================================
        // 2. إنشاء المحافظ (Wallets)
        // =====================================================

        // Wallet للمزايدين (Users & Dealers)
        foreach (['user1', 'user2', 'dealer1'] as $key) {
            $user = $users[$key];
            $wallet = Wallet::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'available_balance' => $key === 'dealer1' ? 100000 : ($key === 'user1' ? 50000 : 75000),
                    'funded_balance' => $key === 'dealer1' ? 100000 : ($key === 'user1' ? 50000 : 75000),
                ]
            );
            echo "✅ Created Wallet for {$user->email}: {$wallet->available_balance} SAR\n";
        }

        // =====================================================
        // 3. إنشاء Auction Sessions
        // =====================================================

        $now = Carbon::now();
        $today = $now->copy()->setTime(0, 0);

        // Session 1: Live (16:00-19:00) - اليوم
        $session1 = AuctionSession::firstOrCreate(
            ['name' => 'جلسة المزاد المباشر - اختبار'],
            [
                'user_id' => $exhibitor->id,
                'name' => 'جلسة المزاد المباشر - اختبار',
                'session_date' => $today,
                'status' => 'scheduled',
                'type' => 'live',
                'description' => 'جلسة اختبار للمزاد المباشر من 16:00 إلى 19:00',
            ]
        );
        echo "✅ Created Auction Session 1 (Live): {$session1->id}\n";

        // Session 2: Instant (19:00-22:00) - اليوم
        $session2 = AuctionSession::firstOrCreate(
            ['name' => 'جلسة المزاد الفوري - اختبار'],
            [
                'user_id' => $exhibitor->id,
                'name' => 'جلسة المزاد الفوري - اختبار',
                'session_date' => $today,
                'status' => 'scheduled',
                'type' => 'instant',
                'description' => 'جلسة اختبار للمزاد الفوري من 19:00 إلى 22:00',
            ]
        );
        echo "✅ Created Auction Session 2 (Instant): {$session2->id}\n";

        // Session 3: Silent (22:00-16:00) - اليوم
        $session3 = AuctionSession::firstOrCreate(
            ['name' => 'جلسة السوق المتأخر - اختبار'],
            [
                'user_id' => $exhibitor->id,
                'name' => 'جلسة السوق المتأخر - اختبار',
                'session_date' => $today,
                'status' => 'scheduled',
                'type' => 'silent',
                'description' => 'جلسة اختبار للسوق المتأخر من 22:00 إلى 16:00',
            ]
        );
        echo "✅ Created Auction Session 3 (Silent): {$session3->id}\n";

        // =====================================================
        // 4. إنشاء سيارات للاختبار (اختياري - يمكن إنشاؤها من الفرونت)
        // =====================================================

        echo "\n📝 Note: السيارات يمكن إنشاؤها من الفرونت إند (/exhibitor/add-car)\n";
        echo "   أو يمكن إضافتها هنا إذا لزم الأمر.\n\n";

        echo "✅ Auction Test Data Seeder completed!\n";
        echo "\n📋 Summary:\n";
        echo "   - Exhibitor: exhibitor1@test.com / exhibitor123\n";
        echo "   - Dealer 1: dealer1@test.com / dealer123\n";
        echo "   - User 1: user1@test.com / user123 (Balance: 50,000 SAR)\n";
        echo "   - User 2: user2@test.com / user123 (Balance: 75,000 SAR)\n";
        echo "   - Moderator: moderator1@test.com / moderator123\n";
        echo "   - Admin: admin1@test.com / admin123\n";
        echo "   - Auction Sessions: 3 sessions created\n\n";
    }
}

<?php

namespace Modules\Test\Services\Tests;

use App\Enums\AuctionStatus;
use App\Models\Auction;
use Modules\Test\Entities\AuctionTestResult;
use Modules\Test\Entities\Enums\TestStatus;
use Modules\Test\Services\Contracts\TestServiceInterface;
use Modules\Test\Services\Traits\TestResultTrait;
use Illuminate\Support\Facades\DB;

class LogicTestService implements TestServiceInterface
{
    use TestResultTrait;

    public function run(): AuctionTestResult
    {
        $startTime = microtime(true);
        $testName = 'اختبارات منطق المزادات';
        $category = 'logic';
        $errors = [];
        $details = [];

        try {
            DB::beginTransaction();

            $activeAuctions = Auction::whereIn('status', AuctionStatus::activeValues())->get();
            $details['active_auctions_count'] = $activeAuctions->count();

            foreach ($activeAuctions as $auction) {
                if (!$auction->isActive()) {
                    $errors[] = "المزاد رقم {$auction->id}: محدد كنشط لكن isActive() يرجع false";
                }

                if ($auction->current_bid < 0) {
                    $errors[] = "المزاد رقم {$auction->id}: يحتوي على سعر مزايدة سالب: {$auction->current_bid}";
                }

                if ($auction->minimum_bid && $auction->current_bid < $auction->minimum_bid) {
                    $errors[] = "المزاد رقم {$auction->id}: السعر الحالي ({$auction->current_bid}) أقل من الحد الأدنى ({$auction->minimum_bid})";
                }

                if ($auction->maximum_bid && $auction->current_bid > $auction->maximum_bid) {
                    $errors[] = "المزاد رقم {$auction->id}: السعر الحالي ({$auction->current_bid}) يتجاوز الحد الأقصى ({$auction->maximum_bid})";
                }

                if ($auction->end_time && $auction->start_time && $auction->end_time <= $auction->start_time) {
                    $errors[] = "المزاد رقم {$auction->id}: يحتوي على نطاق زمني غير صحيح";
                }
            }

            $scheduledAuctions = Auction::where('status', AuctionStatus::SCHEDULED->value)->get();
            $details['scheduled_auctions_count'] = $scheduledAuctions->count();

            foreach ($scheduledAuctions as $auction) {
                if (!$auction->control_room_approved && $auction->status === AuctionStatus::ACTIVE->value) {
                    $errors[] = "المزاد رقم {$auction->id}: نشط لكن غير معتمد من غرفة التحكم";
                }
            }

            DB::rollBack();

            $executionTime = (microtime(true) - $startTime) * 1000;
            $status = empty($errors) ? TestStatus::PASSED : TestStatus::FAILED;
            $message = empty($errors)
                ? "نجحت جميع اختبارات منطق المزادات. تم فحص {$activeAuctions->count()} مزاد نشط و {$scheduledAuctions->count()} مزاد مجدول."
                : "تم العثور على " . count($errors) . " أخطاء في منطق المزادات.";

            return $this->saveTestResult($testName, $category, $status, $message, $details, $errors, $executionTime);

        } catch (\Throwable $e) {
            DB::rollBack();
            $executionTime = (microtime(true) - $startTime) * 1000;
            $errors[] = "خطأ في التنفيذ: " . $e->getMessage();

            return $this->saveTestResult($testName, $category, TestStatus::FAILED, "فشل تنفيذ الاختبار: " . $e->getMessage(), $details, $errors, $executionTime);
        }
    }
}

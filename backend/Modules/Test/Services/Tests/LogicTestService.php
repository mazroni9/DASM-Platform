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
        $cases = [];

        try {
            DB::beginTransaction();

            /** @var Auction $auction */
            $activeAuctions = Auction::whereIn('status', AuctionStatus::activeValues())->get();
            $details['active_auctions_count'] = $activeAuctions->count();

            $isActiveErrors = [];
            $negativeBidErrors = [];
            $minBidErrors = [];
            $maxBidErrors = [];
            $timeRangeErrors = [];
            $controlRoomErrors = [];

            foreach ($activeAuctions as $auction) {
                if (!$auction->isActive()) {
                    $isActiveErrors[] = "المزاد {$auction->id}: محدد كنشط لكن isActive() false";
                }
                if ((float)($auction->current_bid ?? 0) < 0) {
                    $negativeBidErrors[] = "المزاد {$auction->id}: سعر مزايدة سالب";
                }
                if ($auction->minimum_bid !== null && (float)($auction->current_bid ?? 0) < (float)$auction->minimum_bid) {
                    $minBidErrors[] = "المزاد {$auction->id}: السعر الحالي أقل من الحد الأدنى";
                }
                if ($auction->maximum_bid !== null && (float)($auction->current_bid ?? 0) > (float)$auction->maximum_bid) {
                    $maxBidErrors[] = "المزاد {$auction->id}: السعر الحالي يتجاوز الحد الأقصى";
                }
                if ($auction->end_time && $auction->start_time && $auction->end_time <= $auction->start_time) {
                    $timeRangeErrors[] = "المزاد {$auction->id}: نطاق زمني غير صحيح";
                }
                if (!$auction->control_room_approved) {
                    $controlRoomErrors[] = "المزاد {$auction->id}: نشط لكن غير معتمد من غرفة التحكم";
                }
            }

            foreach (array_merge($isActiveErrors, $negativeBidErrors, $minBidErrors, $maxBidErrors, $timeRangeErrors, $controlRoomErrors) as $e) {
                $errors[] = $e;
            }

            $cases[] = ['id' => 'Active_IsActive', 'name' => 'المزادات النشطة ترجع isActive() true', 'passed' => empty($isActiveErrors), 'message' => empty($isActiveErrors) ? 'جميع المزادات النشطة متسقة' : implode('; ', array_slice($isActiveErrors, 0, 2))];
            $cases[] = ['id' => 'CurrentBid_NotNegative', 'name' => 'السعر الحالي غير سالب', 'passed' => empty($negativeBidErrors), 'message' => empty($negativeBidErrors) ? 'لا أسعار سالبة' : implode('; ', array_slice($negativeBidErrors, 0, 2))];
            $cases[] = ['id' => 'CurrentBid_AboveMinimum', 'name' => 'السعر الحالي ≥ الحد الأدنى', 'passed' => empty($minBidErrors), 'message' => empty($minBidErrors) ? 'متسق مع minimum_bid' : implode('; ', array_slice($minBidErrors, 0, 2))];
            $cases[] = ['id' => 'CurrentBid_BelowMaximum', 'name' => 'السعر الحالي ≤ الحد الأقصى', 'passed' => empty($maxBidErrors), 'message' => empty($maxBidErrors) ? 'متسق مع maximum_bid' : implode('; ', array_slice($maxBidErrors, 0, 2))];
            $cases[] = ['id' => 'TimeRange_Valid', 'name' => 'نطاق زمني صحيح (end > start)', 'passed' => empty($timeRangeErrors), 'message' => empty($timeRangeErrors) ? 'النطاق الزمني صحيح' : implode('; ', array_slice($timeRangeErrors, 0, 2))];
            $cases[] = ['id' => 'Active_ControlRoomApproved', 'name' => 'المزادات النشطة معتمدة من غرفة التحكم', 'passed' => empty($controlRoomErrors), 'message' => empty($controlRoomErrors) ? 'جميع النشطة معتمدة' : implode('; ', array_slice($controlRoomErrors, 0, 2))];

            $scheduledAuctions = Auction::where('status', AuctionStatus::SCHEDULED->value)->get();
            $details['scheduled_auctions_count'] = $scheduledAuctions->count();
            $details['cases'] = $cases;
            $details['cases_passed'] = count(array_filter($cases, fn($c) => $c['passed']));
            $details['cases_total'] = count($cases);

            DB::rollBack();

            $executionTime = (microtime(true) - $startTime) * 1000;
            $status = empty($errors) ? TestStatus::PASSED : TestStatus::FAILED;
            $message = empty($errors)
                ? "نجحت اختبارات المنطق (" . $details['cases_passed'] . "/" . count($cases) . " cases)."
                : "فشل " . count($errors) . " من أصل " . count($cases) . " cases.";

            return $this->saveTestResult($testName, $category, $status, $message, $details, $errors, $executionTime);

        } catch (\Throwable $e) {
            DB::rollBack();
            $executionTime = (microtime(true) - $startTime) * 1000;
            $errors[] = "خطأ في التنفيذ: " . $e->getMessage();
            $details['cases'] = $cases;
            $details['cases_passed'] = count(array_filter($cases, fn($c) => $c['passed'] ?? false));
            $details['cases_total'] = count($cases);

            return $this->saveTestResult($testName, $category, TestStatus::FAILED, "فشل تنفيذ الاختبار: " . $e->getMessage(), $details, $errors, $executionTime);
        }
    }
}

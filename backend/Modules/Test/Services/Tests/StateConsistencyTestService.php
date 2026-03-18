<?php

namespace Modules\Test\Services\Tests;

use App\Enums\AuctionStatus;
use App\Enums\AuctionType;
use App\Models\Auction;
use Modules\Test\Entities\AuctionTestResult;
use Modules\Test\Entities\Enums\TestStatus;
use Modules\Test\Services\Contracts\TestServiceInterface;
use Modules\Test\Services\Traits\TestResultTrait;
use Illuminate\Support\Facades\DB;

/**
 * مصفوفة اختبارات استقرار الحالة — المرجع: docs/AUCTION_PRICE_AND_STATE_STABILITY_MATRIX.md
 */
class StateConsistencyTestService implements TestServiceInterface
{
    use TestResultTrait;

    public function run(): AuctionTestResult
    {
        $startTime = microtime(true);
        $testName = 'اختبارات استقرار الحالات';
        $category = 'state_consistency';
        $errors = [];
        $details = [];
        $cases = [];

        try {
            DB::beginTransaction();

            $allAuctions = Auction::with('car')->get();
            $details['total_auctions'] = $allAuctions->count();

            $activeIsActiveErrors = [];
            $activeCarInAuctionErrors = [];
            $endedCarSoldErrors = [];
            $failedCarAvailableErrors = [];
            $liveApprovedErrors = [];
            $effectiveEndErrors = [];

            /** @var Auction $auction */
            foreach ($allAuctions as $auction) {
                $statusValue = $auction->statusValue();

                if (in_array($statusValue, AuctionStatus::activeValues(), true) && !$auction->isActive()) {
                    $activeIsActiveErrors[] = "المزاد {$auction->id}: الحالة نشطة لكن isActive() false";
                }

                if ($auction->car) {
                    if (in_array($statusValue, AuctionStatus::activeValues(), true) && $auction->car->auction_status !== 'in_auction') {
                        $activeCarInAuctionErrors[] = "المزاد {$auction->id}: نشط لكن حالة السيارة '{$auction->car->auction_status}'";
                    }

                    if ($statusValue === AuctionStatus::ENDED->value) {
                        $reserveMet = (float)($auction->reserve_price ?? 0) > 0
                            ? (float)($auction->current_bid ?? 0) >= (float)$auction->reserve_price
                            : false;
                        if ($reserveMet && $auction->car->auction_status !== 'sold') {
                            $endedCarSoldErrors[] = "المزاد {$auction->id}: منتهٍ ببلوغ الاحتياطي لكن السيارة ليست sold";
                        }
                    }

                    if ($statusValue === AuctionStatus::FAILED->value && $auction->car->auction_status !== 'available') {
                        $failedCarAvailableErrors[] = "المزاد {$auction->id}: فاشل لكن حالة السيارة '{$auction->car->auction_status}'";
                    }
                }

                $typeValue = $auction->auction_type instanceof AuctionType ? $auction->auction_type->value : (string)$auction->auction_type;
                if ($typeValue === AuctionType::LIVE->value && !$auction->approved_for_live) {
                    $liveApprovedErrors[] = "المزاد {$auction->id}: النوع LIVE لكن غير معتمد للبث المباشر";
                }

                if ($auction->end_time && $auction->start_time) {
                    $effectiveEnd = $auction->getEffectiveEndTime();
                    if ($effectiveEnd && $effectiveEnd->lt($auction->start_time)) {
                        $effectiveEndErrors[] = "المزاد {$auction->id}: وقت الانتهاء الفعلي قبل وقت البداية";
                    }
                }
            }

            foreach (array_merge(
                $activeIsActiveErrors,
                $activeCarInAuctionErrors,
                $endedCarSoldErrors,
                $failedCarAvailableErrors,
                $liveApprovedErrors,
                $effectiveEndErrors
            ) as $e) {
                $errors[] = $e;
            }

            $cases[] = [
                'id'     => 'Active_IsActive',
                'name'   => 'المزاد النشط يرجع isActive() = true',
                'passed' => empty($activeIsActiveErrors),
                'message' => empty($activeIsActiveErrors) ? 'جميع المزادات النشطة تمر isActive()' : implode('; ', array_slice($activeIsActiveErrors, 0, 2)),
            ];
            $cases[] = [
                'id'     => 'Active_CarInAuction',
                'name'   => 'مزاد نشط → السيارة in_auction',
                'passed' => empty($activeCarInAuctionErrors),
                'message' => empty($activeCarInAuctionErrors) ? 'تناسق حالة السيارة مع المزاد النشط' : implode('; ', array_slice($activeCarInAuctionErrors, 0, 2)),
            ];
            $cases[] = [
                'id'     => 'Ended_ReserveMet_CarSold',
                'name'   => 'مزاد منتهٍ (بلوغ الاحتياطي) → السيارة sold',
                'passed' => empty($endedCarSoldErrors),
                'message' => empty($endedCarSoldErrors) ? 'السيارات المباعة متسقة مع المزادات المنتهية' : implode('; ', array_slice($endedCarSoldErrors, 0, 2)),
            ];
            $cases[] = [
                'id'     => 'Failed_CarAvailable',
                'name'   => 'مزاد فاشل → السيارة available',
                'passed' => empty($failedCarAvailableErrors),
                'message' => empty($failedCarAvailableErrors) ? 'السيارات متاحة بعد فشل المزاد' : implode('; ', array_slice($failedCarAvailableErrors, 0, 2)),
            ];
            $cases[] = [
                'id'     => 'Live_ApprovedForLive',
                'name'   => 'نوع LIVE ⇒ approved_for_live',
                'passed' => empty($liveApprovedErrors),
                'message' => empty($liveApprovedErrors) ? 'جميع مزادات LIVE معتمدة للبث' : implode('; ', array_slice($liveApprovedErrors, 0, 2)),
            ];
            $cases[] = [
                'id'     => 'EffectiveEnd_AfterStart',
                'name'   => 'وقت الانتهاء الفعلي ≥ وقت البداية',
                'passed' => empty($effectiveEndErrors),
                'message' => empty($effectiveEndErrors) ? 'النطاق الزمني صحيح لجميع المزادات' : implode('; ', array_slice($effectiveEndErrors, 0, 2)),
            ];

            $details['cases'] = $cases;
            $passedCount = count(array_filter($cases, fn($c) => $c['passed']));
            $details['cases_passed'] = $passedCount;
            $details['cases_total'] = count($cases);

            DB::rollBack();

            $executionTime = (microtime(true) - $startTime) * 1000;
            $status = empty($errors) ? TestStatus::PASSED : TestStatus::FAILED;
            $message = empty($errors)
                ? "نجحت اختبارات استقرار الحالة ({$passedCount}/" . count($cases) . " cases)."
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

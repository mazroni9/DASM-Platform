<?php

namespace Modules\Test\Services\Tests;

use App\Enums\AuctionStatus;
use App\Enums\AuctionType;
use App\Models\Auction;
use Modules\Test\Entities\AuctionTestResult;
use Modules\Test\Entities\Enums\TestStatus;
use Modules\Test\Services\Contracts\TestServiceInterface;
use Modules\Test\Services\Traits\TestResultTrait;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class TransitionsTestService implements TestServiceInterface
{
    use TestResultTrait;

    /**
     * مصفوفة حالات الانتقال — كل case له id و name ونتيجة (passed, message).
     * المرجع: docs/AUCTION_TRANSITION_TEST_MATRIX.md
     */
    public function run(): AuctionTestResult
    {
        $startTime = microtime(true);
        $testName = 'اختبارات الانتقال بين الأنواع';
        $category = 'transitions';
        $errors = [];
        $details = [];
        $cases = [];

        try {
            DB::beginTransaction();

            $now = Carbon::now();
            $hour = (int) $now->format('H');
            $details['current_hour'] = $hour;
            $details['expected_period'] = $this->getExpectedPeriod($hour);

            $activeAuctions = Auction::whereIn('status', AuctionStatus::activeValues())
                ->where('approved_for_live', true)
                ->get();

            $details['active_auctions_count'] = $activeAuctions->count();

            $typeErrors = [];
            $liveToInstantOk = true;
            $liveInstantToSilentOk = true;

            /** @var Auction $auction */
            foreach ($activeAuctions as $auction) {
                $previousType = $auction->auction_type;
                $auction->updateAuctionTypeBasedOnTime();
                $auction->refresh();
                $newType = $auction->auction_type;
                $expectedType = $this->getExpectedType($hour, $auction->approved_for_live);

                if ($newType !== $expectedType) {
                    $typeErrors[] = "المزاد {$auction->id}: متوقع {$expectedType->value}، فعلي {$newType->value}";
                }

                if ($previousType === AuctionType::LIVE && $newType === AuctionType::LIVE_INSTANT) {
                    $hasBids = (float)($auction->current_bid ?? 0) > 0;
                    if ($hasBids && (!$auction->opening_price || (float)$auction->opening_price <= 0)) {
                        $liveToInstantOk = false;
                    }
                }
                if ($previousType === AuctionType::LIVE_INSTANT && $newType === AuctionType::SILENT_INSTANT) {
                    $hasBids = (float)($auction->current_bid ?? 0) > 0;
                    if ($hasBids && (!$auction->opening_price || (float)$auction->opening_price <= 0)) {
                        $liveInstantToSilentOk = false;
                    }
                }
            }

            foreach ($typeErrors as $e) {
                $errors[] = $e;
            }
            if (!$liveToInstantOk) {
                $errors[] = "انتقال LIVE→LIVE_INSTANT: opening_price غير محدد رغم وجود مزايدات";
            }
            if (!$liveInstantToSilentOk) {
                $errors[] = "انتقال LIVE_INSTANT→SILENT_INSTANT: opening_price غير محدد رغم وجود مزايدات";
            }

            // Case: النوع حسب الساعة
            $expectedType = $this->getExpectedType($hour, true);
            $typeCasePassed = empty($typeErrors);
            $cases[] = [
                'id'     => 'Type_By_Hour',
                'name'   => "نوع المزاد حسب الساعة (متوقع: {$expectedType->value})",
                'passed' => $typeCasePassed,
                'message' => $typeCasePassed ? "جميع المزادات النشطة من نوع {$expectedType->value} في الساعة {$hour}" : implode('; ', array_slice($typeErrors, 0, 3)),
            ];

            $cases[] = [
                'id'     => 'Type_LIVE_to_LIVE_INSTANT_preserves_opening_price',
                'name'   => 'LIVE→LIVE_INSTANT يحافظ على opening_price',
                'passed' => $liveToInstantOk,
                'message' => $liveToInstantOk ? 'opening_price محدد بعد الانتقال' : 'opening_price غير محدد لبعض المزادات بعد الانتقال',
            ];

            $cases[] = [
                'id'     => 'Type_LIVE_INSTANT_to_SILENT_preserves_opening_price',
                'name'   => 'LIVE_INSTANT→SILENT_INSTANT يحافظ على opening_price',
                'passed' => $liveInstantToSilentOk,
                'message' => $liveInstantToSilentOk ? 'opening_price محدد بعد الانتقال' : 'opening_price غير محدد لبعض المزادات بعد الانتقال',
            ];

            // —— Status_Scheduled_to_Live ———
            $scheduledToActivate = Auction::where('status', AuctionStatus::SCHEDULED->value)
                ->where('control_room_approved', true)
                ->whereNotNull('start_time')
                ->where('start_time', '<=', $now)
                ->get();

            if ($scheduledToActivate->isEmpty()) {
                $cases[] = [
                    'id'     => 'Status_Scheduled_to_Live',
                    'name'   => 'Scheduled→Live (عند وصول وقت البداية)',
                    'passed' => true,
                    'message' => 'لا يوجد مزاد مجدول جاهز للتفعيل (تخطي)',
                ];
            } else {
                $allBecameActive = true;
                $statusMsg = '';
                /** @var Auction $a */
                foreach ($scheduledToActivate as $a) {
                    $a->updateStatusBasedOnTime();
                    $a->refresh();
                    if (!$a->isActive()) {
                        $allBecameActive = false;
                        $statusMsg = "المزاد {$a->id} لم ينتقل إلى نشط";
                        $errors[] = $statusMsg;
                        break;
                    }
                }
                $cases[] = [
                    'id'     => 'Status_Scheduled_to_Live',
                    'name'   => 'Scheduled→Live (عند وصول وقت البداية)',
                    'passed' => $allBecameActive,
                    'message' => $allBecameActive ? 'جميع المزادات المجدولة الجاهزة انتقلت إلى نشط' : $statusMsg,
                ];
            }

            $details['cases'] = $cases;
            $passedCount = count(array_filter($cases, fn($c) => $c['passed']));
            $details['cases_passed'] = $passedCount;
            $details['cases_total'] = count($cases);

            DB::rollBack();

            $executionTime = (microtime(true) - $startTime) * 1000;
            $status = empty($errors) ? TestStatus::PASSED : TestStatus::FAILED;
            $message = empty($errors)
                ? "نجحت اختبارات الانتقال ({$passedCount}/" . count($cases) . " cases)."
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

    private function getExpectedPeriod(int $hour): string
    {
        if ($hour >= 16 && $hour < 19) {
            return 'LIVE (16-19)';
        } elseif ($hour >= 19 && $hour < 22) {
            return 'LIVE_INSTANT (19-22)';
        } else {
            return 'SILENT_INSTANT (22-16)';
        }
    }

    private function getExpectedType(int $hour, bool $approvedForLive): AuctionType
    {
        if ($hour >= 16 && $hour < 19 && $approvedForLive) {
            return AuctionType::LIVE;
        } elseif ($hour >= 19 && $hour < 22) {
            return AuctionType::LIVE_INSTANT;
        } else {
            return AuctionType::SILENT_INSTANT;
        }
    }
}

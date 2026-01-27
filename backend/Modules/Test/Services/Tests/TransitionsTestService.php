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

    public function run(): AuctionTestResult
    {
        $startTime = microtime(true);
        $testName = 'اختبارات الانتقال بين الأنواع';
        $category = 'transitions';
        $errors = [];
        $details = [];

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

            foreach ($activeAuctions as $auction) {
                $previousType = $auction->auction_type;
                $auction->updateAuctionTypeBasedOnTime();
                $auction->refresh();
                $newType = $auction->auction_type;

                $expectedType = $this->getExpectedType($hour, $auction->approved_for_live);

                if ($newType !== $expectedType) {
                    $errors[] = "المزاد رقم {$auction->id}: متوقع النوع {$expectedType->value}، تم الحصول على {$newType->value} في الساعة {$hour}";
                }

                if ($previousType === AuctionType::LIVE && $newType === AuctionType::LIVE_INSTANT) {
                    if ($auction->current_bid > 0 && !$auction->opening_price) {
                        $errors[] = "المزاد رقم {$auction->id}: تم الانتقال من LIVE إلى LIVE_INSTANT لكن opening_price غير محدد";
                    }
                }

                if ($previousType === AuctionType::LIVE_INSTANT && $newType === AuctionType::SILENT_INSTANT) {
                    if ($auction->current_bid > 0 && !$auction->opening_price) {
                        $errors[] = "المزاد رقم {$auction->id}: تم الانتقال من LIVE_INSTANT إلى SILENT_INSTANT لكن opening_price غير محدد";
                    }
                }
            }

            DB::rollBack();

            $executionTime = (microtime(true) - $startTime) * 1000;
            $status = empty($errors) ? TestStatus::PASSED : TestStatus::FAILED;
            $message = empty($errors)
                ? "نجحت جميع اختبارات الانتقال بين الأنواع. تم فحص {$activeAuctions->count()} مزاد نشط."
                : "تم العثور على " . count($errors) . " أخطاء في الانتقال.";

            return $this->saveTestResult($testName, $category, $status, $message, $details, $errors, $executionTime);

        } catch (\Throwable $e) {
            DB::rollBack();
            $executionTime = (microtime(true) - $startTime) * 1000;
            $errors[] = "خطأ في التنفيذ: " . $e->getMessage();

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

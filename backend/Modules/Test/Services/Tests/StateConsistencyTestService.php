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

        try {
            DB::beginTransaction();

            $allAuctions = Auction::with('car')->get();
            $details['total_auctions'] = $allAuctions->count();

            foreach ($allAuctions as $auction) {
                if ($auction->status === AuctionStatus::ACTIVE->value && !$auction->isActive()) {
                    $errors[] = "المزاد رقم {$auction->id}: الحالة ACTIVE لكن isActive() يرجع false";
                }

                if ($auction->car) {
                    if ($auction->status === AuctionStatus::ACTIVE->value && $auction->car->auction_status !== 'in_auction') {
                        $errors[] = "المزاد رقم {$auction->id}: الحالة ACTIVE لكن حالة السيارة '{$auction->car->auction_status}'";
                    }

                    if ($auction->status === AuctionStatus::ENDED->value) {
                        if ((float)$auction->current_bid >= (float)$auction->reserve_price) {
                            if ($auction->car->auction_status !== 'sold') {
                                $errors[] = "المزاد رقم {$auction->id}: انتهى مع مزايدة >= السعر الاحتياطي لكن حالة السيارة '{$auction->car->auction_status}'";
                            }
                        } else {
                            if ($auction->car->auction_status !== 'available' && $auction->status === AuctionStatus::FAILED->value) {
                                $errors[] = "المزاد رقم {$auction->id}: فشل لكن حالة السيارة '{$auction->car->auction_status}'";
                            }
                        }
                    }
                }

                if ($auction->auction_type === AuctionType::LIVE && !$auction->approved_for_live) {
                    $errors[] = "المزاد رقم {$auction->id}: النوع LIVE لكن غير معتمد للبث المباشر";
                }

                if ($auction->end_time && $auction->start_time) {
                    $effectiveEnd = $auction->extended_until ?? $auction->end_time;
                    if ($effectiveEnd < $auction->start_time) {
                        $errors[] = "المزاد رقم {$auction->id}: وقت الانتهاء الفعلي قبل وقت البداية";
                    }
                }
            }

            DB::rollBack();

            $executionTime = (microtime(true) - $startTime) * 1000;
            $status = empty($errors) ? TestStatus::PASSED : TestStatus::FAILED;
            $message = empty($errors)
                ? "نجحت جميع اختبارات استقرار الحالات. تم فحص {$allAuctions->count()} مزاد."
                : "تم العثور على " . count($errors) . " أخطاء في استقرار الحالات.";

            return $this->saveTestResult($testName, $category, $status, $message, $details, $errors, $executionTime);

        } catch (\Throwable $e) {
            DB::rollBack();
            $executionTime = (microtime(true) - $startTime) * 1000;
            $errors[] = "خطأ في التنفيذ: " . $e->getMessage();

            return $this->saveTestResult($testName, $category, TestStatus::FAILED, "فشل تنفيذ الاختبار: " . $e->getMessage(), $details, $errors, $executionTime);
        }
    }
}

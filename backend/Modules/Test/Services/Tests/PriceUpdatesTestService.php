<?php

namespace Modules\Test\Services\Tests;

use App\Enums\AuctionStatus;
use App\Models\Auction;
use Modules\Test\Entities\AuctionTestResult;
use Modules\Test\Entities\Enums\TestStatus;
use Modules\Test\Services\Contracts\TestServiceInterface;
use Modules\Test\Services\Traits\TestResultTrait;
use Illuminate\Support\Facades\DB;

class PriceUpdatesTestService implements TestServiceInterface
{
    use TestResultTrait;

    public function run(): AuctionTestResult
    {
        $startTime = microtime(true);
        $testName = 'اختبارات تحديثات الأسعار';
        $category = 'price_updates';
        $errors = [];
        $details = [];

        try {
            DB::beginTransaction();

            $activeAuctions = Auction::whereIn('status', AuctionStatus::activeValues())
                ->with('bids')
                ->get();

            $details['active_auctions_count'] = $activeAuctions->count();

            foreach ($activeAuctions as $auction) {
                $highestBid = $auction->bids()->orderBy('bid_amount', 'desc')->first();

                if ($highestBid) {
                    if ((float)$auction->current_bid !== (float)$highestBid->bid_amount) {
                        $errors[] = "المزاد رقم {$auction->id}: السعر الحالي ({$auction->current_bid}) لا يطابق أعلى مزايدة ({$highestBid->bid_amount})";
                    }
                } else {
                    if ($auction->current_bid > 0 && !$auction->opening_price) {
                        $errors[] = "المزاد رقم {$auction->id}: يحتوي على سعر مزايدة حالي لكن لا توجد مزايدات ولا opening_price";
                    }
                }

                if ($auction->last_bid_time && $auction->last_bid_time->isFuture()) {
                    $errors[] = "المزاد رقم {$auction->id}: last_bid_time في المستقبل";
                }

                $bidsCount = $auction->bids()->count();
                $details["auction_{$auction->id}_bids_count"] = $bidsCount;

                if ($bidsCount > 0 && !$auction->last_bid_time) {
                    $errors[] = "المزاد رقم {$auction->id}: يحتوي على مزايدات لكن لا يوجد last_bid_time";
                }
            }

            DB::rollBack();

            $executionTime = (microtime(true) - $startTime) * 1000;
            $status = empty($errors) ? TestStatus::PASSED : TestStatus::FAILED;
            $message = empty($errors)
                ? "نجحت جميع اختبارات تحديثات الأسعار. تم فحص {$activeAuctions->count()} مزاد نشط."
                : "تم العثور على " . count($errors) . " أخطاء في تحديثات الأسعار.";

            return $this->saveTestResult($testName, $category, $status, $message, $details, $errors, $executionTime);

        } catch (\Throwable $e) {
            DB::rollBack();
            $executionTime = (microtime(true) - $startTime) * 1000;
            $errors[] = "خطأ في التنفيذ: " . $e->getMessage();

            return $this->saveTestResult($testName, $category, TestStatus::FAILED, "فشل تنفيذ الاختبار: " . $e->getMessage(), $details, $errors, $executionTime);
        }
    }
}

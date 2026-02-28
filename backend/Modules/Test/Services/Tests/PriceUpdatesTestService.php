<?php

namespace Modules\Test\Services\Tests;

use App\Enums\AuctionStatus;
use App\Models\Auction;
use Modules\Test\Entities\AuctionTestResult;
use Modules\Test\Entities\Enums\TestStatus;
use Modules\Test\Services\Contracts\TestServiceInterface;
use Modules\Test\Services\Traits\TestResultTrait;
use Illuminate\Support\Facades\DB;

/**
 * مصفوفة اختبارات تحديث السعر والمزايدات — المرجع: docs/AUCTION_PRICE_AND_STATE_STABILITY_MATRIX.md
 */
class PriceUpdatesTestService implements TestServiceInterface
{
    use TestResultTrait;

    public function run(): AuctionTestResult
    {
        $startTime = microtime(true);
        $testName = 'اختبارات تحديثات الأسعار والمزايدات اللحظية';
        $category = 'price_updates';
        $errors = [];
        $details = [];
        $cases = [];

        try {
            DB::beginTransaction();

            $activeAuctions = Auction::whereIn('status', AuctionStatus::activeValues())
                ->with('bids')
                ->get();

            $details['active_auctions_count'] = $activeAuctions->count();

            $currentBidErrors = [];
            $noBidsErrors = [];
            $lastBidTimeFutureErrors = [];
            $hasBidsNoLastTimeErrors = [];

            /** @var Auction $auction */
            foreach ($activeAuctions as $auction) {
                $highestBid = $auction->bids()->orderBy('bid_amount', 'desc')->first();

                if ($highestBid) {
                    if ((float)$auction->current_bid !== (float)$highestBid->bid_amount) {
                        $currentBidErrors[] = "المزاد {$auction->id}: السعر الحالي ({$auction->current_bid}) لا يطابق أعلى مزايدة ({$highestBid->bid_amount})";
                    }
                } else {
                    if ($auction->current_bid > 0 && !$auction->opening_price) {
                        $noBidsErrors[] = "المزاد {$auction->id}: سعر حالي بدون مزايدات ولا opening_price";
                    }
                }

                if ($auction->last_bid_time && $auction->last_bid_time->isFuture()) {
                    $lastBidTimeFutureErrors[] = "المزاد {$auction->id}: last_bid_time في المستقبل";
                }

                $bidsCount = $auction->bids()->count();
                if ($bidsCount > 0 && !$auction->last_bid_time) {
                    $hasBidsNoLastTimeErrors[] = "المزاد {$auction->id}: لديه مزايدات لكن لا يوجد last_bid_time";
                }
            }

            foreach (array_merge($currentBidErrors, $noBidsErrors, $lastBidTimeFutureErrors, $hasBidsNoLastTimeErrors) as $e) {
                $errors[] = $e;
            }

            $cases[] = [
                'id'     => 'CurrentBid_Matches_HighestBid',
                'name'   => 'السعر الحالي يطابق أعلى مزايدة',
                'passed' => empty($currentBidErrors),
                'message' => empty($currentBidErrors)
                    ? 'جميع المزادات النشطة: current_bid = أعلى bid_amount'
                    : implode('; ', array_slice($currentBidErrors, 0, 3)),
            ];
            $cases[] = [
                'id'     => 'NoBids_CurrentBid_Or_OpeningPrice',
                'name'   => 'بدون مزايدات: current_bid أو opening_price متسقان',
                'passed' => empty($noBidsErrors),
                'message' => empty($noBidsErrors)
                    ? 'لا مزاد بسعر حالي بدون مزايدات وبدون opening_price'
                    : implode('; ', array_slice($noBidsErrors, 0, 3)),
            ];
            $cases[] = [
                'id'     => 'LastBidTime_NotFuture',
                'name'   => 'last_bid_time ليس في المستقبل',
                'passed' => empty($lastBidTimeFutureErrors),
                'message' => empty($lastBidTimeFutureErrors)
                    ? 'جميع قيم last_bid_time صالحة'
                    : implode('; ', array_slice($lastBidTimeFutureErrors, 0, 3)),
            ];
            $cases[] = [
                'id'     => 'HasBids_HasLastBidTime',
                'name'   => 'وجود مزايدات ⇒ وجود last_bid_time',
                'passed' => empty($hasBidsNoLastTimeErrors),
                'message' => empty($hasBidsNoLastTimeErrors)
                    ? 'كل مزاد له مزايدات لديه last_bid_time'
                    : implode('; ', array_slice($hasBidsNoLastTimeErrors, 0, 3)),
            ];

            $details['cases'] = $cases;
            $passedCount = count(array_filter($cases, fn($c) => $c['passed']));
            $details['cases_passed'] = $passedCount;
            $details['cases_total'] = count($cases);

            DB::rollBack();

            $executionTime = (microtime(true) - $startTime) * 1000;
            $status = empty($errors) ? TestStatus::PASSED : TestStatus::FAILED;
            $message = empty($errors)
                ? "نجحت اختبارات تحديث السعر ({$passedCount}/" . count($cases) . " cases)."
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

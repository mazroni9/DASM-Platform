<?php

namespace App\Services;

use App\Models\AuctionActivityLog;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * طبقة تحليلية Business-ready لسجل نشاط المزادات.
 * تجميع وتفسير بيانات auction_activity_logs لحركة الأسعار وسلوك المزايدة:
 * عدد المزايدات، الزمن بين السومات، أنماط الأحداث، حركة السعر (أول/آخر مزايدة).
 */
class AuctionActivityAnalyticsService
{
    /**
     * تحليل نشاط مزاد واحد أو عدة مزادات من سجل النشاط.
     *
     * @param  int|int[]|null  $auctionId  معرّف مزاد واحد أو مصفوفة معرّفات (null = كل المزادات في النطاق)
     * @param  string|null  $since  بداية النطاق الزمني (Y-m-d أو ISO 8601)
     * @param  string|null  $until  نهاية النطاق الزمني
     * @param  int  $limitAuctions  أقصى عدد مزادات تُرجَع (لتجنب استعلام ثقيل)
     * @return array{by_auction: array, summary: array}
     */
    public static function analyze($auctionId = null, ?string $since = null, ?string $until = null, int $limitAuctions = 50): array
    {
        $query = AuctionActivityLog::query()
            ->where('subject_type', 'auction')
            ->whereNotNull('subject_id')
            ->orderBy('occurred_at');

        if ($auctionId !== null) {
            $query->whereIn('subject_id', is_array($auctionId) ? $auctionId : [(int) $auctionId]);
        }
        if ($since !== null) {
            $query->where('occurred_at', '>=', Carbon::parse($since));
        }
        if ($until !== null) {
            $query->where('occurred_at', '<=', Carbon::parse($until));
        }

        $logs = $query->get();

        $bySubjectId = $logs->groupBy('subject_id');
        if ($limitAuctions > 0 && $bySubjectId->count() > $limitAuctions) {
            $bySubjectId = $bySubjectId->take($limitAuctions);
        }

        $byAuction = [];
        foreach ($bySubjectId as $sid => $group) {
            $byAuction[] = self::aggregateForAuction((int) $sid, $group);
        }

        // ترتيب حسب آخر نشاط (الأحدث أولاً)
        usort($byAuction, function ($a, $b) {
            $atA = $a['last_activity_at'] ?? '';
            $atB = $b['last_activity_at'] ?? '';
            return strcmp($atB, $atA);
        });

        $summary = self::buildSummary($byAuction);

        return [
            'by_auction' => $byAuction,
            'summary' => $summary,
        ];
    }

    /**
     * تجميع مقاييس لمزاد واحد من مجموعة أحداث السجل.
     */
    protected static function aggregateForAuction(int $auctionId, Collection $logs): array
    {
        $eventTypeCounts = $logs->countBy('event_type')->all();

        $bidPlaced = $logs->where('event_type', 'bid_placed')
            ->sortBy('occurred_at')
            ->values();

        $bidsCount = $bidPlaced->count();
        $firstBidAt = null;
        $lastBidAt = null;
        $priceStart = null;
        $priceEnd = null;
        $secondsBetweenBids = [];
        $bidAmountsByTime = [];

        foreach ($bidPlaced as $i => $log) {
            $at = $log->occurred_at;
            $amount = isset($log->payload['bid_amount']) ? (float) $log->payload['bid_amount'] : null;

            if ($at) {
                $bidAmountsByTime[] = ['occurred_at' => $at->toIso8601String(), 'bid_amount' => $amount];
                if ($firstBidAt === null) {
                    $firstBidAt = $at->toIso8601String();
                    $priceStart = $amount;
                }
                $lastBidAt = $at->toIso8601String();
                $priceEnd = $amount;

                if ($i > 0 && $bidPlaced[$i - 1]->occurred_at) {
                    $secondsBetweenBids[] = $at->diffInSeconds($bidPlaced[$i - 1]->occurred_at);
                }
            }
        }

        $lastActivityAt = $logs->max('occurred_at');
        $lastActivityAt = $lastActivityAt ? $lastActivityAt->toIso8601String() : null;

        $avgSeconds = count($secondsBetweenBids) > 0
            ? round(array_sum($secondsBetweenBids) / count($secondsBetweenBids), 1)
            : null;
        $minSeconds = count($secondsBetweenBids) > 0 ? min($secondsBetweenBids) : null;
        $maxSeconds = count($secondsBetweenBids) > 0 ? max($secondsBetweenBids) : null;

        return [
            'auction_id' => $auctionId,
            'event_type_counts' => $eventTypeCounts,
            'bids_placed_count' => $bidsCount,
            'bids_rejected_count' => $eventTypeCounts['bid_rejected'] ?? 0,
            'first_bid_at' => $firstBidAt,
            'last_bid_at' => $lastBidAt,
            'last_activity_at' => $lastActivityAt,
            'price_start' => $priceStart,
            'price_end' => $priceEnd,
            'price_change' => self::priceChange($priceStart, $priceEnd),
            'avg_seconds_between_bids' => $avgSeconds,
            'min_seconds_between_bids' => $minSeconds,
            'max_seconds_between_bids' => $maxSeconds,
            'intervals_count' => count($secondsBetweenBids),
            'bid_timeline' => $bidAmountsByTime,
        ];
    }

    protected static function priceChange(?float $start, ?float $end): ?array
    {
        if ($start === null || $end === null || $start <= 0) {
            return null;
        }
        $diff = $end - $start;
        $percent = round(($diff / $start) * 100, 2);

        return [
            'absolute' => round($diff, 2),
            'percent' => $percent,
        ];
    }

    protected static function buildSummary(array $byAuction): array
    {
        $totalBidsPlaced = 0;
        $totalBidsRejected = 0;
        $auctionsWithBids = 0;
        $allIntervals = [];
        $priceChanges = [];

        foreach ($byAuction as $row) {
            $totalBidsPlaced += $row['bids_placed_count'] ?? 0;
            $totalBidsRejected += $row['bids_rejected_count'] ?? 0;
            if (($row['bids_placed_count'] ?? 0) > 0) {
                $auctionsWithBids++;
            }
            if (isset($row['avg_seconds_between_bids'])) {
                $allIntervals[] = $row['avg_seconds_between_bids'];
            }
            if (! empty($row['price_change'])) {
                $priceChanges[] = $row['price_change']['percent'];
            }
        }

        $avgInterval = count($allIntervals) > 0 ? round(array_sum($allIntervals) / count($allIntervals), 1) : null;
        $avgPriceChangePercent = count($priceChanges) > 0 ? round(array_sum($priceChanges) / count($priceChanges), 2) : null;

        return [
            'auctions_count' => count($byAuction),
            'auctions_with_bids_count' => $auctionsWithBids,
            'total_bids_placed' => $totalBidsPlaced,
            'total_bids_rejected' => $totalBidsRejected,
            'avg_seconds_between_bids_across_auctions' => $avgInterval,
            'avg_price_change_percent' => $avgPriceChangePercent,
        ];
    }
}

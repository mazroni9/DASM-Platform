<?php

namespace App\Http\Controllers\Dealer;

use App\Enums\AuctionStatus;
use App\Http\Controllers\Controller;
use App\Models\Auction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AiController extends Controller
{
    public function toggle(Request $request)
    {
        $request->validate([
            'enabled' => 'required|boolean',
        ]);

        $user = Auth::user();
        $enabled = $request->boolean('enabled');

        $user->ai_enabled = $enabled;
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'AI recommendations ' . ($enabled ? 'enabled' : 'disabled'),
            'data' => [
                'ai_enabled' => $enabled,
            ],
        ]);
    }

    public function recommendations()
    {
        $user = Auth::user();

        if (!$user->ai_enabled) {
            return response()->json([
                'status' => 'error',
                'message' => 'AI recommendations are disabled',
                'data' => [],
            ], 400);
        }

        $activeAuctions = Auction::with(['car:id,make,model,year,images,min_price,max_price'])
            ->withCount('bids')
            ->where('status', AuctionStatus::ACTIVE)
            ->whereNotNull('current_bid')
            ->where('current_bid', '>', 0)
            ->orderBy('end_time', 'asc')
            ->limit(10)
            ->get();

        $recommendations = [];

        foreach ($activeAuctions as $auction) {
            if (!$auction->car) {
                continue;
            }

            $currentPrice = (int) round((float) $auction->current_bid);
            $marketPrice = $this->resolveMarketPrice($auction, $currentPrice);

            $discountPercentage = $marketPrice > 0
                ? max(0, min(90, (int) round((($marketPrice - $currentPrice) / $marketPrice) * 100)))
                : 0;

            $timeRemainingSeconds = (int) ($auction->time_remaining ?? 0);
            $bidsCount = (int) ($auction->bids_count ?? 0);
            $confidenceScore = $this->calculateConfidenceScore($bidsCount, $timeRemainingSeconds, $discountPercentage);

            $recommendations[] = [
                'vehicle_id' => $auction->car->id,
                'name' => "{$auction->car->make} {$auction->car->model} {$auction->car->year}",
                'discount_percentage' => $discountPercentage,
                'reason' => $this->buildReason($discountPercentage, $timeRemainingSeconds, $bidsCount),
                'confidence_score' => $confidenceScore,
                'current_price' => $currentPrice,
                'market_price' => $marketPrice,
                'timestamp' => now()->toIso8601String(),
                'auction_id' => $auction->id,
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'recommendations' => $recommendations,
            ],
        ]);
    }

    private function resolveMarketPrice(Auction $auction, int $currentPrice): int
    {
        $car = $auction->car;
        $minPrice = (int) max(0, (float) ($car->min_price ?? 0));
        $maxPrice = (int) max(0, (float) ($car->max_price ?? 0));

        if ($maxPrice > 0) {
            return max($maxPrice, $currentPrice);
        }

        if ($minPrice > 0) {
            return max((int) round($minPrice * 1.10), $currentPrice);
        }

        return (int) round($currentPrice * 1.15);
    }

    private function calculateConfidenceScore(int $bidsCount, int $timeRemainingSeconds, int $discountPercentage): float
    {
        $score = 0.50;

        if ($discountPercentage >= 20) {
            $score += 0.20;
        } elseif ($discountPercentage >= 10) {
            $score += 0.10;
        }

        if ($timeRemainingSeconds > 0 && $timeRemainingSeconds <= 900) {
            $score += 0.15;
        } elseif ($timeRemainingSeconds > 0 && $timeRemainingSeconds <= 3600) {
            $score += 0.05;
        }

        if ($bidsCount >= 10) {
            $score += 0.10;
        } elseif ($bidsCount >= 5) {
            $score += 0.05;
        }

        return round(min(0.95, max(0.55, $score)), 2);
    }

    private function buildReason(int $discountPercentage, int $timeRemainingSeconds, int $bidsCount): string
    {
        if ($discountPercentage >= 20) {
            return 'السعر الحالي أقل من نطاق السوق المتوقع';
        }

        if ($timeRemainingSeconds > 0 && $timeRemainingSeconds <= 900) {
            return 'المزاد على وشك الانتهاء وقد تكون فرصة مناسبة';
        }

        if ($bidsCount >= 8) {
            return 'نشاط المزايدة مرتفع على هذه السيارة';
        }

        return 'تم ترشيح السيارة بناء على السعر الحالي وحركة المزايدة';
    }
}

<?php

namespace App\Http\Controllers\Dealer;

use App\Models\Bid;
use App\Models\Car;
use App\Models\Wallet;
use App\Models\Auction;
use Illuminate\Support\Str;
use App\Enums\AuctionStatus;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    /**
     * GET /api/dealer/dashboard/init
     * Fetches initial state: Wallet balance, Active Auctions, Latency token.
     */
    public function init(Request $request)
    {
        $user = Auth::user();
        $wallet = Wallet::where('user_id', $user->id)->first();

        // Get active auctions the dealer might be interested in
        $activeAuctions = Auction::with(['car:id,make,model,year,images'])
            ->where('status', AuctionStatus::ACTIVE)
            ->orderBy('end_time', 'asc')
            ->limit(4)
            ->get(['id', 'car_id', 'current_bid', 'end_time', 'auction_type', 'extended_until']);

        // Generate a latency check token for ping/pong
        $latencyToken = Str::random(16);

        return response()->json([
            'status' => 'success',
            'data' => [
                'wallet' => [
                    'available_balance' => $wallet->available_balance ?? 0,
                    'funded_balance' => $wallet->funded_balance ?? 0,
                    'credit_limit' => 50000, // Placeholder - can be dynamic from dealer settings
                ],
                'active_auctions' => $activeAuctions,
                'latency_token' => $latencyToken,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->first_name . ' ' . $user->last_name,
                    'plan_type' => 'PRO', // Placeholder
                    'ai_enabled' => (bool) $user->ai_enabled,
                ],
            ],
        ]);
    }

    /**
     * GET /api/dealer/dashboard/liquidity-stats
     * Returns wallet transaction data for the liquidity flow chart.
     * Groups by date, separates credit and debit transactions.
     */
    public function liquidityStats(Request $request)
    {
        $user = Auth::user();
        $period = $request->input('period', 7); // 7 or 30 days
        $wallet = Wallet::where('user_id', $user->id)->first();

        if (!$wallet) {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'labels' => [],
                    'credit' => [],
                    'debit' => [],
                ],
            ]);
        }

        $startDate = now()->subDays($period)->startOfDay();

        // Get transactions grouped by date and type
        $transactions = \App\Models\WalletTransaction::where('wallet_id', $wallet->id)
            ->where('status', 'completed')
            ->where('created_at', '>=', $startDate)
            ->selectRaw('DATE(created_at) as date, type, SUM(amount) as total')
            ->groupBy('date', 'type')
            ->orderBy('date')
            ->get();

        // Build date range
        $labels = [];
        $creditData = [];
        $debitData = [];

        $dayNames = [
            'Sunday' => 'الأحد',
            'Monday' => 'الإثنين',
            'Tuesday' => 'الثلاثاء',
            'Wednesday' => 'الأربعاء',
            'Thursday' => 'الخميس',
            'Friday' => 'الجمعة',
            'Saturday' => 'السبت',
        ];

        for ($i = $period - 1; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $dateStr = $date->format('Y-m-d');

            // Use Arabic day name for short periods, date for longer
            if ($period <= 7) {
                $labels[] = $dayNames[$date->format('l')];
            } else {
                $labels[] = $date->format('m/d');
            }

            $credit = $transactions->where('date', $dateStr)->where('type', 'credit')->first();
            $debit = $transactions->where('date', $dateStr)->where('type', 'debit')->first();

            $creditData[] = $credit ? (float) $credit->total : 0;
            $debitData[] = $debit ? (float) $debit->total : 0;
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'labels' => $labels,
                'credit' => $creditData,
                'debit' => $debitData,
                'period' => $period,
            ],
        ]);
    }

    /**
     * GET /api/dealer/dashboard/bidding-stats
     * Returns top 5 cars by bidding activity.
     * Scenario A: Dealer's own top bid cars.
     * Scenario B: Falls back to global trending if dealer has < 5 bids.
     */
    public function biddingStats()
    {
        $user = Auth::user();

        // Get dealer's top bidded cars
        // Bids belong to Auction, Auction belongs to Car
        $dealerBids = Bid::where('bids.user_id', $user->id)
            ->join('auctions', 'bids.auction_id', '=', 'auctions.id')
            ->selectRaw('auctions.car_id, COUNT(*) as bid_count')
            ->groupBy('auctions.car_id')
            ->orderByDesc('bid_count')
            ->limit(5)
            ->get();

        $isGlobalData = false;

        // If dealer has less than 5 cars bid on, fallback to global trending
        if ($dealerBids->count() < 5) {
            $isGlobalData = true;
            $dealerBids = Bid::join('auctions', 'bids.auction_id', '=', 'auctions.id')
                ->selectRaw('auctions.car_id, COUNT(*) as bid_count')
                ->where('bids.created_at', '>=', now()->subDays(7)) // Recent activity
                ->groupBy('auctions.car_id')
                ->orderByDesc('bid_count')
                ->limit(5)
                ->get();
        }

        // Get car details
        $carIds = $dealerBids->pluck('car_id')->toArray();
        $cars = Car::whereIn('id', $carIds)
            ->get(['id', 'make', 'model', 'year'])
            ->keyBy('id');

        $labels = [];
        $data = [];
        $colors = [
            'rgba(59, 130, 246, 0.8)',  // Blue
            'rgba(168, 85, 247, 0.8)',  // Purple
            'rgba(239, 68, 68, 0.8)',   // Red
            'rgba(34, 197, 94, 0.8)',   // Green
            'rgba(245, 158, 11, 0.8)',  // Amber
        ];

        foreach ($dealerBids as $index => $bid) {
            $car = $cars->get($bid->car_id);
            if ($car) {
                $labels[] = "{$car->brand} {$car->model}";
            } else {
                $labels[] = "سيارة #{$bid->car_id}";
            }
            $data[] = (int) $bid->bid_count;
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'labels' => $labels,
                'data' => $data,
                'colors' => array_slice($colors, 0, count($data)),
                'is_global' => $isGlobalData,
                'title' => $isGlobalData ? 'السيارات الأكثر نشاطاً (عام)' : 'سياراتك الأكثر مزايدة',
            ],
        ]);
    }
}

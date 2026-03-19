<?php

namespace App\Http\Controllers;

use App\Models\Settlement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    /**
     * GET /api/dashboard/stats
     * Real user dashboard statistics. No placeholders.
     */
    public function userStats(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $now = now();
        $currentMonthStart = $now->copy()->startOfMonth();
        $previousMonthStart = $now->copy()->subMonth()->startOfMonth();
        $previousMonthEnd = $now->copy()->subMonth()->endOfMonth();

        $purchasesCount = Settlement::where('buyer_id', $user->id)->count();
        $salesCount = Settlement::where('seller_id', $user->id)->count();

        $wallet = $user->wallet;
        $walletBalance = 0;
        if ($wallet) {
            $walletBalance = (float) ($wallet->available_balance ?? 0) + (float) ($wallet->funded_balance ?? 0);
        }

        $activeScope = fn ($q) => $q->where('buyer_id', $user->id)->orWhere('seller_id', $user->id);
        $activeOrdersCount = Settlement::where($activeScope)->where('status', '!=', 'completed')->count();

        $calcTrend = function ($current, $previous) {
            if ($previous == 0) return $current > 0 ? 100 : 0;
            return round((($current - $previous) / $previous) * 100, 1);
        };

        $purchasesCurrent = Settlement::where('buyer_id', $user->id)->where('created_at', '>=', $currentMonthStart)->count();
        $purchasesPrevious = Settlement::where('buyer_id', $user->id)->whereBetween('created_at', [$previousMonthStart, $previousMonthEnd])->count();

        $salesCurrent = Settlement::where('seller_id', $user->id)->where('created_at', '>=', $currentMonthStart)->count();
        $salesPrevious = Settlement::where('seller_id', $user->id)->whereBetween('created_at', [$previousMonthStart, $previousMonthEnd])->count();

        $walletCurrent = 0;
        $walletPrevious = 0;
        if ($wallet) {
            $walletCurrent = $wallet->walletTransactions()
                ->whereIn('type', ['deposit', 'sale', 'refund', 'transfer_in'])
                ->where('status', 'completed')
                ->where('created_at', '>=', $currentMonthStart)
                ->sum('amount');
            $walletPrevious = $wallet->walletTransactions()
                ->whereIn('type', ['deposit', 'sale', 'refund', 'transfer_in'])
                ->where('status', 'completed')
                ->whereBetween('created_at', [$previousMonthStart, $previousMonthEnd])
                ->sum('amount');
        }

        $activeCurrent = Settlement::where($activeScope)->where('status', '!=', 'completed')
            ->where('created_at', '>=', $currentMonthStart)->count();
        $activePrevious = Settlement::where($activeScope)->where('status', '!=', 'completed')
            ->whereBetween('created_at', [$previousMonthStart, $previousMonthEnd])->count();

        return response()->json([
            'status' => 'success',
            'data' => [
                'purchases_count' => $purchasesCount,
                'sales_count' => $salesCount,
                'wallet_balance' => $walletBalance,
                'active_orders_count' => $activeOrdersCount,
                'purchases_trend' => $calcTrend($purchasesCurrent, $purchasesPrevious),
                'sales_trend' => $calcTrend($salesCurrent, $salesPrevious),
                'wallet_trend' => $calcTrend($walletCurrent, $walletPrevious),
                'active_orders_trend' => $calcTrend($activeCurrent, $activePrevious),
            ],
        ]);
    }
}

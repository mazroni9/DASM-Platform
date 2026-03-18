<?php

namespace App\Http\Controllers;

use App\Models\Auction;
use App\Models\Car;
use App\Enums\AuctionStatus;
use App\Enums\UserRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class DealerController extends Controller
{
    /**
     * Get dealer dashboard data
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function dashboard()
    {
        $user = Auth::user();

        // Get active auctions
        $activeAuctions = Auction::whereHas('car', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
            ->where('status', AuctionStatus::ACTIVE)
            ->with('car')
            ->get();

        // Get scheduled auctions
        $scheduledAuctions = Auction::whereHas('car', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
            ->where('status', AuctionStatus::SCHEDULED)
            ->with('car')
            ->get();

        // Get recent bids on dealer's auctions
        $recentBids = Auction::whereHas('car', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
            ->with(['bids' => function ($query) {
                $query->latest()->take(10)->with('user:id,name');
            }])
            ->get()
            ->pluck('bids')
            ->flatten()
            ->sortByDesc('created_at')
            ->take(10)
            ->values();

        // Get total cars count
        $totalCars = Car::where('user_id', $user->id)->count();

        // Get cars by status
        $carsByStatus = Car::where('user_id', $user->id)
            ->selectRaw('auction_status, COUNT(*) as count')
            ->groupBy('auction_status')
            ->get();

        // Get total auction count
        $totalAuctions = Auction::whereHas('car', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->count();

        // Get completed auctions
        $completedAuctions = Auction::whereHas('car', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
            ->where('status', AuctionStatus::ENDED)
            ->count();

        // Calculate success rate
        $successRate = $totalAuctions > 0
            ? ($completedAuctions / $totalAuctions) * 100
            : 0;

        return response()->json([
            'status' => 'success',
            'data' => [
                'active_auctions_count' => $activeAuctions->count(),
                'scheduled_auctions_count' => $scheduledAuctions->count(),
                'active_auctions' => $activeAuctions,
                'scheduled_auctions' => $scheduledAuctions,
                'recent_bids' => $recentBids,
                'total_cars' => $totalCars,
                'cars_by_status' => $carsByStatus,
                'total_auctions' => $totalAuctions,
                'completed_auctions' => $completedAuctions,
                'success_rate' => round($successRate, 2)
            ]
        ]);
    }

    /**
     * Handle request to become a dealer
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function becomeDealer(Request $request)
    {
        $user = Auth::user();

        // Check if user is already a dealer
        if ($user->type === UserRole::DEALER || $user->type === 'dealer') {
            return response()->json([
                'status' => 'error',
                'message' => 'You are already registered as a dealer'
            ], 400);
        }

        // Update user type to dealer (no separate dealer record needed)
        // Note: Dealer-specific data (company_name, commercial_registry) is no longer stored
        $user->type = UserRole::DEALER;
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Your dealer account has been created successfully and is pending verification.',
        ], 201);
    }
}

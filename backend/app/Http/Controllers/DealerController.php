<?php

namespace App\Http\Controllers;

use App\Models\Auction;
use App\Models\Car;
use App\Models\Dealer;
use App\Enums\AuctionStatus;
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
        $dealer = Auth::user()->dealer;
        
        // Get active auctions
        $activeAuctions = Auction::whereHas('car', function($query) use ($dealer) {
            $query->where('dealer_id', $dealer->id);
        })
        ->where('status', AuctionStatus::ACTIVE)
        ->with('car')
        ->get();
        
        // Get scheduled auctions
        $scheduledAuctions = Auction::whereHas('car', function($query) use ($dealer) {
            $query->where('dealer_id', $dealer->id);
        })
        ->where('status', AuctionStatus::SCHEDULED)
        ->with('car')
        ->get();
        
        // Get recent bids on dealer's auctions
        $recentBids = Auction::whereHas('car', function($query) use ($dealer) {
            $query->where('dealer_id', $dealer->id);
        })
        ->with(['bids' => function($query) {
            $query->latest()->take(10)->with('user:id,name');
        }])
        ->get()
        ->pluck('bids')
        ->flatten()
        ->sortByDesc('created_at')
        ->take(10)
        ->values();

        // Get total cars count
        $totalCars = Car::where('dealer_id', $dealer->id)->count();
        
        // Get cars by status
        $carsByStatus = Car::where('dealer_id', $dealer->id)
            ->selectRaw('auction_status, COUNT(*) as count')
            ->groupBy('auction_status')
            ->get();
            
        // Get total auction count
        $totalAuctions = Auction::whereHas('car', function($query) use ($dealer) {
            $query->where('dealer_id', $dealer->id);
        })->count();
        
        // Get completed auctions
        $completedAuctions = Auction::whereHas('car', function($query) use ($dealer) {
            $query->where('dealer_id', $dealer->id);
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
        // Validate request
        $validator = Validator::make($request->all(), [
            'company_name' => 'required|string|max:255',
            'commercial_registry' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        $user = Auth::user();
        
        // Check if user is already a dealer
        if ($user->type === 'dealer') {
            return response()->json([
                'status' => 'error',
                'message' => 'You are already registered as a dealer'
            ], 400);
        }

        // Create dealer record
        $dealer = Dealer::create([
            'user_id' => $user->id,
            'company_name' => $request->company_name,
            'commercial_registry' => $request->commercial_registry,
            'description' => $request->description,
            'verification_status' => 'pending', // Default status is pending until admin approves
            'rating' => 0, // Default rating for new dealers
        ]);

        // Update user role to dealer
        $user->type = 'dealer';
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Your dealer account has been created successfully and is pending verification.',
            'dealer' => $dealer
        ], 201);
    }
}
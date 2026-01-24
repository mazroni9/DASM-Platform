<?php

namespace App\Http\Controllers\Dealer;

use App\Models\Auction;
use App\Enums\AuctionStatus;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AiController extends Controller
{
    /**
     * POST /api/dealer/ai/toggle
     * Saves user preference for AI recommendations.
     * 
     * Note: AI recommendations feature was tied to dealer records.
     * This endpoint is kept for API compatibility but returns a success response.
     * TODO: If AI feature is needed, add ai_recommendations_enabled column to users table.
     */
    public function toggle(Request $request)
    {
        $request->validate([
            'enabled' => 'required|boolean',
        ]);

        $user = Auth::user();
        $enabled = $request->input('enabled');

        // Persist the AI enabled state to user record
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

    /**
     * GET /api/dealer/ai/recommendations
     * Returns AI-generated recommendations for sniping opportunities.
     * 
     * Currently generates mock recommendations based on active auctions.
     * In production, this would integrate with an actual AI/ML service.
     */
    public function recommendations()
    {
        $user = Auth::user();

        // Check if AI is enabled for this user
        if (!$user->ai_enabled) {
            return response()->json([
                'status' => 'error',
                'message' => 'AI recommendations are disabled',
                'data' => [],
            ], 400);
        }

        // Get active auctions with cars
        $activeAuctions = Auction::with(['car:id,make,model,year,images'])
            ->where('status', AuctionStatus::ACTIVE)
            ->whereNotNull('current_bid')
            ->where('current_bid', '>', 0)
            ->orderBy('end_time', 'asc')
            ->limit(10)
            ->get();

        $recommendations = [];
        $reasons = [
            'السعر أقل من متوسط السوق بشكل ملحوظ',
            'المزاد على وشك الانتهاء مع عدد مزايدين قليل',
            'السيارة من فئة مطلوبة بسعر منافس',
            'فرصة شراء نادرة - الموديل مميز',
            'السعر الحالي أقل من التقييم السوقي',
        ];

        foreach ($activeAuctions as $index => $auction) {
            if (!$auction->car) continue;

            // Generate mock market price (15-35% higher than current bid)
            $discountPercentage = rand(10, 30);
            $currentPrice = (int) $auction->current_bid;
            $marketPrice = (int) ($currentPrice * (100 / (100 - $discountPercentage)));

            $recommendations[] = [
                'vehicle_id' => $auction->car->id,
                'name' => "{$auction->car->make} {$auction->car->model} {$auction->car->year}",
                'discount_percentage' => $discountPercentage,
                'reason' => $reasons[$index % count($reasons)],
                'confidence_score' => round(rand(70, 95) / 100, 2),
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
}

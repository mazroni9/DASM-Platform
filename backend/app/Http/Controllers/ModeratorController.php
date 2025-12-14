<?php

namespace App\Http\Controllers;

use App\Models\Broadcast;
use App\Models\Car;
use App\Models\Auction;
use App\Models\Bid;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Enums\AuctionStatus;

class ModeratorController extends Controller
{
    /**
     * Get moderator dashboard data
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function dashboard()
    {
        $user = Auth::user();

        if ($user->type !== 'moderator') {
            return response()->json([
                'status' => 'error',
                'message' => 'Access denied. Moderator role required.'
            ], 403);
        }

        // Get active broadcasts managed by this moderator
        $activeBroadcasts = Broadcast::where('moderator_id', $user->id)
            ->where('is_live', true)
            ->with(['currentCar', 'currentAuction'])
            ->get();

        // Get active auctions that can be displayed
        $activeAuctions = Auction::where('status', AuctionStatus::ACTIVE)
            ->with(['car'])
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'active_broadcasts' => $activeBroadcasts,
                'active_auctions' => $activeAuctions
            ]
        ]);
    }

    /**
     * Start a new broadcast
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function startBroadcast(Request $request)
    {
        $user = Auth::user();

        if ($user->type !== 'moderator') {
            return response()->json([
                'status' => 'error',
                'message' => 'Access denied. Moderator role required.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'youtube_url' => 'required|url',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Extract YouTube video ID from URL and create embed URL
        $youtubeUrl = $request->youtube_url;
        $youtubeVideoId = null;
        $youtubeEmbedUrl = null;

        if (preg_match('/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/', $youtubeUrl, $matches)) {
            $youtubeVideoId = $matches[1];
            $youtubeEmbedUrl = "https://www.youtube.com/embed/{$youtubeVideoId}";
        } else if (strpos($youtubeUrl, 'youtube.com/embed/') !== false) {
            // URL is already an embed URL
            $youtubeEmbedUrl = $youtubeUrl;
            // Try to extract the video ID from embed URL
            if (preg_match('/embed\/([^"&?\/\s]{11})/', $youtubeUrl, $matches)) {
                $youtubeVideoId = $matches[1];
            }
        }

        if (!$youtubeEmbedUrl) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid YouTube URL. Please provide a valid YouTube video URL.',
            ], 422);
        }            // Check if there's already an active broadcast and set it to inactive
        $activeBroadcasts = Broadcast::where('is_live', true)->get();
        foreach ($activeBroadcasts as $activeBroadcast) {
            $activeBroadcast->update([
                'is_live' => false,
                'end_time' => now(),
                'ended_at' => now(),
                'status' => 'ended' // Changed from 'completed' to 'ended' as per constraint
            ]);
        }

        try {
            $broadcast = Broadcast::create([
                'title' => $request->title,
                'description' => $request->description,
                'youtube_embed_url' => $youtubeEmbedUrl,
                'youtube_stream_id' => $youtubeVideoId,
                'youtube_chat_embed_url' => "https://www.youtube.com/live_chat?v={$youtubeVideoId}&embed_domain=" . parse_url(config('app.frontend_url'), PHP_URL_HOST),
                'is_live' => true,
                'moderator_id' => $user->id,
                'created_by' => $user->id,
                'actual_start_time' => now(),
                'stream_url' => $youtubeUrl,
                'status' => 'live', // Changed from 'active' to 'live' as per constraint
                'started_at' => now(),
                'auction_id' => null,
            ]);
        } catch (\Exception $e) {
            // Log the error
//            \Log::error(message: 'Failed to create broadcast: ' . $e->getMessage());

            // Return a more helpful error response
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create broadcast: ' . $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Broadcast started successfully',
            'data' => $broadcast->load(['moderator'])
        ]);
    }

    /**
     * Switch the current car being displayed
     *
     * @param Request $request
     * @param int $broadcastId
     * @return \Illuminate\Http\JsonResponse
     */
    public function switchCar(Request $request, $broadcastId)
    {
        $user = Auth::user();

        if ($user->type !== 'moderator') {
            return response()->json([
                'status' => 'error',
                'message' => 'Access denied. Moderator role required.'
            ], 403);
        }

        $broadcast = Broadcast::where('id', $broadcastId)
            ->where('moderator_id', $user->id)
            ->first();

        if (!$broadcast) {
            return response()->json([
                'status' => 'error',
                'message' => 'Broadcast not found or access denied'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'car_id' => 'required|exists:cars,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Verify the car has an active auction
        $auction = Auction::where('car_id', $request->car_id)
            ->where('status', AuctionStatus::ACTIVE)
            ->first();

        if (!$auction) {
            return response()->json([
                'status' => 'error',
                'message' => 'No active auction found for this car'
            ], 400);
        }

        $broadcast->update([
            'current_car_id' => $request->car_id
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Car switched successfully',
            'data' => $broadcast->load(['currentCar', 'currentAuction'])
        ]);
    }

    /**
     * Add a bid for a non-online participant
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function addOfflineBid(Request $request)
    {
        $user = Auth::user();

        if ($user->type !== 'moderator') {
            return response()->json([
                'status' => 'error',
                'message' => 'Access denied. Moderator role required.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'auction_id' => 'required|exists:auctions,id',
            'bidder_name' => 'required|string|max:255',
            'bid_amount' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $auction = Auction::find($request->auction_id);

        if ($auction->status !== AuctionStatus::ACTIVE) {
            return response()->json([
                'status' => 'error',
                'message' => 'Auction is not active'
            ], 400);
        }

        // Check if bid amount is higher than current bid
        if ($request->bid_amount <= $auction->current_bid) {
            return response()->json([
                'status' => 'error',
                'message' => 'Bid amount must be higher than current bid'
            ], 400);
        }

        // Create the offline bid
        $bid = Bid::create([
            'auction_id' => $request->auction_id,
            'user_id' => null,
            'bid_amount' => $request->bid_amount,
            'no_account' => true,
            'bidder_name' => $request->bidder_name,
        ]);

        // Update auction current bid
        $auction->update([
            'current_bid' => $request->bid_amount,
            'last_bid_time' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Offline bid added successfully',
            'data' => [
                'bid' => $bid,
                'auction' => $auction->fresh()
            ]
        ]);
    }

    /**
     * Stop a broadcast
     *
     * @param int $broadcastId
     * @return \Illuminate\Http\JsonResponse
     */
    public function stopBroadcast($broadcastId)
    {
        $user = Auth::user();

        if ($user->type !== 'moderator') {
            return response()->json([
                'status' => 'error',
                'message' => 'Access denied. Moderator role required.'
            ], 403);
        }

        $broadcast = Broadcast::where('id', $broadcastId)
            ->where('moderator_id', $user->id)
            ->first();

        if (!$broadcast) {
            return response()->json([
                'status' => 'error',
                'message' => 'Broadcast not found or access denied'
            ], 404);
        }

        $broadcast->update([
            'is_live' => false,
            'end_time' => now(),
            'ended_at' => now(),
            'status' => 'ended', // Set status to 'ended' as per constraint
        ]);

        // Update venue to offline status
        $venue = $broadcast->venue;
        if ($venue) {
            $venue->update(['is_live' => false]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Broadcast stopped successfully',
            'data' => $broadcast
        ]);
    }

    /**
     * Get current broadcast info for public viewing
     *
     * @param int $venueId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCurrentBroadcast($venueId)
    {
        $broadcast = Broadcast::where('venue_id', $venueId)
            ->where('is_live', true)
            ->with(['currentCar.auctions' => function($query) {
                $query->where('status', AuctionStatus::ACTIVE);
            }, 'venue'])
            ->first();

        if (!$broadcast) {
            return response()->json([
                'status' => 'error',
                'message' => 'No active broadcast found for this venue'
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $broadcast
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\AuctionSession;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\LiveAuctionSessionResource;

class AuctionSessionController extends Controller
{
    /**
     * Display a listing of active live auction sessions.
     */
    public function getActiveLiveSessions(): JsonResponse
    {
        // Eager-load the 'owner' (User) relationship
        // We assume the User model has 'name' and 'logo_url' columns
        // The user model has first_name and last_name, so I will select them.
        // There is no logo_url, so I will omit it for now. The frontend will have to handle a missing logo.
        $liveSessions = AuctionSession::where('status', 'active')
                                      ->where('type', 'live')
                                      ->with('owner:id,first_name,last_name')
                                      ->with('owner.venueOwner:id,venue_name,user_id')
                                      ->latest()
                                      ->paginate(12);
        return response()->json([
            'status' => 'success',
            'data' => $liveSessions
        ]);
    }

    public function getLiveSession(string $id): JsonResponse
    {
        $live_session = AuctionSession::with([
            'auctions' => function ($query) {
                $query->where('status', '!=', 'ended')
                      ->where('approved_for_live', true)
                      ->orderBy('start_time', 'asc');
            },
            'auctions.car'
        ])
        ->where('type', 'live')
        ->with('auctions.bids')
        ->with('auctions.car.dealer')
        ->findOrFail($id);


    if (! $live_session) {
        return response()->json([
            'status' => 'error',
            'message' => 'No live session found'
        ], 404);
    }

    $session_data = new LiveAuctionSessionResource($live_session);


    return response()->json([
        'status' => 'success',
        'data' => $session_data
    ]);
}
}

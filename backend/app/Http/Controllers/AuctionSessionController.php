<?php

namespace App\Http\Controllers;

use App\Models\AuctionSession;
use App\Enums\AuctionStatus;
use Illuminate\Http\JsonResponse;
use App\Http\Resources\LiveAuctionSessionResource;
use Illuminate\Support\Facades\Cache;

class AuctionSessionController extends Controller
{
    /**
     * Cache TTL in seconds (5 minutes)
     */
    private const CACHE_TTL = 300;

    /**
     * Display a listing of active live auction sessions.
     * GET /api/sessions/live
     * 
     * ✅ Performance: Added caching
     * ✅ Performance: Optimized eager loading
     */
    public function getActiveLiveSessions(): JsonResponse
    {
        $cacheKey = 'active_live_sessions_page_' . request()->get('page', 1);
        
        $liveSessions = Cache::remember($cacheKey, self::CACHE_TTL, function () {
            return AuctionSession::query()
                ->where('status', 'active')
                ->where('type', 'live')
                ->with([
                    'owner:id,first_name,last_name',
                    'owner.venueOwner:id,user_id,venue_name',
                ])
                ->withCount('auctions')
                ->latest()
                ->paginate(12);
        });

        return response()->json([
            'success' => true,
            'data'    => $liveSessions
        ]);
    }

    /**
     * Display the specified live session with auctions.
     * GET /api/sessions/live/{id}
     * 
     * ✅ Bug Fix: Removed redundant null check after findOrFail
     * ✅ Performance: Optimized eager loading (single with() call)
     */
    public function getLiveSession(string $id): JsonResponse
    {
        $cacheKey = "live_session_{$id}";
        
        $sessionData = Cache::remember($cacheKey, 60, function () use ($id) {
            $liveSession = AuctionSession::query()
                ->where('type', 'live')
                ->with([
                    'auctions' => function ($query) {
                        $query->where('approved_for_live', true)
                              ->whereNotIn('status', [
                                  AuctionStatus::ENDED->value,
                                  AuctionStatus::COMPLETED->value,
                                  ...AuctionStatus::canceledValues(),
                              ])
                              ->orderBy('start_time', 'asc')
                              ->with([
                                  'car:id,make,model,year,vin,color,odometer,evaluation_price,auction_status',
                                  'car.images' => fn($q) => $q->limit(5),
                                  'car.dealer:id,user_id,company_name',
                                  'bids' => fn($q) => $q->orderBy('created_at', 'desc')->limit(10),
                                  'bids.user:id,first_name,last_name',
                              ]);
                    },
                    'owner:id,first_name,last_name',
                    'owner.venueOwner:id,user_id,venue_name',
                ])
                ->findOrFail($id);

            return new LiveAuctionSessionResource($liveSession);
        });

        return response()->json([
            'success' => true,
            'data'    => $sessionData
        ]);
    }

    /**
     * Get active and scheduled sessions (for dropdowns/selection)
     * GET /api/sessions/active-scheduled
     * 
     * ✅ Moved from AdminController (was duplicated)
     */
    public function getActiveAndScheduledSessions(): JsonResponse
    {
        $sessions = Cache::remember('active_scheduled_sessions', self::CACHE_TTL, function () {
            return AuctionSession::query()
                ->whereIn('status', ['scheduled', 'active'])
                ->orderBy('session_date', 'asc')
                ->get(['id', 'name', 'session_date', 'status', 'type']);
        });

        return response()->json([
            'success' => true,
            'data'    => $sessions,
        ]);
    }

    /**
     * Show session summary (public)
     * GET /api/sessions/{id}
     */
    public function show(string $id): JsonResponse
    {
        $session = AuctionSession::query()
            ->select(['id', 'name', 'session_date', 'status', 'type', 'created_at', 'updated_at'])
            ->withCount('auctions')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $session,
        ]);
    }
}

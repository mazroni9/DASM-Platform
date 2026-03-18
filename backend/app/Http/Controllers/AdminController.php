<?php

namespace App\Http\Controllers;

use App\Models\Car;
use App\Models\User;
use App\Models\Auction;
use App\Models\Transcation;
use App\Models\Settlement;
use App\Enums\AuctionStatus;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

/**
 * AdminController
 *
 * ✅ REFACTORED: تم نقل Sessions methods لـ controllers مخصصة
 *
 * Responsibilities:
 * - Dashboard statistics
 * - Transactions & Settlements overview
 *
 * @see \App\Http\Controllers\Admin\AuctionController for auction management
 * @see \App\Http\Controllers\Admin\AuctionSessionController for sessions
 * @see \App\Http\Controllers\AuctionSessionController for public sessions
 */
class AdminController extends Controller
{
    /**
     * Cache TTL for dashboard stats (5 minutes)
     */
    private const DASHBOARD_CACHE_TTL = 300;

    /**
     * Admin dashboard stats
     * GET /api/admin/dashboard
     *
     * ✅ Performance: Added caching for expensive queries
     * ✅ Security: Only returns aggregate data
     */
    public function dashboard(): JsonResponse
    {
        $cacheKey = 'admin_dashboard_stats';

        $stats = Cache::remember($cacheKey, self::DASHBOARD_CACHE_TTL, function () {
            return $this->calculateDashboardStats();
        });

        // Non-cached dynamic data (always fresh)
        $dynamicData = $this->getDynamicDashboardData();

        return response()->json([
            'success' => true,
            'data'    => array_merge($stats, $dynamicData),
        ]);
    }

    /**
     * Calculate dashboard statistics (cached)
     */
    private function calculateDashboardStats(): array
    {
        // User stats
        $totalUsers       = User::count();
        $pendingUsers     = User::where('status', 'pending')->count();
        $activeUsers      = User::where('is_active', true)->count();
        $dealerCount      = User::where('type', 'dealer')->count();
        $regularUserCount = User::where('type', 'user')->count();

        // Auction stats
        $totalAuctions     = Auction::count();
        $activeAuctions    = Auction::whereIn('status', AuctionStatus::activeValues())->count();
        $completedAuctions = Auction::where('status', AuctionStatus::COMPLETED)->count();
        $endedAuctions     = Auction::where('status', AuctionStatus::ENDED)->count();
        $pendingAuctions   = Auction::where('status', AuctionStatus::SCHEDULED)->count();
        $failedAuctions    = Auction::where('status', AuctionStatus::FAILED)->count();

        // Verification stats (count pending dealer users instead of dealer records)
        $pendingVerifications = User::where('type', 'dealer')->where('status', 'pending')->count();

        // Car stats
        $totalCars      = Car::count();
        $carsInAuction  = Car::where('auction_status', 'in_auction')->count();
        $soldCars       = Car::where('auction_status', 'sold')->count();

        return [
            // Users
            'total_users'           => $totalUsers,
            'active_users'          => $activeUsers,
            'pending_users'         => $pendingUsers,
            'dealers_count'         => $dealerCount,
            'regular_users_count'   => $regularUserCount,

            // Auctions
            'total_auctions'        => $totalAuctions,
            'active_auctions'       => $activeAuctions,
            'completed_auctions'    => $completedAuctions,
            'ended_auctions'        => $endedAuctions,
            'pending_auctions'      => $pendingAuctions,
            'failed_auctions'       => $failedAuctions,

            // Verifications
            'pending_verifications' => $pendingVerifications,

            // Cars
            'total_cars'            => $totalCars,
            'cars_in_auction'       => $carsInAuction,
            'sold_cars'             => $soldCars,

            // Metadata
            'cached_at'             => now()->toIso8601String(),
        ];
    }

    /**
     * Get dynamic dashboard data (not cached)
     */
    private function getDynamicDashboardData(): array
    {
        // Recent auctions
        $recentAuctions = Auction::query()
            ->with(['car:id,make,model,year,auction_status'])
            ->select(['id', 'car_id', 'status', 'auction_type', 'current_bid', 'created_at'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        // Recent users
        $recentUsers = User::query()
            ->select(['id', 'first_name', 'last_name', 'email', 'type', 'status', 'is_active', 'created_at'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        // Today's activity
        $todayStats = [
            'new_users_today'    => User::whereDate('created_at', today())->count(),
            'new_auctions_today' => Auction::whereDate('created_at', today())->count(),
            'bids_today'         => DB::table('bids')->whereDate('created_at', today())->count(),
        ];

        return [
            'recent_auctions' => $recentAuctions,
            'recent_users'    => $recentUsers,
            'today'           => $todayStats,
        ];
    }

    // ═══════════════════════════════════════════════════════════════════
    // TRANSACTIONS & SETTLEMENTS
    // TODO: Move to Admin\FinanceController
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Transactions list
     * GET /api/admin/transactions
     */
    public function getTransactions(Request $request): JsonResponse
    {
        $query = Transcation::with(['wallet', 'wallet.user:id,first_name,last_name']);

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('user_id')) {
            $query->whereHas('wallet', fn($q) => $q->where('user_id', $request->user_id));
        }

        // Date range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Search by reference
        if ($request->filled('search')) {
            $query->where('reference', 'like', "%{$request->search}%");
        }

        $perPage = min(50, max(1, (int) $request->get('per_page', 15)));
        $transactions = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data'    => $transactions
        ]);
    }

    /**
     * Settlements list
     * GET /api/admin/settlements
     */
    public function getSettlements(Request $request): JsonResponse
    {
        $query = Settlement::with([
            'buyer:id,first_name,last_name,email',
            'seller:id,first_name,last_name,email',
            'auction:id,car_id,status,current_bid',
            'car:id,make,model,year,vin',
        ]);

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('buyer_id')) {
            $query->where('buyer_id', $request->buyer_id);
        }

        if ($request->filled('seller_id')) {
            $query->where('seller_id', $request->seller_id);
        }

        // Date range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $perPage = min(50, max(1, (int) $request->get('per_page', 15)));
        $settlements = $query->orderByDesc('created_at')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data'    => $settlements
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════
    // LEGACY METHODS - DEPRECATED
    // These are kept for backward compatibility but should be removed
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Get a specific auction by ID (admin view)
     *
     * @deprecated Use Admin\AuctionController::show() instead
     * @see \App\Http\Controllers\Admin\AuctionController::show()
     */
    public function getAuction($id): JsonResponse
    {
        Log::warning('Deprecated method called: AdminController@getAuction', [
            'auction_id' => $id,
            'caller'     => request()->path(),
        ]);

        $auction = Auction::with([
            'car',
            'bids' => fn($q) => $q->orderByDesc('created_at')->limit(20),
            'bids.user:id,first_name,last_name',
            'liveStreamingSession',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $auction,
            '_warning' => 'This endpoint is deprecated. Use /api/admin/auctions/{id} instead.',
        ]);
    }

    /**
     * Update auction details (admin only)
     *
     * @deprecated Use Admin\AuctionController::update() instead
     * @see \App\Http\Controllers\Admin\AuctionController::update()
     */
    public function updateAuction($id, Request $request): JsonResponse
    {
        Log::warning('Deprecated method called: AdminController@updateAuction', [
            'auction_id' => $id,
            'caller'     => request()->path(),
        ]);

        $validator = Validator::make($request->all(), [
            'start_time'            => 'required|date',
            'end_time'              => 'required|date|after:start_time',
            'minimum_bid'           => 'required|numeric|min:0',
            'maximum_bid'           => 'nullable|numeric|min:0',
            'reserve_price'         => 'required|numeric|min:0',
            'opening_price'         => 'nullable|numeric|min:0',
            'status'                => 'required|string',
            'auction_type'          => 'required|string|in:live,live_instant,silent_instant,fixed',
            'control_room_approved' => 'required|boolean',
            'approved_for_live'     => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $auction = Auction::with('car')->findOrFail($id);

            $auction->start_time            = $request->start_time;
            $auction->end_time              = $request->end_time;
            $auction->minimum_bid           = $request->minimum_bid;
            $auction->maximum_bid           = $request->maximum_bid;
            $auction->reserve_price         = $request->reserve_price;
            $auction->opening_price         = $request->opening_price;
            $auction->status                = AuctionStatus::normalize($request->status);
            $auction->auction_type          = $request->auction_type;
            $auction->control_room_approved = $request->control_room_approved;
            $auction->approved_for_live     = $request->approved_for_live;
            $auction->save();

            // Update car status based on auction status
            if ($auction->car) {
                $this->syncCarAuctionStatus($auction);
            }

            DB::commit();

            // Clear caches
            Cache::forget('admin_dashboard_stats');

            return response()->json([
                'success'  => true,
                'message'  => 'تم تحديث المزاد بنجاح',
                'data'     => $auction->fresh(),
                '_warning' => 'This endpoint is deprecated. Use PUT /api/admin/auctions/{id} instead.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Auction update failed', ['error' => $e->getMessage(), 'id' => $id]);

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تحديث المزاد'
            ], 500);
        }
    }

    /**
     * Sync car auction_status based on auction status
     */
    private function syncCarAuctionStatus(Auction $auction): void
    {
        if (!$auction->car) {
            return;
        }

        $status = $auction->statusValue();

        if (in_array($status, AuctionStatus::activeValues())) {
            $auction->car->auction_status = 'in_auction';
        } elseif ($status === AuctionStatus::COMPLETED->value) {
            $auction->car->auction_status = 'sold';
        } elseif (in_array($status, [
            AuctionStatus::ENDED->value,
            AuctionStatus::FAILED->value,
            ...AuctionStatus::canceledValues()
        ])) {
            $auction->car->auction_status = 'available';
        }

        $auction->car->save();
    }

    // ═══════════════════════════════════════════════════════════════════
    // REMOVED METHODS (Moved to dedicated controllers)
    // ═══════════════════════════════════════════════════════════════════

    /*
     * ❌ REMOVED: getActiveAndScheduledSessions()
     * ✅ MOVED TO: App\Http\Controllers\AuctionSessionController::getActiveAndScheduledSessions()
     * ✅ ROUTE: GET /api/sessions/active-scheduled
     *
     * ❌ REMOVED: showSessionPublic()
     * ✅ MOVED TO: App\Http\Controllers\AuctionSessionController::show()
     * ✅ ROUTE: GET /api/sessions/{id}
     */
}

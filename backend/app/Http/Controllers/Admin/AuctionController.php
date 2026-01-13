<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\Car;
use App\Enums\AuctionStatus;
use App\Enums\AuctionType;
use App\Events\AuctionStatusChangedEvent;
use App\Events\CarApprovedForLiveEvent;
use App\Notifications\CarApprovedForLiveNotification;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class AuctionController extends Controller
{
    /**
     * Display a listing of the auctions.
     * GET /api/admin/auctions
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Unauthorized'
            ], 403);
        }

        $query = Auction::with([
            'car:id,make,model,year,vin,evaluation_price,auction_status,user_id',
            'car.user:id,first_name,last_name,email,phone',
            'session:id,name,session_date,status',
        ]);

        // Filters
        if ($request->filled('status')) {
            $status = AuctionStatus::normalize($request->status);
            $query->where('status', $status);
        }

        if ($request->filled('auction_type')) {
            $query->where('auction_type', $request->auction_type);
        }

        if ($request->filled('session_id')) {
            $query->where('session_id', $request->session_id);
        }

        if ($request->filled('approved_for_live')) {
            $query->where('approved_for_live', $request->boolean('approved_for_live'));
        }

        if ($request->filled('control_room_approved')) {
            $query->where('control_room_approved', $request->boolean('control_room_approved'));
        }

        // Date range
        if ($request->filled('start_date')) {
            $query->whereDate('start_time', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('end_time', '<=', $request->end_date);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('car', function ($q) use ($search) {
                $q->where('make', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%")
                    ->orWhere('vin', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['created_at', 'start_time', 'end_time', 'current_bid', 'status'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');
        }

        $perPage = min(50, max(1, (int) $request->get('per_page', 15)));
        $auctions = $query->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data'   => $auctions,
        ]);
    }

    /**
     * Display the specified auction.
     * GET /api/admin/auctions/{id}
     */
    public function show(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Unauthorized'
            ], 403);
        }

        $auction = Auction::with([
            'car',
            'car.user:id,first_name,last_name,email,phone',
            'car.images',
            'session',
            'bids' => fn($q) => $q->orderBy('created_at', 'desc')->limit(20),
            'bids.user:id,first_name,last_name',
            'liveStreamingSession',
        ])->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data'   => $auction,
        ]);
    }

    /**
     * Update the specified auction.
     * PUT /api/admin/auctions/{id}
     */
    public function update(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Unauthorized'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'start_time'            => 'sometimes|date',
            'end_time'              => 'sometimes|date|after:start_time',
            'minimum_bid'           => 'sometimes|numeric|min:0',
            'maximum_bid'           => 'nullable|numeric|min:0',
            'reserve_price'         => 'sometimes|numeric|min:0',
            'opening_price'         => 'nullable|numeric|min:0',
            'status'                => 'sometimes|string',
            'auction_type'          => 'sometimes|string|in:' . implode(',', AuctionType::values()),
            'control_room_approved' => 'sometimes|boolean',
            'approved_for_live'     => 'sometimes|boolean',
            'session_id'            => 'nullable|exists:auction_sessions,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $auction = Auction::with('car')->findOrFail($id);
            $oldStatus = $auction->status;

            // Update fields
            if ($request->has('start_time')) {
                $auction->start_time = Carbon::parse($request->start_time);
            }
            if ($request->has('end_time')) {
                $auction->end_time = Carbon::parse($request->end_time);
            }
            if ($request->has('minimum_bid')) {
                $auction->minimum_bid = $request->minimum_bid;
            }
            if ($request->has('maximum_bid')) {
                $auction->maximum_bid = $request->maximum_bid;
            }
            if ($request->has('reserve_price')) {
                $auction->reserve_price = $request->reserve_price;
            }
            if ($request->has('opening_price')) {
                $auction->opening_price = $request->opening_price;
            }
            if ($request->has('auction_type')) {
                $auction->auction_type = $request->auction_type;
            }
            if ($request->has('control_room_approved')) {
                $auction->control_room_approved = $request->control_room_approved;
            }
            if ($request->has('approved_for_live')) {
                $auction->approved_for_live = $request->approved_for_live;
            }
            if ($request->has('session_id')) {
                $auction->session_id = $request->session_id;
            }
            if ($request->has('status')) {
                $auction->status = AuctionStatus::normalize($request->status);
            }

            $auction->save();

            // Update car status
            if ($auction->car) {
                $this->syncCarStatus($auction);
            }

            // Fire event if status changed
            $newStatus = $auction->status;
            if ($oldStatus !== $newStatus && $auction->car) {
                event(new AuctionStatusChangedEvent($auction, $oldStatus, $newStatus, $auction->car));
            }

            DB::commit();

            // Clear cache
            Cache::forget('admin_dashboard_stats');

            Log::info('Auction updated by admin', [
                'auction_id' => $id,
                'admin_id'   => $user->id,
                'changes'    => $request->except(['_token']),
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'تم تحديث المزاد بنجاح',
                'data'    => $auction->fresh(['car', 'session']),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Auction update failed', ['error' => $e->getMessage(), 'auction_id' => $id]);

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء تحديث المزاد'
            ], 500);
        }
    }

    /**
     * Approve auction for live streaming.
     * POST /api/admin/auctions/{id}/approve-for-live
     */
    public function approveForLive(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Unauthorized'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'opening_price'    => 'required|numeric|min:0',
            'approved_for_live' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $auction = Auction::with('car.user')->findOrFail($id);

            $auction->approveByControlRoom(
                $request->opening_price,
                $request->approved_for_live
            );

            // Notify car owner (dealer is now just a user with type='dealer')
            if ($auction->car && $auction->car->user) {
                try {
                    $auction->car->user->notify(new CarApprovedForLiveNotification($auction));
                } catch (\Exception $e) {
                    Log::warning('Failed to send approval notification', ['error' => $e->getMessage()]);
                }
            }

            // Broadcast event
            if ($request->approved_for_live && $auction->car) {
                event(new CarApprovedForLiveEvent($auction, $auction->car));
            }

            Log::info('Auction approved for live', [
                'auction_id' => $id,
                'admin_id'   => $user->id,
                'approved'   => $request->approved_for_live,
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => $request->approved_for_live
                    ? 'تمت الموافقة على المزاد للبث المباشر'
                    : 'تم تحديث حالة الموافقة',
                'data'    => $auction->fresh(),
            ]);
        } catch (\Exception $e) {
            Log::error('Approve for live failed', ['error' => $e->getMessage(), 'auction_id' => $id]);

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء الموافقة'
            ], 500);
        }
    }

    /**
     * Bulk update auction status.
     * POST /api/admin/auctions/bulk-status
     */
    public function bulkUpdateStatus(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Unauthorized'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'auction_ids' => 'required|array|min:1|max:50',
            'auction_ids.*' => 'exists:auctions,id',
            'status' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $normalizedStatus = AuctionStatus::normalize($request->status);
            $updated = 0;

            DB::beginTransaction();

            foreach ($request->auction_ids as $auctionId) {
                $auction = Auction::with('car')->find($auctionId);
                if ($auction) {
                    $auction->status = $normalizedStatus;
                    $auction->save();

                    if ($auction->car) {
                        $this->syncCarStatus($auction);
                    }
                    $updated++;
                }
            }

            DB::commit();

            Cache::forget('admin_dashboard_stats');

            Log::info('Bulk auction status update', [
                'admin_id' => $user->id,
                'count'    => $updated,
                'status'   => $normalizedStatus,
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => "تم تحديث {$updated} مزاد بنجاح",
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk status update failed', ['error' => $e->getMessage()]);

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء التحديث'
            ], 500);
        }
    }

    /**
     * Get auction statistics.
     * GET /api/admin/auctions/stats
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Unauthorized'
            ], 403);
        }

        $stats = Cache::remember('admin_auction_stats', 300, function () {
            return [
                'total'              => Auction::count(),
                'scheduled'          => Auction::where('status', AuctionStatus::SCHEDULED)->count(),
                'active'             => Auction::whereIn('status', AuctionStatus::activeValues())->count(),
                'ended'              => Auction::where('status', AuctionStatus::ENDED)->count(),
                'completed'          => Auction::where('status', AuctionStatus::COMPLETED)->count(),
                'failed'             => Auction::where('status', AuctionStatus::FAILED)->count(),
                'cancelled'          => Auction::whereIn('status', AuctionStatus::canceledValues())->count(),
                'pending_approval'   => Auction::where('control_room_approved', false)->count(),
                'approved_for_live'  => Auction::where('approved_for_live', true)->count(),
                'total_bids_value'   => DB::table('bids')->sum('bid_amount'),
                'avg_bids_per_auction' => round(DB::table('bids')->count() / max(1, Auction::count()), 2),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data'   => $stats,
        ]);
    }

    /**
     * Sync car auction_status based on auction status.
     */
    private function syncCarStatus(Auction $auction): void
    {
        if (!$auction->car) {
            return;
        }

        $status = $auction->statusValue();

        if (in_array($status, AuctionStatus::activeValues())) {
            $auction->car->auction_status = 'in_auction';
        } elseif ($status === AuctionStatus::COMPLETED->value) {
            $auction->car->auction_status = 'sold';
        } elseif (in_array($status, [AuctionStatus::ENDED->value, AuctionStatus::FAILED->value, ...AuctionStatus::canceledValues()])) {
            $auction->car->auction_status = 'available';
        }

        $auction->car->save();
    }
}

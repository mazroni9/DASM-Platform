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
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use App\Notifications\CarMovedToAuctionNotification;
use App\Notifications\CarApprovedForAuctionNotification;
use App\Events\CarMovedBetweenAuctionsEvent;

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
            if ($request->status != 'all') {
                $status = AuctionStatus::normalize($request->status);
                $query->where('status', $status);
            }
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
     * Approve an auction with scheduling logic.
     * POST /api/admin/auctions/{id}/approve
     *
     * Business Logic:
     * - If start_date is today (or immediate): Status becomes 'active', end_date is calculated
     * - If start_date is in the future: Status remains 'scheduled', end_date stays null
     */
    public function approve(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Unauthorized'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'opening_price' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $auction = Auction::with('car.user')->findOrFail($id);
            $car = $auction->car;

            if (!$car) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'السيارة غير موجودة'
                ], 404);
            }

            $ksaTimezone = 'Asia/Riyadh';
            $today = Carbon::now($ksaTimezone)->toDateString();
            $startDate = $auction->start_time ? Carbon::parse($auction->start_time)->toDateString() : $today;
            $durationDays = (int) ($car->main_auction_duration ?: 10);

            // Set opening price and mark as control room approved
            $auction->opening_price = $request->opening_price;
            $auction->control_room_approved = true;

            if ($startDate <= $today) {
                // Immediate activation: start date is today or in the past
                $activationTime = Carbon::now($ksaTimezone);

                // If it's before 7 PM, set activation to 7 PM today
                // If it's after 7 PM, activate immediately
                if ($activationTime->hour < 19) {
                    $activationTime->setTime(19, 0, 0);
                }

                $endTime = $activationTime->copy()->addDays($durationDays);

                $auction->status = AuctionStatus::ACTIVE;
                $auction->start_time = $activationTime;
                $auction->end_time = $endTime;
                $auction->auction_type = AuctionType::LIVE_INSTANT;

                // Update car status to in_auction
                $car->auction_status = 'in_auction';
                $car->save();

                $message = 'تمت الموافقة على المزاد وتفعيله مباشرة';

                Log::info('Auction approved and activated immediately', [
                    'auction_id' => $id,
                    'admin_id'   => $user->id,
                    'start_time' => $activationTime->toDateTimeString(),
                    'end_time'   => $endTime->toDateTimeString(),
                    'duration_days' => $durationDays,
                ]);
            } else {
                // Future date: keep as scheduled, cron will activate it
                $auction->status = AuctionStatus::SCHEDULED;
                // end_time remains null - will be calculated by cron on activation day

                // Update car status to scheduled
                $car->auction_status = 'scheduled';
                $car->save();

                $message = 'تمت الموافقة على المزاد - سيتم تفعيله في ' . Carbon::parse($auction->start_time)->format('Y-m-d') . ' الساعة 7 مساءً';

                Log::info('Auction approved and scheduled for future', [
                    'auction_id' => $id,
                    'admin_id'   => $user->id,
                    'scheduled_start' => $auction->start_time,
                    'duration_days' => $durationDays,
                ]);
            }

            $auction->save();

            // Notify car owner
            if ($car->user) {
                try {
                    $car->user->notify(new CarApprovedForLiveNotification($auction));
                } catch (\Exception $e) {
                    Log::warning('Failed to send approval notification', ['error' => $e->getMessage()]);
                }
            }

            DB::commit();

            // Clear cache
            Cache::forget('admin_dashboard_stats');
            Cache::forget('admin_auction_stats');

            return response()->json([
                'status'  => 'success',
                'message' => $message,
                'data'    => $auction->fresh(['car']),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Auction approval failed', ['error' => $e->getMessage(), 'auction_id' => $id]);

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء الموافقة على المزاد'
            ], 500);
        }
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
    /**
     * Bulk Approve or Reject Auctions (Admin).
     *
     * Logic Enhancements:
     * - Status Sync: Updates car->auction_status.
     * - Scheduling: Checks pre-stored start_time.
     *   - Today/Past: ACTIVE, set start to 7PM (if early), calc end_time.
     *   - Future: SCHEDULED, end_time null.
     */
    public function approveRejectAuctionBulk(Request $request)
    {
        $user = Auth::user();

        if (!$user || !$user->isAdmin()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'You are not authorized to perform this action'
            ], 403);
        }

        $request->validate([
            'action' => ['required'], // true/false
            'ids'    => ['required', 'array', 'min:1'],
            'ids.*'  => ['integer'],
            'price'  => ['nullable', 'numeric', 'min:0'],
        ]);

        $approve = filter_var($request->action, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        if ($approve === null) {
            return response()->json(['status' => 'error', 'message' => 'Invalid action value'], 422);
        }

        $ids = array_unique($request->ids);
        $tracking = [];
        $nowRiyadh = Carbon::now('Asia/Riyadh');

        DB::beginTransaction();
        try {
            foreach ($ids as $id) {
                $car = Car::whereKey($id)->lockForUpdate()->first();

                if (!$car) {
                    $tracking[] = ['id' => $id, 'outcome' => 'error', 'message' => 'Car not found'];
                    continue;
                }

                try {
                    if ($approve === true) {
                        // --- APPROVE LOGIC ---
                        if ($car->auction_status === 'available' || $car->auction_status === 'pending') {
                            // Allow 'available' or 'pending' (dealer upload usually pending approval)

                            // Apply evaluation price if provided
                            if ($request->has('price') && $request->price) {
                                $car->evaluation_price = $request->price;
                            }

                            // Determine start time (Pre-stored or Default to Now)
                            $storedStartTime = $car->start_time ? Carbon::parse($car->start_time, 'Asia/Riyadh') : $nowRiyadh->copy();
                            $storedStartDate = $storedStartTime->toDateString();
                            $todayDate = $nowRiyadh->toDateString();

                            $durationDays = (int) ($car->main_auction_duration ?? 10);
                            $durationDays = $durationDays > 0 ? $durationDays : 10;

                            // Fix: Check for both ACTIVE and SCHEDULED auctions to prevent duplicates
                            $auction = Auction::where('car_id', $car->id)
                                ->whereIn('status', [AuctionStatus::ACTIVE, AuctionStatus::SCHEDULED])
                                ->latest()
                                ->first() ?? new Auction();

                            if (!$auction->exists) {
                                $auction->car_id = $car->id;
                                $auction->starting_bid = $car->starting_bid ?? 0;
                                $auction->current_bid = $car->starting_bid ?? 0;
                                $auction->reserve_price = $car->reserve_price ?? 0;
                                $auction->min_price = $car->min_price ?? 0;
                                $auction->max_price = $car->max_price ?? 0;
                            }

                            // Opening price override
                            if ($request->has('price') && $request->price) {
                                $auction->opening_price = $request->price;
                            } elseif (!$auction->exists) {
                                $auction->opening_price = $car->starting_bid ?? $car->evaluation_price ?? 0;
                            }

                            // --- Scheduling Logic (Page 1 & 2 System) ---
                            if ($storedStartDate <= $todayDate) {
                                // TODAY or PAST -> LIVE
                                $activationTime = $nowRiyadh->copy();
                                // Adjust to 7:00 PM if before 7:00 PM
                                if ($activationTime->hour < 19) {
                                    $activationTime->setTime(19, 0, 0);
                                }

                                $auction->start_time = $activationTime;
                                $auction->end_time = $activationTime->copy()->addDays($durationDays);
                                $auction->status = AuctionStatus::ACTIVE;
                                $car->auction_status = 'in_auction'; // Sync: Live -> in_auction

                                $messageCode = 'approved_live';
                            } else {
                                // FUTURE -> SCHEDULED
                                $auction->start_time = $storedStartTime;
                                $auction->end_time = null; // Do not calculate yet
                                $auction->status = AuctionStatus::SCHEDULED;
                                $car->auction_status = 'scheduled'; // Sync: Scheduled -> scheduled

                                $messageCode = 'approved_scheduled';
                            }

                            $auction->save();
                            $car->save();

                            // Notify Owner
                            $this->notifyOwnerIfPossible($car, $auction);

                            $tracking[] = [
                                'id' => $car->id,
                                'outcome' => 'approved',
                                'code' => $messageCode,
                                'auction_status_after' => $car->auction_status
                            ];
                        } else {
                            $tracking[] = ['id' => $car->id, 'outcome' => 'skipped', 'message' => 'Car not available for approval'];
                        }
                    } else {
                        // --- REJECT LOGIC ---
                        // Reject if not already approved/sold
                        if ($car->auction_status !== 'sold' && $car->auction_status !== 'in_auction') {
                            $car->auction_status = 'rejected'; // Sync: Rejected
                            $car->save();

                            $tracking[] = ['id' => $car->id, 'outcome' => 'rejected', 'code' => 'rejected'];
                        } else {
                            $tracking[] = ['id' => $car->id, 'outcome' => 'skipped', 'message' => 'Cannot reject active/sold car'];
                        }
                    }
                } catch (\Throwable $e) {
                    $tracking[] = ['id' => $car->id, 'outcome' => 'error', 'message' => $e->getMessage()];
                }
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => 'Bulk operation failed', 'error' => $e->getMessage()], 500);
        }

        // Summary
        $summary = ['approved' => 0, 'rejected' => 0, 'skipped' => 0, 'errors' => 0];
        foreach ($tracking as $t) {
            if (isset($t['outcome']) && isset($summary[$t['outcome']])) {
                $summary[$t['outcome']]++;
            }
        }

        return response()->json([
            'status'   => 'success',
            'message'  => $approve ? 'Processed approval batch' : 'Processed rejection batch',
            'summary'  => $summary,
            'tracking' => $tracking,
        ]);
    }

    /**
     * Bulk Move Auctions between statuses/types (Admin).
     * 
     * Logic Enhancements:
     * - Update auction_type.
     * - Recalculate end_time.
     */
    public function moveBetweenAuctionsBulk(Request $request)
    {
        $user = Auth::user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'ids'           => ['required', 'array', 'min:1'],
            'ids.*'         => ['integer'],
            'status'        => ['required', 'string', 'in:active,instant,late,live,pending'],
            'duration_days' => ['nullable', 'integer', Rule::in([10, 20, 30])],
            'session_id'    => ['nullable', 'integer', 'exists:auction_sessions,id'],
        ]);

        $targetStatus = $validated['status'];
        $carIds = $validated['ids'];

        // Target Config
        $baseDataByStatus = [
            'active'  => ['status' => AuctionStatus::ACTIVE->value, 'auction_type' => AuctionType::LIVE_INSTANT->value, 'control_room_approved' => true],
            'instant' => ['status' => AuctionStatus::ACTIVE->value, 'auction_type' => AuctionType::LIVE_INSTANT->value, 'control_room_approved' => true],
            'late'    => ['status' => AuctionStatus::ACTIVE->value, 'auction_type' => AuctionType::SILENT_INSTANT->value, 'control_room_approved' => true],
            'live'    => ['status' => AuctionStatus::ACTIVE->value, 'auction_type' => AuctionType::LIVE->value, 'control_room_approved' => true, 'approved_for_live' => false],
            'pending' => ['status' => AuctionStatus::SCHEDULED->value, 'control_room_approved' => false],
        ];

        $targetData = $baseDataByStatus[$targetStatus];
        $nowRiyadh = Carbon::now('Asia/Riyadh');

        $results = [];

        DB::beginTransaction();
        try {
            $cars = Car::whereIn('id', $carIds)->get(); // No lock needed if we assume standard concurrency, or add lockForUpdate()

            foreach ($cars as $car) {
                // Find latest active/scheduled auction
                $auction = Auction::where('car_id', $car->id)
                    ->whereIn('status', [AuctionStatus::ACTIVE->value, AuctionStatus::SCHEDULED->value])
                    ->latest()
                    ->first();

                // Calc Duration & Times
                $durationDays = 10; // Default
                if (in_array($targetStatus, ['instant', 'late'])) {
                    if (!empty($validated['duration_days'])) $durationDays = (int)$validated['duration_days'];
                    elseif (!empty($car->main_auction_duration)) $durationDays = (int)$car->main_auction_duration;

                    $startTime = $nowRiyadh->copy();
                    $endTime = $startTime->copy()->addDays($durationDays);
                } else {
                    // For others, keep existing or car default
                    $startTime = $auction ? $auction->start_time : ($car->start_time ? Carbon::parse($car->start_time, 'Asia/Riyadh') : $nowRiyadh->copy());
                    // If moving to Live, generally implies specific schedule, but here we might just not touch time unless session implied?
                    // Leaving unchanged if not instant/late, per Logic C focus.
                    $endTime = $auction ? $auction->end_time : null;
                }

                if ($auction) {
                    // Update existing
                    $auction->fill($targetData);

                    // Logic C: Recalculate end_time if moving to instant/late
                    if (in_array($targetStatus, ['instant', 'late'])) {
                        $auction->start_time = $startTime;
                        $auction->end_time = $endTime;
                    }
                    if ($targetStatus === 'live' && $request->has('session_id')) {
                        $auction->session_id = $request->session_id;
                    }
                    $auction->save();
                } else {
                    // Create new
                    // Construct new auction...
                    // (Simplified for bulk move - usually assumes auction exists, but handle missing)
                    if ($targetStatus === 'pending') {
                        // Skip creation if pending? Or creating a scheduled one?
                        // Assuming we only move existing auctions mostly. But let's create if missing.
                        $auction = new Auction();
                        $auction->car_id = $car->id;
                        $auction->start_time = $startTime;
                        $auction->end_time = $endTime;
                        $auction->fill($targetData);
                        // defaults
                        $auction->starting_bid = $car->starting_bid ?? 0;
                        $auction->min_price = $car->min_price ?? 0;
                        $auction->max_price = $car->max_price ?? 0;
                        $auction->save();
                    }
                }

                if ($auction) {
                    // Sync Car Status
                    $this->syncCarStatus($auction);

                    // Notification
                    try {
                        if ($car->user) {
                            $car->user->notify(new CarMovedToAuctionNotification($car, $auction, $targetStatus));
                        }
                        event(new CarMovedBetweenAuctionsEvent($auction, $targetStatus, $car));
                    } catch (\Exception $e) { /* ignore */
                    }

                    $results[] = ['car_id' => $car->id, 'status' => 'updated'];
                }
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => 'Move failed', 'error' => $e->getMessage()], 500);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Auctions moved successfully',
            'data' => $results
        ]);
    }

    /**
     * Notify owner helper.
     */
    protected function notifyOwnerIfPossible(Car $car, ?Auction $auction = null): void
    {
        try {
            $owner = $car->user; // User relation is standard now
            if ($owner) {
                $owner->notify(new CarApprovedForAuctionNotification($car, $auction ?? $car->activeAuction));
            }
        } catch (\Throwable $e) {
            Log::warning('Notification failed', ['error' => $e->getMessage()]);
        }
    }
}

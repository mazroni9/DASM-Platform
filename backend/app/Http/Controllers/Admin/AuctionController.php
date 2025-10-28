<?php

namespace App\Http\Controllers\Admin;

use App\Models\Auction;
use App\Enums\AuctionStatus;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;
use App\Models\Car;
use App\Events\CarApprovedForLiveEvent;
use App\Notifications\CarApprovedForLiveNotification;
use App\Events\AuctionStatusChangedEvent;

class AuctionController extends Controller
{
    /**
     * List all auctions
     */
    public function index(Request $request)
    {
        $query = Auction::with(['car.dealer.user']);

        if ($request->has('status') && $request['status'] != null && $request['status'] !== 'all') {
            $query->where('status', $request->status);
        }

        $auctions = $query->orderBy('created_at', 'desc')->paginate(10);

        return response()->json([
            'status' => 'success',
            'data'   => $auctions
        ]);
    }

    /**
     * ✅ Bulk Approve
     * POST /admin/auctions/bulk-approve
     */
    public function bulkApprove(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer|distinct|exists:auctions,id',
            'mode'  => 'nullable|in:schedule,live',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error','errors' => $validator->errors()], 422);
        }

        $mode = $request->input('mode', 'schedule');
        $ids  = $request->input('ids', []);

        if ($mode === 'live') {
            if (count($ids) !== 1) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'للموافقة على البث المباشر، اختر مزادًا واحدًا فقط.'
                ], 422);
            }

            $auction = Auction::with(['session', 'car'])->findOrFail($ids[0]);

            $sessionStatus = $auction->session?->status;
            if ($sessionStatus !== 'active') {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'فقط الجلسات النشطة يمكن الموافقة عليها للمزاد المباشر',
                ], 422);
            }

            $alreadyApproved = Auction::where('approved_for_live', true)
                ->where('id', '!=', $auction->id)
                ->exists();

            if ($alreadyApproved) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'فقط عملية واحدة يمكن الموافقة عليها للمزاد المباشر في وقت واحد',
                ], 422);
            }

            $auction->auction_type      = 'live';
            $auction->approved_for_live = true;
            $auction->control_room_approved = true;
            $auction->save();

            $car = $auction->car;
            if ($car && $car->owner) {
                $car->owner->notify(new CarApprovedForLiveNotification($car, $auction));
            }
            event(new CarApprovedForLiveEvent($auction, $car));

            return response()->json([
                'status'  => 'success',
                'message' => 'تمت الموافقة على المزاد للبث المباشر بنجاح',
                'data'    => $auction
            ]);
        }

        $updated = 0;
        DB::transaction(function () use ($ids, &$updated) {
            $auctions = Auction::whereIn('id', $ids)->get();
            foreach ($auctions as $auction) {
                $auction->status             = AuctionStatus::SCHEDULED;
                $auction->control_room_approved = false;
                $auction->approved_for_live  = false;
                $auction->save();
                $updated++;
            }
        });

        return response()->json([
            'status'  => 'success',
            'message' => "تمت الموافقة على {$updated} من المزادات (جدولة).",
            'count'   => $updated
        ]);
    }

    /**
     * ✅ Bulk Reject
     * POST /admin/auctions/bulk-reject
     */
    public function bulkReject(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'ids'    => 'required|array|min:1',
            'ids.*'  => 'integer|distinct|exists:auctions,id',
            'reason' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error','errors' => $validator->errors()], 422);
        }

        $reason  = $request->input('reason');
        $updated = 0;

        DB::transaction(function () use ($request, $reason, &$updated) {
            $auctions = Auction::whereIn('id', $request->ids)->get();
            foreach ($auctions as $auction) {
                if ((string)$auction->status === (string)AuctionStatus::SCHEDULED) {
                    if ($reason) {
                        $auction->rejection_reason = $reason;
                    }
                    $auction->status = AuctionStatus::FAILED;
                    $auction->approved_for_live = false;
                    $auction->control_room_approved = false;
                    $auction->save();
                    $updated++;
                }
            }
        });

        return response()->json([
            'status'  => 'success',
            'message' => "تم رفض {$updated} مزاد/مزادات بنجاح",
            'count'   => $updated
        ]);
    }

    /**
     * Approve single auction for live (one at a time).
     * POST /admin/auctions/{id}/approve
     */
    public function approve($id)
    {
        $auction = Auction::findOrFail($id);

        if ((string)$auction->status !== (string)AuctionStatus::ACTIVE) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Only LIVE auctions can be approved'
            ], 400);
        }

        $check = Auction::where('approved_for_live', true)->where('id', '!=', $auction->id)->first();
        if ($check) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Only one auction can be approved for live'
            ], 400);
        }

        $auction->control_room_approved = true;
        $auction->auction_type      = 'live';
        $auction->approved_for_live = true;
        $auction->save();

        return response()->json([
            'status'  => 'success',
            'message' => 'Auction approved successfully for live',
            'data'    => $auction
        ]);
    }

    /**
     * Reject single auction
     * POST /admin/auctions/{id}/reject
     */
    public function reject($id, Request $request)
    {
        $auction = Auction::findOrFail($id);

        if ((string)$auction->status !== (string)AuctionStatus::SCHEDULED) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Only scheduled auctions can be rejected'
            ], 400);
        }

        if ($request->filled('reason')) {
            $auction->rejection_reason = $request->reason;
        }

        $auction->status = AuctionStatus::FAILED;
        $auction->approved_for_live = false;
        $auction->control_room_approved = false;
        $auction->save();

        return response()->json([
            'status'  => 'success',
            'message' => 'Auction rejected successfully',
            'data'    => $auction
        ]);
    }

    /**
     * Update auction status (admin only)
     * PUT /admin/auctions/{id}/status
     */
    public function updateStatus($id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:live,ended,completed,cancelled,failed',
        ]);
        if ($validator->fails()) {
            return response()->json(['status' => 'error','errors' => $validator->errors()], 422);
        }

        $auction   = Auction::findOrFail($id);
        $oldStatus = $auction->status;
        $newStatus = $request->status;

        $auction->approved_for_live = false;

        if ($request->status === 'live' && !$auction->control_room_approved) {
            $auction->control_room_approved = true;
        }
        $auction->status = $newStatus;
        $auction->save();

        if ($auction->car) {
            if ($newStatus === 'live') {
                $auction->car->auction_status = 'in_auction';
            } elseif ($newStatus === 'completed') {
                $auction->car->auction_status = 'sold';
            } elseif (in_array($newStatus, ['ended', 'cancelled', 'failed'])) {
                $auction->car->auction_status = 'available';
            }
            $auction->car->save();
        }

        if ($oldStatus !== $newStatus) {
            event(new AuctionStatusChangedEvent($auction, $oldStatus, $newStatus, $auction->car));
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Auction status updated successfully',
            'data'    => $auction
        ]);
    }

    /**
     * Update auction type / live approval
     * PUT /admin/auctions/{id}/auction-type
     */
    public function updateType($id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'auction_type'      => 'required|in:live',
            'approved_for_live' => 'required|boolean',
        ]);
        if ($validator->fails()) {
            return response()->json(['status' => 'error','errors' => $validator->errors()], 422);
        }

        $auction = Auction::findOrFail($id);
        $sessionStatus = $auction->session?->status;
        if ($sessionStatus !== 'active') {
            return response()->json([
                'status'  => 'error',
                'message' => 'فقط الجلسات النشطة يمكن الموافقة عليها للمزاد المباشر',
            ], 422);
        }

        $isApproved = $request->approved_for_live;
        if ($isApproved) {
            $count = Auction::where("approved_for_live", true)->where('id', '!=', $auction->id)->count();
            if ($count > 0) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'فقط عملية واحدة يمكن الموافقة عليها للمزاد المباشر في وقت واحد',
                ], 422);
            }
        }

        $auction->auction_type      = $request->auction_type;
        $auction->approved_for_live = $request->approved_for_live;
        $auction->save();

        $car = $auction->car;
        if ($request->approved_for_live && $car && $car->owner) {
            $car->owner->notify(new CarApprovedForLiveNotification($car, $auction));
        }
        event(new CarApprovedForLiveEvent($auction, $car));
        Cache::flush();
        return response()->json([
            'status'  => 'success',
            'message' => 'Auction status updated successfully',
            'data'    => $auction
        ]);
    }

    /**
     * Get a specific auction by ID (admin view)
     */
    public function show($id)
    {
        $auction = Auction::with(['car', 'bids.user', 'liveStreamingSession'])->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data'   => $auction
        ]);
    }

    /**
     * Update auction details (admin only)
     */
    public function update($id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'start_time'           => 'required|date',
            'end_time'             => 'required|date|after:start_time',
            'minimum_bid'          => 'required|numeric|min:0',
            'maximum_bid'          => 'nullable|numeric|min:0',
            'reserve_price'        => 'required|numeric|min:0',
            'opening_price'        => 'nullable|numeric|min:0',
            'status'               => 'required|string|in:scheduled,active,ended,completed,cancelled,failed',
            'auction_type'         => 'required|string|in:live,live_instant,silent_instant',
            'control_room_approved'=> 'required|boolean',
            'approved_for_live'    => 'required|boolean',
        ]);
        if ($validator->fails()) {
            return response()->json(['status' => 'error','errors' => $validator->errors()], 422);
        }

        $auction = Auction::findOrFail($id);

        $auction->start_time            = $request->start_time;
        $auction->end_time              = $request->end_time;
        $auction->minimum_bid           = $request->minimum_bid;
        $auction->maximum_bid           = $request->maximum_bid;
        $auction->reserve_price         = $request->reserve_price;
        $auction->opening_price         = $request->opening_price;
        $auction->status                = $request->status;
        $auction->auction_type          = $request->auction_type;
        $auction->control_room_approved = $request->control_room_approved;
        $auction->approved_for_live     = $request->approved_for_live;
        $auction->save();

        if ($auction->car) {
            if ($auction->status === 'active') {
                $auction->car->auction_status = 'in_auction';
            } elseif ($auction->status === 'completed') {
                $auction->car->auction_status = 'sold';
            } elseif (in_array($auction->status, ['ended', 'cancelled', 'failed'])) {
                $auction->car->auction_status = 'available';
            }
            $auction->car->save();
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Auction updated successfully',
            'data'    => $auction
        ]);
    }

    /**
     * Set opening price (admin only)
     */
    public function setOpeningPrice($id, Request $request)
    {
        $user = auth()->user();
        if (!$user->isAdmin()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'لا يمكن تعديل بيانات '
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'price' => 'required|numeric'
        ]);
        if ($validator->fails()) {
            return response()->json(['status' => 'error','errors' => $validator->errors()], 422);
        }

        $price   = $request->price;
        $auction = Auction::findOrFail($id);
        $car     = Car::findOrFail($auction->car_id);

        $auction->minimum_bid   = $price;
        $auction->opening_price = $price;
        $auction->save();

        $car->evaluation_price = $price;
        $car->save();

        return response()->json([
            'status'  => 'success',
            'message' => 'Auction updated successfully',
            'id'      => $id,
            'price'   => $price
        ]);
    }
}

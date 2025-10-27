<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Dealer;
use App\Models\Auction;
use App\Models\BlogPost;
use App\Models\BlogTag;
use App\Enums\AuctionStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;
use App\Models\Car;
use App\Events\CarApprovedForLiveEvent;
use App\Notifications\CarApprovedForLiveNotification;
use App\Events\AuctionStatusChangedEvent;
use App\Models\AuctionSession;
use Illuminate\Http\JsonResponse;

class AdminController extends Controller
{
    /**
     * List all auctions
     */
    public function auctions(Request $request)
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
     *
     * يدعم وضعين:
     * - mode=schedule (الافتراضي): يحوّل المزادات للحالة SCHEDULED
     * - mode=live: يوافق على مزاد واحد للبث المباشر (قيّد: مزاد واحد فقط في نفس الوقت)
     *
     * Body مثال:
     * { "ids": [1,2,3], "mode": "schedule" }
     * أو:
     * { "ids": [15], "mode": "live" }
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
            // قيّد: لازم مزاد واحد فقط
            if (count($ids) !== 1) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'للموافقة على البث المباشر، اختر مزادًا واحدًا فقط.'
                ], 422);
            }

            $auction = Auction::with(['session', 'car'])->findOrFail($ids[0]);

            // لازم تكون الجلسة نشطة (نفس شرط updateAuctionType)
            $sessionStatus = $auction->session?->status;
            if ($sessionStatus !== 'active') {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'فقط الجلسات النشطة يمكن الموافقة عليها للمزاد المباشر',
                ], 422);
            }

            // لا يوجد مزاد آخر approved_for_live
            $alreadyApproved = Auction::where('approved_for_live', true)
                ->where('id', '!=', $auction->id)
                ->exists();

            if ($alreadyApproved) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'فقط عملية واحدة يمكن الموافقة عليها للمزاد المباشر في وقت واحد',
                ], 422);
            }

            // حدّث نوع المزاد والعلامة (مش بنغيّر الحالة هنا للحفاظ على منطقك الحالي)
            $auction->auction_type      = 'live';
            $auction->approved_for_live = true;
            // ممكن نسهّل على غرفة التحكم:
            $auction->control_room_approved = true;
            $auction->save();

            // إشعار وحدث
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

        // mode = schedule
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
     *
     * Body:
     * { "ids": [1,2,3], "reason": "غير مطابق للشروط" }
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
                // نفس منطق الرفض الفردي: نعتبر المجدول فقط قابل للرفض
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
    public function approveAuction($id)
    {
        $auction = Auction::findOrFail($id);

        // حسب منطقك الحالي: لازم يكون ACTIVE (live)
        if ((string)$auction->status !== (string)AuctionStatus::ACTIVE) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Only LIVE auctions can be approved'
            ], 400);
        }

        // تأكد مفيش غيره موافَق عليه
        $check = Auction::where('approved_for_live', true)->where('id', '!=', $auction->id)->first();
        if ($check) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Only one auction can be approved for live'
            ], 400);
        }

        $auction->control_room_approved = true;
        // ✅ كان هنا خطأ: كان بيحط enum status في auction_type
        // نخلي نوع المزاد (لو مطلوب) live، لكن الأهم علامة الموافقة:
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
    public function rejectAuction($id, Request $request)
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
     * Close / cancel / complete single auction (admin action)
     */
    public function endAuction($id, Request $request)
    {
        $auction = Auction::findOrFail($id);

        if ((string)$auction->status === (string)AuctionStatus::SCHEDULED) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Only other types of auctions can be ended'
            ], 400);
        }

        if ($request->status === 'ended') {
            $auction->status = 'ended';
        } elseif ($request->status === 'cancelled') {
            $auction->status = 'cancelled';
        } elseif ($request->status === 'completed') {
            $auction->status = 'completed';
        }
        $auction->save();

        return response()->json([
            'status'  => 'success',
            'message' => 'Auction processed successfully',
            'data'    => $auction
        ]);
    }

    /**
     * Blogs list (with filters)
     */
    public function blogs(Request $request)
    {
        $query = BlogPost::with(['user:id,first_name,last_name', 'tags']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('tag')) {
            $query->whereHas('tags', fn($q) => $q->where('name', $request->tag));
        }
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%");
            });
        }

        $blogs = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json([
            'status' => 'success',
            'data'   => $blogs
        ]);
    }

    /**
     * Publish or unpublish a blog post
     */
    public function toggleBlogStatus($id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:published,draft',
        ]);
        if ($validator->fails()) {
            return response()->json(['status' => 'error','errors' => $validator->errors()], 422);
        }

        $blog = BlogPost::findOrFail($id);
        $blog->status = $request->status;
        $blog->save();

        return response()->json([
            'status'  => 'success',
            'message' => 'Blog status updated successfully',
            'data'    => $blog
        ]);
    }

    /**
     * Manage blog tags
     */
    public function manageTags(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'action' => 'required|in:create,update,delete',
            'id'     => 'required_if:action,update,delete|integer',
            'name'   => 'required_if:action,create,update|string|max:50',
        ]);
        if ($validator->fails()) {
            return response()->json(['status' => 'error','errors' => $validator->errors()], 422);
        }

        switch ($request->action) {
            case 'create':
                $tag = BlogTag::create(['name' => $request->name]);
                $message = 'Tag created successfully';
                break;
            case 'update':
                $tag = BlogTag::findOrFail($request->id);
                $tag->name = $request->name;
                $tag->save();
                $message = 'Tag updated successfully';
                break;
            case 'delete':
                $tag = BlogTag::findOrFail($request->id);
                $tag->delete();
                $message = 'Tag deleted successfully';
                break;
        }

        return response()->json([
            'status'  => 'success',
            'message' => $message,
            'data'    => $tag ?? null
        ]);
    }

    /**
     * Admin dashboard stats
     */
    public function dashboard()
    {
        $totalUsers        = User::count();
        $pendingUsers      = User::where('status', 'pending')->count();
        $dealerCount       = Dealer::count();
        $regularUserCount  = $totalUsers - $dealerCount;

        $totalAuctions     = Auction::count();
        $activeAuctions    = Auction::where('status', AuctionStatus::ACTIVE)->count();
        $completedAuctions = Auction::where('status', AuctionStatus::ENDED)->count();
        $pendingAuctions   = Auction::where('status', AuctionStatus::SCHEDULED)->count();

        $pendingVerifications = Dealer::where('status', 'pending')->count();

        $totalBlogs     = BlogPost::count();
        $publishedBlogs = BlogPost::where('status', 'published')->count();
        $draftBlogs     = BlogPost::where('status', 'draft')->count();

        $popularBlogs = BlogPost::orderBy('views', 'desc')->take(5)->get(['id', 'title', 'slug', 'views']);

        $recentAuctions = Auction::with(['car:id,make,model,year'])
            ->orderBy('created_at', 'desc')->take(5)->get();

        $recentUsers = User::orderBy('created_at', 'desc')
            ->take(5)->get(['id', 'first_name', 'last_name', 'email', 'created_at','is_active', 'status']);

        return response()->json([
            'status' => 'success',
            'data'   => [
                'total_users'         => $totalUsers,
                'dealers_count'       => $dealerCount,
                'regular_users_count' => $regularUserCount,
                'total_auctions'      => $totalAuctions,
                'active_auctions'     => $activeAuctions,
                'completed_auctions'  => $completedAuctions,
                'pending_auctions'    => $pendingAuctions,
                'pending_verifications'=> $pendingVerifications,
                'pending_users'       => $pendingUsers,
                'total_blogs'         => $totalBlogs,
                'published_blogs'     => $publishedBlogs,
                'draft_blogs'         => $draftBlogs,
                'popular_blogs'       => $popularBlogs,
                'recent_auctions'     => $recentAuctions,
                'recent_users'        => $recentUsers
            ]
        ]);
    }

    /**
     * Update auction status (admin only)
     * PUT /admin/auctions/{id}/status
     */
    public function updateAuctionStatus($id, Request $request)
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

        // reset live approval flags عند تغيير الحالة
        $auction->approved_for_live = false;

        if ($request->status === 'live' && !$auction->control_room_approved) {
            $auction->control_room_approved = true;
        }
        $auction->status = $newStatus;
        $auction->save();

        // Update car status if needed
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
    public function updateAuctionType($id, Request $request)
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
     * Tags list
     */
    public function getBlogTags()
    {
        $tags = BlogTag::all();
        return response()->json(['status' => 'success','data' => $tags]);
    }

    /**
     * Transactions list
     */
    public function getTransactions(Request $request)
    {
        $query = \App\Models\Transaction::with(['user', 'auction']);
        if ($request->has('status')) $query->where('status', $request->status);
        if ($request->has('type'))   $query->where('type', $request->type);

        $transactions = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json(['status' => 'success','data' => $transactions]);
    }

    /**
     * Settlements list
     */
    public function getSettlements(Request $request)
    {
        $query = \App\Models\Settlement::with(['dealer.user', 'auction', 'car']);
        if ($request->has('status')) $query->where('status', $request->status);

        $settlements = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json(['status' => 'success','data' => $settlements]);
    }

    /**
     * Get a specific auction by ID (admin view)
     */
    public function getAuction($id)
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
    public function updateAuction($id, Request $request)
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

    /**
     * Sessions — active & scheduled
     */
    public function getActiveAndScheduledSessions(Request $request): JsonResponse
    {
        $select = ['id', 'name', 'session_date', 'status', 'type', 'created_at', 'updated_at'];

        $q = AuctionSession::query()->select($select)->whereIn('status', ['active', 'scheduled']);

        if ($request->filled('type')) {
            $types = array_filter(explode(',', (string) $request->query('type')));
            $q->whereIn('type', $types);
        }

        if ($request->boolean('with_counts')) {
            $q->withCount('auctions');
        }

        $sessions = $q->orderBy('session_date', 'asc')->get();

        return response()->json([
            'success' => true,
            'data'    => $sessions,
        ]);
    }

    /**
     * Public show session (summary)
     * GET /api/sessions/{id}
     */
    public function showSessionPublic(string $id): JsonResponse
    {
        $select = ['id', 'name', 'session_date', 'status', 'type', 'created_at', 'updated_at'];

        $session = AuctionSession::query()
            ->select($select)
            ->withCount('auctions')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $session,
        ]);
    }
}

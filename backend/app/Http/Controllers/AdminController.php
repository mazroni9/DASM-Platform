<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Dealer;
use App\Models\Auction;
use App\Models\BlogPost;
use App\Models\BlogTag;
use App\Enums\AuctionStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use App\Models\Car;
use App\Events\CarApprovedForLiveEvent;
use App\Notifications\CarApprovedForLiveNotification;
use App\Events\AuctionStatusChangedEvent;
use App\Models\AuctionSession;
use Illuminate\Http\JsonResponse;

use function Psy\debug;

class AdminController extends Controller
{

    /**
     * List all auctions
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function auctions(Request $request)
    {
        $query = Auction::with(['car.dealer.user']);

        // Filter by status
        if ($request->has('status') && $request['status'] !=null) {
            if($request['status'] != 'all'){
                $query->where('status', $request->status);
            }
        }

        $auctions = $query->orderBy('created_at', 'desc')->paginate(10);

        return response()->json([
            'status' => 'success',
            'data' => $auctions
        ]);
    }


       /**
     * Approve an auction
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function approve(request $request)
    {
        $ids = $request->ids;

        foreach($ids as $id) {
            $auction = Auction::findOrFail($id);
            $auction->status = AuctionStatus::SCHEDULED;
            $auction->save();
        }

          return response()->json([
            'status' => 'success',
            'message' => ' all auctions apporved successfully',
        ]);
    }

    /**
     * Approve an auction
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function approveAuction1($id)
    {
        $auction = Auction::findOrFail($id);

        if ($auction->status !== AuctionStatus::SCHEDULED) {
            return response()->json([
                'status' => 'error',
                'message' => 'Only scheduled auctions can be approved'
            ], 400);
        }

        // Set approval flag and update status to active
        $auction->control_room_approved = true;
        $auction->status = AuctionStatus::ACTIVE;
        $auction->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Auction approved successfully',
            'data' => $auction
        ]);
    }




    public function approveAuction($id)
    {
        $auction = Auction::findOrFail($id);

        if ($auction->status !== AuctionStatus::ACTIVE) {
            return response()->json([
                'status' => 'error',
                'message' => 'Only LIVE auctions can be approved'
            ], 400);
        }

        $check=Auction::where('approved_for_live',true)->first();
        if($check){
            return response()->json([
                'status' => 'error',
                'message' => 'Only one auction can be approved for live'
            ], 400);
        }
        // Set approval flag and update status to active
        $auction->control_room_approved = true;
        $auction->auction_type = AuctionStatus::ACTIVE;
        $auction->approved_for_live = true;
        $auction->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Auction approved successfully for live',
        ]);
    }

    /**
     * Reject an auction
     *
     * @param int $id
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function rejectAuction1($id, Request $request)
    {
        $auction = Auction::findOrFail($id);

        if ($auction->status !== AuctionStatus::SCHEDULED) {
            return response()->json([
                'status' => 'error',
                'message' => 'Only scheduled auctions can be rejected'
            ], 400);
        }

        // Set rejection reason if provided
        if ($request->has('reason')) {
            $auction->rejection_reason = $request->reason;
        }

        // Update status to failed
        $auction->status = AuctionStatus::FAILED;
        $auction->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Auction rejected successfully',
            'data' => $auction
        ]);
    }


    public function endAuction($id, Request $request)
    {
        $auction = Auction::findOrFail($id);

        if ($auction->status == AuctionStatus::SCHEDULED) {
            return response()->json([
                'status' => 'error',
                'message' => 'Only other types of auctions can be ended'
            ], 400);
        }

        if($request->status == 'ended'){
            $auction->status = "ended";
        }else if($request->status == 'cancelled'){
            $auction->status = "cancelled";
        }else if($request->status == 'completed'){
            $auction->status = "completed";
        }

        // Update status to failed
        $auction->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Auction processed successfully',
            'data' => $auction
        ]);
    }




    /**
     * List all blog posts (including drafts)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function blogs(Request $request)
    {
        $query = BlogPost::with(['user:id,first_name,last_name', 'tags']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by tag
        if ($request->has('tag')) {
            $query->whereHas('tags', function ($q) use ($request) {
                $q->where('name', $request->tag);
            });
        }

        // Search by title or content
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
            'data' => $blogs
        ]);
    }

    /**
     * Publish or unpublish a blog post
     *
     * @param int $id
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function toggleBlogStatus($id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:published,draft',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $blog = BlogPost::findOrFail($id);
        $blog->status = $request->status;
        $blog->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Blog status updated successfully',
            'data' => $blog
        ]);
    }

    /**
     * Manage blog tags
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function manageTags(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'action' => 'required|in:create,update,delete',
            'id' => 'required_if:action,update,delete|integer',
            'name' => 'required_if:action,create,update|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
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
            'status' => 'success',
            'message' => $message,
            'data' => $tag ?? null
        ]);
    }

    /**
     * Get dashboard statistics for admin
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function dashboard()
    {
        // Count users
        $totalUsers = User::count();
        $pendingUsers = User::where('status', 'pending')->count();
        $dealerCount = Dealer::count();
        $regularUserCount = $totalUsers - $dealerCount;

        // Count auctions
        $totalAuctions = Auction::count();
        $activeAuctions = Auction::where('status', AuctionStatus::ACTIVE)->count();
        $completedAuctions = Auction::where('status', AuctionStatus::ENDED)->count();
        $pendingAuctions = Auction::where('status', AuctionStatus::SCHEDULED)->count();

        // Count verification requests - using status field
        $pendingVerifications = Dealer::where('status', 'pending')->count();

        // Count blogs
        $totalBlogs = BlogPost::count();
        $publishedBlogs = BlogPost::where('status', 'published')->count();
        $draftBlogs = BlogPost::where('status', 'draft')->count();

        // Most viewed blogs
        $popularBlogs = BlogPost::orderBy('views', 'desc')
            ->take(5)
            ->get(['id', 'title', 'slug', 'views']);

        // Recent auctions
        $recentAuctions = Auction::with(['car:id,make,model,year'])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // Recent users
        $recentUsers = User::orderBy('created_at', 'desc')
            ->take(5)
            ->get(['id', 'first_name', 'last_name', 'email', 'created_at','is_active', 'status']);

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_users' => $totalUsers,
                'dealers_count' => $dealerCount,
                'regular_users_count' => $regularUserCount,
                'total_auctions' => $totalAuctions,
                'active_auctions' => $activeAuctions,
                'completed_auctions' => $completedAuctions,
                'pending_auctions' => $pendingAuctions,
                'pending_verifications' => $pendingVerifications,
                'pending_users'=> $pendingUsers,
                'total_blogs' => $totalBlogs,
                'published_blogs' => $publishedBlogs,
                'draft_blogs' => $draftBlogs,
                'popular_blogs' => $popularBlogs,
                'recent_auctions' => $recentAuctions,
                'recent_users' => $recentUsers
            ]
        ]);
    }

    /**
     * Update auction status (admin only)
     *
     * @param int $id
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateAuctionStatus($id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:live,ended,completed,cancelled,failed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $auction = Auction::findOrFail($id);

        // Capture old status before making changes
        $oldStatus = $auction->status;
        $newStatus = $request->status;

        $auction->approved_for_live = false;

        if ($request->status === 'live' && !$auction->control_room_approved) {
            $auction->control_room_approved = true;
        }

        $auction->save();

        // Update car status if needed
        if ($auction->car) {
            if ($request->status === 'live') {
                $auction->car->auction_status = 'in_auction';
                $auction->approved_for_live = false;
            } else if ($request->status === 'completed') {
                $auction->car->auction_status = 'sold';
                 $auction->status = "ended";
                $auction->approved_for_live = false;
            } else if (in_array($request->status, ['ended', 'cancelled', 'failed'])) {
                $auction->car->auction_status = 'available';

                $auction->status = "scheduled";
                $auction->approved_for_live = false;
            }
            $auction->save();
            $auction->car->save();
        }
            $auction->save();

        // Broadcast event for real-time updates
        if ($oldStatus !== $newStatus) {
            event(new AuctionStatusChangedEvent($auction, $oldStatus, $newStatus, $auction->car));
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Auction status updated successfully',
            'data' => $auction
        ]);
    }


     /**
     * Update auction status (admin only)
     *
     * @param int $id
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateAuctionType($id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'auction_type' => 'required|in:live',
            'approved_for_live' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }
        $count = Auction::where("approved_for_live",true)->count();

        $auction = Auction::findOrFail($id);
        $sessionStatus=$auction->session?->status;
        if($sessionStatus !== "active"){
            return response()->json([
                'status' => 'error',
                'message' => 'فقط الجلسات النشطة يمكن الموافقة عليها للمزاد المباشر',
            ], 422);
        }
        $isApproved=$request->approved_for_live;

        if($isApproved && $count > 0){
            return response()->json([
                'status' => 'error',
                'message' => 'فقط عملية واحدة يمكن الموافقة عليها للمزاد المباشر في وقت واحد',
            ], 422);
        }

        // Update auction type (if needed
        $auction->auction_type = $request->auction_type;
        $auction->approved_for_live = $request->approved_for_live;
        $auction->save();

        // Send notification and event when car is approved for live
        $car = $auction->car;
        if ($request->approved_for_live) {
            // Send notification to car owner
            $carOwner = $car->owner;
            if ($carOwner) {
                $carOwner->notify(new CarApprovedForLiveNotification($car, $auction));
            }

            // Broadcast event for real-time updates
        }
        event(new CarApprovedForLiveEvent($auction, $car));
        Cache::flush();
        return response()->json([
            'status' => 'success',
            'message' => 'Auction status updated successfully',
            'data' => $auction
        ]);
    }

    /**
     * Get list of blog tags
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getBlogTags()
    {
        $tags = BlogTag::all();

        return response()->json([
            'status' => 'success',
            'data' => $tags
        ]);
    }

    /**
     * Get transactions list
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getTransactions(Request $request)
    {
        $query = \App\Models\Transaction::with(['user', 'auction']);

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by type if provided
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $transactions = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json([
            'status' => 'success',
            'data' => $transactions
        ]);
    }

    /**
     * Get settlements list
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSettlements(Request $request)
    {
        $query = \App\Models\Settlement::with(['dealer.user', 'auction', 'car']);

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $settlements = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json([
            'status' => 'success',
            'data' => $settlements
        ]);
    }

    /**
     * Get all cars (admin view)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAllCars(Request $request)
    {
        // Admin can see all cars with filtering options
        $query = Car::with(['dealer.user','auctions']);

        // Filter by status if provided
        if ($request->has('status')  &&  $request['status'] != null) {
            $query->where('auction_status', $request->status);
        }

        // Filter by dealer
        if ($request->has('dealer_id') &&  $request['dealer_id'] != null) {
            $query->where('dealer_id', $request->dealer_id);
        }

        // Search by make/model
        if ($request->has('search') &&  $request['search'] != null) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('make', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%")
                  ->orWhere('vin', 'like', "%{$search}%");
            });
        }

        $cars = $query->orderBy('created_at', 'desc')->paginate(10);

        return response()->json([
            'status' => 'success',
            'data' => $cars,

        ]);
    }

    /**
     * Update car status (admin only)
     *
     * @param int $id
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateCarStatus($id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:available,in_auction,sold',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $car = \App\Models\Car::findOrFail($id);
        $car->auction_status = $request->status;

        // If changing to in_auction, check if there's an active auction and create one if not
        if ($request->status === 'in_auction') {
            $activeAuction = $car->auctions()->where('status', 'active')->first();
            if (!$activeAuction) {
                // Check for scheduled auction that could be activated
                $scheduledAuction = $car->auctions()->where('status', 'scheduled')->first();
                if ($scheduledAuction) {
                    $scheduledAuction->status = 'active';
                    $scheduledAuction->control_room_approved = true;
                    $scheduledAuction->save();
                }
            }
        }

        // If changing to available, cancel any active auctions
        if ($request->status === 'available') {
            $activeAuctions = $car->auctions()->whereIn('status', ['active', 'scheduled'])->get();
            foreach ($activeAuctions as $auction) {
                $auction->status = 'cancelled';
                $auction->save();
            }
        }

        $car->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Car status updated successfully',
            'data' => $car
        ]);
    }

    /**
     * Delete a car (admin only)
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteCar($id)
    {
        $car = \App\Models\Car::findOrFail($id);

        // Check for any active auctions
        $hasActiveAuctions = $car->auctions()->where('status', 'active')->exists();
        if ($hasActiveAuctions) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot delete car with active auctions. Please cancel the auctions first.'
            ], 400);
        }

        // Cancel any scheduled auctions
        $scheduledAuctions = $car->auctions()->where('status', 'scheduled')->get();
        foreach ($scheduledAuctions as $auction) {
            $auction->status = 'cancelled';
            $auction->save();
        }

        // Delete the car
        $car->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Car deleted successfully'
        ]);
    }

    /**
     * Get a specific auction by ID (admin view)
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAuction($id)
    {
        $auction = Auction::with(['car', 'bids.user', 'liveStreamingSession'])
            ->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $auction
        ]);
    }

    /**
     * Update auction details (admin only)
     *
     * @param int $id
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateAuction($id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'minimum_bid' => 'required|numeric|min:0',
            'maximum_bid' => 'nullable|numeric|min:0',
            'reserve_price' => 'required|numeric|min:0',
            'opening_price' => 'nullable|numeric|min:0',
            'status' => 'required|string|in:scheduled,active,ended,completed,cancelled,failed',
            'auction_type' => 'required|string|in:live,live_instant,silent_instant',
            'control_room_approved' => 'required|boolean',
            'approved_for_live' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $auction = Auction::findOrFail($id);

        // Update auction details
        $auction->start_time = $request->start_time;
        $auction->end_time = $request->end_time;
        $auction->minimum_bid = $request->minimum_bid;
        $auction->maximum_bid = $request->maximum_bid;
        $auction->reserve_price = $request->reserve_price;
        $auction->opening_price = $request->opening_price;
        $auction->status = $request->status;
        $auction->auction_type = $request->auction_type;
        $auction->control_room_approved = $request->control_room_approved;
        $auction->approved_for_live = $request->approved_for_live;

        $auction->save();

        // Update car status based on auction status
        if ($auction->car) {
            if ($auction->status === 'active') {
                $auction->car->auction_status = 'in_auction';
            } else if ($auction->status === 'completed') {
                $auction->car->auction_status = 'sold';
            } else if (in_array($auction->status, ['ended', 'cancelled', 'failed'])) {
                $auction->car->auction_status = 'available';
            }

            $auction->car->save();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Auction updated successfully',
            'data' => $auction
        ]);
    }




    public function setOpeningPrice($id,Request $request)
    {
        $user = auth()->user();

        if (!$user->isAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'لا يمكن تعديل بيانات '
            ], 403);
        }

      $validator = Validator::make($request->all(), [
            'price' => 'required|numeric'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }
        $price=$request->price;
        $auction = Auction::findOrFail($id);
        $car = Car::findOrFail($auction->car_id);
        $auction->minimum_bid = $price;
        $auction->opening_price = $price;
        $car->evaluation_price = $price;
        $auction->save();

        $car->save();
        return response()->json([
            'status' => 'success',
            'message' => 'Auction updated successfully',
            'id'=>$id,
            'price'=>$price
        ]);
    }


    /**
     * Update car details (admin only)
     *
     * @param int $id
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateCar($id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'make' => 'required|string|max:50',
            'model' => 'required|string|max:50',
            'year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
            'vin' => 'required|string|max:17|unique:cars,vin,' . $id,
            'odometer' => 'required|integer|min:0',
            'condition' => 'required|string|in:excellent,good,fair,poor',
            'evaluation_price' => 'required|numeric|min:0',
            'color' => 'nullable|string|max:30',
            'engine' => 'nullable|string|max:50',
            'transmission' => 'nullable|string|in:automatic,manual,cvt',
            'description' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $car = \App\Models\Car::findOrFail($id);

        // Check if the car has an active auction before allowing changes
        $hasActiveAuctions = $car->auctions()->where('status', 'active')->exists();
        if ($hasActiveAuctions && $request->auction_status !== 'in_auction') {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot update car with active auctions except for status changes.'
            ], 400);
        }

        // Update car details
        $car->make = $request->make;
        $car->model = $request->model;
        $car->year = $request->year;
        $car->vin = $request->vin;
        $car->odometer = $request->odometer;
        $car->condition = $request->condition;
        $car->evaluation_price = $request->evaluation_price;
        $car->color = $request->color;
        $car->engine = $request->engine;
        $car->transmission = $request->transmission;
        $car->description = $request->description;

        $car->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Car updated successfully',
            'data' => $car
        ]);
    }


     public function getActiveAndScheduledSessions(Request $request): JsonResponse
    {
        $select = ['id', 'name', 'session_date', 'status', 'type', 'created_at', 'updated_at'];

        $q = AuctionSession::query()
            ->select($select)
            ->whereIn('status', ['active', 'scheduled']);

        // فلتر اختياري على النوع
        if ($request->filled('type')) {
            $types = array_filter(explode(',', (string) $request->query('type')));
            $q->whereIn('type', $types);
        }

        // إرجاع عدد المزادات لو طلبت
        if ($request->boolean('with_counts')) {
            $q->withCount('auctions');
        }

        $sessions = $q->orderBy('session_date', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $sessions,
        ]);
    }

    /**
     * عرض جلسة واحدة (للواجهة العامة)
     * GET /api/sessions/{id}
     *
     * يرجع الجلسة مع عدّاد المزادات فقط (بدون تفاصيل عميقة).
     */
    public function showSessionPublic(string $id): JsonResponse
    {
        $select = ['id', 'name', 'session_date', 'status', 'type', 'created_at', 'updated_at'];

        $session = AuctionSession::query()
            ->select($select)
            ->withCount('auctions')   // يتطلب وجود relation auctions في الموديل
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $session,
        ]);
    }

}

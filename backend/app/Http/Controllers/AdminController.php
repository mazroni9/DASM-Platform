<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Dealer;
use App\Models\Auction;
use App\Models\BlogPost;
use App\Models\BlogTag;
use App\Enums\AuctionStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    /**
     * List all users
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function users(Request $request)
    {
        $query = User::query();
        
        // Filter by role
        if ($request->has('role')) {
            if ($request->role === 'dealer') {
                $query->whereHas('dealer');
            } else if ($request->role === 'user') {
                $query->whereDoesntHave('dealer');
            }
        }
        
        // Search by name or email
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }
        
        $users = $query->with('dealer')->paginate(15);
        
        return response()->json([
            'status' => 'success',
            'data' => $users
        ]);
    }
    
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
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Filter by dealer
        if ($request->has('dealer_id')) {
            $query->whereHas('car', function($q) use ($request) {
                $q->where('dealer_id', $request->dealer_id);
            });
        }
        
        $auctions = $query->orderBy('created_at', 'desc')->paginate(15);
        
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
    public function approveAuction($id)
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

    /**
     * Reject an auction
     *
     * @param int $id
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function rejectAuction($id, Request $request)
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
    
    /**
     * Approve a dealer verification request
     *
     * @param int $userId
     * @return \Illuminate\Http\JsonResponse
     */
    public function approveVerification($userId)
    {
        $user = User::findOrFail($userId);
        $dealer = $user->dealer;
        
        if (!$dealer) {
            return response()->json([
                'status' => 'error',
                'message' => 'User is not a dealer'
            ], 400);
        }
        
        // Update dealer verification status
        $dealer->verification_status = 'approved';
        $dealer->save();
        
        // Update user role if needed
        if ($user->role !== 'dealer') {
            $user->role = 'dealer';
            $user->save();
        }
        
        return response()->json([
            'status' => 'success',
            'message' => 'Dealer verification approved successfully',
            'data' => [
                'user' => $user,
                'dealer' => $dealer
            ]
        ]);
    }
    
    /**
     * Reject a dealer verification request
     *
     * @param int $userId
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function rejectVerification($userId, Request $request)
    {
        $user = User::findOrFail($userId);
        $dealer = $user->dealer;
        
        if (!$dealer) {
            return response()->json([
                'status' => 'error',
                'message' => 'User is not a dealer'
            ], 400);
        }
        
        // Set rejection reason if provided
        if ($request->has('reason')) {
            $dealer->rejection_reason = $request->reason;
        }
        
        // Update verification status
        $dealer->verification_status = 'rejected';
        $dealer->save();
        
        return response()->json([
            'status' => 'success',
            'message' => 'Dealer verification rejected successfully',
            'data' => [
                'user' => $user,
                'dealer' => $dealer
            ]
        ]);
    }

    /**
     * Get pending verifications
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPendingVerifications()
    {
        $pendingDealers = Dealer::where('verification_status', 'pending')
            ->with('user')
            ->get();
            
        return response()->json([
            'status' => 'success',
            'data' => $pendingDealers
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
        $dealerCount = Dealer::count();
        $regularUserCount = $totalUsers - $dealerCount;
        
        // Count auctions
        $totalAuctions = Auction::count();
        $activeAuctions = Auction::where('status', AuctionStatus::ACTIVE)->count();
        $completedAuctions = Auction::where('status', AuctionStatus::ENDED)->count();
        $pendingAuctions = Auction::where('status', AuctionStatus::SCHEDULED)->count();
        
        // Count verification requests
        $pendingVerifications = Dealer::where('verification_status', 'pending')->count();
            
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
            ->get(['id', 'first_name', 'last_name', 'email', 'created_at']);
            
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
            'status' => 'required|in:active,ended,completed,cancelled,failed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }
        
        $auction = Auction::findOrFail($id);
        $auction->status = $request->status;
        
        if ($request->status === 'active' && !$auction->control_room_approved) {
            $auction->control_room_approved = true;
        }
        
        $auction->save();
        
        // Update car status if needed
        if ($auction->car) {
            if ($request->status === 'active') {
                $auction->car->auction_status = 'in_auction';
            } else if ($request->status === 'completed') {
                $auction->car->auction_status = 'sold';
            } else if (in_array($request->status, ['ended', 'cancelled', 'failed'])) {
                $auction->car->auction_status = 'available';
            }
            
            $auction->car->save();
        }
        
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
        $query = \App\Models\Car::with(['dealer.user']);
        
        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('auction_status', $request->status);
        }
        
        // Filter by dealer
        if ($request->has('dealer_id')) {
            $query->where('dealer_id', $request->dealer_id);
        }
        
        // Search by make/model
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('make', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%")
                  ->orWhere('vin', 'like', "%{$search}%");
            });
        }
        
        $cars = $query->orderBy('created_at', 'desc')->get();
        
        return response()->json([
            'status' => 'success',
            'data' => $cars
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
}
<?php

namespace App\Http\Controllers;

use App\Models\Car;
use App\Models\User;
use App\Models\Dealer;
use App\Models\Auction;
use App\Models\BlogTag;
use App\Models\BlogPost;
use App\Enums\AuctionStatus;
use Illuminate\Http\Request;
use App\Models\AuctionSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Carbon;

class AdminController extends Controller
{
    /**
     * Blogs list (with filters) - Legacy endpoint
     * ✅ FIX: supports new schema (is_published) and old schema (status) if exists
     */
    public function blogs(Request $request)
    {
        $query = BlogPost::query();

        // علاقات legacy (لو موجودة)
        $with = [];
        if (method_exists(BlogPost::class, 'user')) $with[] = 'user:id,first_name,last_name';
        if (method_exists(BlogPost::class, 'tags')) $with[] = 'tags';
        if (!empty($with)) $query->with($with);

        $hasStatusColumn = Schema::hasColumn('blog_posts', 'status');
        $hasIsPublished  = Schema::hasColumn('blog_posts', 'is_published');

        // فلتر الحالة
        if ($request->has('status')) {
            $status = (string) $request->status;

            if ($hasStatusColumn) {
                $query->where('status', $status);
            } elseif ($hasIsPublished) {
                // map: published/draft -> is_published true/false
                if ($status === 'published') $query->where('is_published', true);
                if ($status === 'draft')     $query->where('is_published', false);
            }
        }

        // فلتر بالـ Tag (لو علاقة tags موجودة)
        if ($request->has('tag') && method_exists(BlogPost::class, 'tags')) {
            $query->whereHas('tags', fn ($q) => $q->where('name', $request->tag));
        }

        // بحث
        if ($request->has('search')) {
            $search = (string) $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%");

                // content موجود في BlogPost v2 عندك، فده آمن
                $q->orWhere('content', 'like', "%{$search}%");
            });
        }

        $blogs = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json([
            'status' => 'success',
            'data'   => $blogs
        ]);
    }

    /**
     * Publish or unpublish a blog post (Legacy endpoint)
     * ✅ FIX: writes to is_published + published_at (and status if exists)
     */
    public function toggleBlogStatus($id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:published,draft',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $blog = BlogPost::findOrFail($id);

        $hasStatusColumn = Schema::hasColumn('blog_posts', 'status');
        $hasIsPublished  = Schema::hasColumn('blog_posts', 'is_published');
        $hasPublishedAt  = Schema::hasColumn('blog_posts', 'published_at');

        $newStatus = (string) $request->status;

        // لو عندك status (نسخة قديمة)
        if ($hasStatusColumn) {
            $blog->status = $newStatus;
        }

        // النسخة الجديدة
        if ($hasIsPublished) {
            $blog->is_published = ($newStatus === 'published');
        }

        if ($hasPublishedAt) {
            if ($newStatus === 'published') {
                // لو مفيش تاريخ نشر حطه الآن
                $blog->published_at = $blog->published_at ?: Carbon::now();
            } else {
                // draft => امسح تاريخ النشر
                $blog->published_at = null;
            }
        }

        $blog->save();

        return response()->json([
            'status'  => 'success',
            'message' => 'Blog status updated successfully',
            'data'    => $blog
        ]);
    }

    /**
     * Manage blog tags (Legacy)
     */
    public function manageTags(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'action' => 'required|in:create,update,delete',
            'id'     => 'required_if:action,update,delete|integer',
            'name'   => 'required_if:action,create,update|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
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
     * ✅ FIX: blog counts use is_published instead of status (and support old status if exists)
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

        // ===== Blogs (FIXED) =====
        $hasStatusColumn = Schema::hasColumn('blog_posts', 'status');
        $hasIsPublished  = Schema::hasColumn('blog_posts', 'is_published');
        $hasViews        = Schema::hasColumn('blog_posts', 'views');

        $totalBlogs = BlogPost::count();

        if ($hasStatusColumn) {
            $publishedBlogs = BlogPost::where('status', 'published')->count();
            $draftBlogs     = BlogPost::where('status', 'draft')->count();
        } elseif ($hasIsPublished) {
            $publishedBlogs = BlogPost::where('is_published', true)->count();
            $draftBlogs     = BlogPost::where('is_published', false)->count();
        } else {
            // fallback آمن لو لا هذا ولا ذاك
            $publishedBlogs = 0;
            $draftBlogs     = 0;
        }

        // popular blogs: لو views مش موجود ما تعملش orderBy عليه
        if ($hasViews) {
            $popularBlogs = BlogPost::orderBy('views', 'desc')
                ->take(5)
                ->get(['id', 'title', 'slug', 'views']);
        } else {
            $popularBlogs = BlogPost::orderBy('created_at', 'desc')
                ->take(5)
                ->get(['id', 'title', 'slug']);
        }

        $recentAuctions = Auction::with(['car:id,make,model,year'])
            ->orderBy('created_at', 'desc')->take(5)->get();

        $recentUsers = User::orderBy('created_at', 'desc')
            ->take(5)->get(['id', 'first_name', 'last_name', 'email', 'created_at', 'is_active', 'status']);

        return response()->json([
            'status' => 'success',
            'data'   => [
                'total_users'          => $totalUsers,
                'dealers_count'        => $dealerCount,
                'regular_users_count'  => $regularUserCount,
                'total_auctions'       => $totalAuctions,
                'active_auctions'      => $activeAuctions,
                'completed_auctions'   => $completedAuctions,
                'pending_auctions'     => $pendingAuctions,
                'pending_verifications'=> $pendingVerifications,
                'pending_users'        => $pendingUsers,

                'total_blogs'          => $totalBlogs,
                'published_blogs'      => $publishedBlogs,
                'draft_blogs'          => $draftBlogs,
                'popular_blogs'        => $popularBlogs,

                'recent_auctions'      => $recentAuctions,
                'recent_users'         => $recentUsers
            ]
        ]);
    }

    /**
     * Tags list (Legacy)
     */
    public function getBlogTags()
    {
        $tags = BlogTag::all();
        return response()->json(['status' => 'success', 'data' => $tags]);
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

        return response()->json(['status' => 'success', 'data' => $transactions]);
    }

    /**
     * Settlements list
     */
    public function getSettlements(Request $request)
    {
        $query = \App\Models\Settlement::with(['dealer.user', 'auction', 'car']);
        if ($request->has('status')) $query->where('status', $request->status);

        $settlements = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json(['status' => 'success', 'data' => $settlements]);
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
            'start_time'            => 'required|date',
            'end_time'              => 'required|date|after:start_time',
            'minimum_bid'           => 'required|numeric|min:0',
            'maximum_bid'           => 'nullable|numeric|min:0',
            'reserve_price'         => 'required|numeric|min:0',
            'opening_price'         => 'nullable|numeric|min:0',
            'status'                => 'required|string|in:scheduled,active,ended,completed,cancelled,failed',
            'auction_type'          => 'required|string|in:live,live_instant,silent_instant',
            'control_room_approved' => 'required|boolean',
            'approved_for_live'     => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
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

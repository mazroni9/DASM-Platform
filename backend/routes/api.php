<?php

use App\Events\MyEvent;
use Carbon\Carbon;
use App\Models\Car;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Events\PublicMessageEvent;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BidController;
use App\Http\Controllers\CarController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\VenueController;
use App\Notifications\NewBidNotification;
use App\Http\Controllers\DealerController;
use App\Http\Controllers\WalletController;
use App\Http\Controllers\AuctionController;
use App\Http\Controllers\AutoBidController;
use App\Http\Controllers\BroadcastController;
use App\Http\Controllers\Admin\ModeratorController as AdminModeratorController;
use App\Http\Controllers\ModeratorController;
use App\Http\Controllers\ExhibitorAuthController;
use App\Http\Controllers\SettlementController;
use App\Http\Controllers\DeviceTokenController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\CommissionTierController;
use App\Http\Controllers\Admin\SubscriptionPlanController;
use App\Http\Controllers\Admin\AuctionSessionController;

// Health check endpoint for Render.com
Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

Route::post('/public-event', function (Request $request) {
    $channelName = $request->post('channelName');
    $message = $request->post('message');
    //event(new MyEvent('hello world'));
    broadcast(new MyEvent( "hello world"));
    return config('broadcasting.connections.pusher');
})->middleware('throttle:60,1');



Route::get('/check-time', function (Request $request) {
    $page = $request->query('page');

    $pageTimeRanges = [
        'live_auction' => [
            ['start' => '16:00:00', 'end' => '18:59:59'],
        ],
        'instant_auction' => [
            ['start' => '19:00:00', 'end' => '21:59:59'],
        ],
        'late_auction' => [
            ['start' => '22:00:00', 'end' => '15:59:59'], // overnight
        ]
    ];

    if (!isset($pageTimeRanges[$page])) {
        return response()->json(['error' => 'Page not found', 'allowed' => false], 404);
    }

    $now = Carbon::now('GMT+3');
    $isAllowed = false;
    $remainingSeconds = null;

    foreach ($pageTimeRanges[$page] as $range) {
        $start = Carbon::createFromFormat('H:i:s', $range['start'], 'GMT+3')
            ->setDate($now->year, $now->month, $now->day);
        $end = Carbon::createFromFormat('H:i:s', $range['end'], 'GMT+3')
            ->setDate($now->year, $now->month, $now->day);

        if ($end->lessThanOrEqualTo($start)) {
            // Overnight case
            if ($now->lessThan($end)) {
                // Current time is after midnight but before end time → start was yesterday
                $start->subDay();
            } else {
                // Current time is after start → end is tomorrow
                $end->addDay();
            }
        }

        if ($now->between($start, $end)) {
            $isAllowed = true;
            $remainingSeconds = $end->diffInSeconds($now);
            break;
        }
    }

    return response()->json([
        'page' => $page,
        'current_time' => $now->format('H:i:s'),
        'allowed' => $isAllowed,
        'remaining_seconds' => $remainingSeconds,
        'remaining_time' => $remainingSeconds ? gmdate("H:i:s", $remainingSeconds) : null,
        'timezone' => 'GMT+3'
    ]);
});


// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/refresh', [AuthController::class, 'refresh']);
Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/resend-verification', [AuthController::class, 'resendVerification']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);



// Cloudinary test endpoints removed for security

// Public auction browsing
Route::get('/auctions', [AuctionController::class, 'index']);
Route::get('/auctions/{id}', [AuctionController::class, 'show']);

// Public blog routes
Route::get('/blog', [BlogController::class, 'index']);
Route::get('/blog/latest/{count?}', [BlogController::class, 'latest']);
Route::get('/blog/tags', [BlogController::class, 'tags']);
Route::get('/blog/{slug}', [BlogController::class, 'show']);


// Public broadcast routes (no authentication required)
Route::get('/broadcast', [BroadcastController::class, 'getCurrentBroadcast']);

// Removed venue routes as YouTube is the only streaming platform

// Protected routes - for all authenticated users
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    // User routes
    Route::get('/user/profile', [UserController::class, 'profile']);
    Route::put('/user/profile', [UserController::class, 'updateProfile']);
    Route::post('/logout', [UserController::class, 'logout']);
    Route::get('/user/permissions', [UserController::class, 'getPermissions']);

    // Dealer registration
    Route::post('/become-dealer', [DealerController::class, 'becomeDealer']);

    // Car management for all users

    Route::get('/cars', [CarController::class, 'index']);
    Route::get('/cars/in-auctions', [CarController::class, 'CarsInAuction']);
    Route::get('/cars?page={id}', [CarController::class, 'index']);
    Route::post('/cars', [CarController::class, 'store']);
    Route::get('/cars/enum-options', [CarController::class, 'enumOptions']);
    Route::get('/cars/{id}', [CarController::class, 'show']);
    Route::get('/car/{id}', [CarController::class, 'showOnly']);
    Route::put('/cars/{id}', [CarController::class, 'update']);
    Route::delete('/cars/{id}', [CarController::class, 'destroy']);
    Route::get('/car-statistics', [CarController::class, 'statistics']);

    // Auction management for all users
    Route::post('/auctions', [AuctionController::class, 'store']);
    Route::put('/auctions/{id}', [AuctionController::class, 'update']);
    Route::post('/auctions/{id}/cancel', [AuctionController::class, 'cancel']);
    Route::get('/my-auctions', [AuctionController::class, 'myAuctions']);
    Route::get('/auctions', [AuctionController::class, 'getAllAuctions']);
    Route::get('/approved-auctions', [AuctionController::class, 'index']);
    Route::get('/approved-auctions/{auction_type}', [AuctionController::class, 'auctionByType']);
    Route::get('/approved-live-auctions', [AuctionController::class, 'AuctionsLive']);
    Route::get('/auctions-finished', [AuctionController::class, 'AuctionsFinished']);
    //Route::get('/auctions/{type}', [AuctionController::class, 'getAuctionsByType']);
    Route::get('/auction', [AuctionController::class, 'addToAuction']);
    Route::post('/auction', [AuctionController::class, 'addToAuction']);
    Route::post('/auctions/{auction}/leave', [AuctionController::class, 'leave']);
    Route::get('/auctions/{auction}/status', [AuctionController::class, 'status']);
    Route::post('/auctions/test-bid', [AuctionController::class, 'testBid']);

    // Bid routes for all users
    Route::get('/auctions/{auction}/bids', [BidController::class, 'index']);
    Route::post('/auctions/{auction}/bids', [BidController::class, 'store'])->middleware('bid.rate.limit');
    Route::get('/auctions/{auction}/leaderboard', [BidController::class, 'leaderboard']);
    Route::get('/my-bids', [BidController::class, 'myBidHistory']);
    Route::get('/bids/{bid}/status', [BidController::class, 'checkBidStatus']);

    // New standardized bid API for the unified frontend
    Route::post('/auctions/bid', [BidController::class, 'placeBid'])->middleware('bid.rate.limit');
    Route::get('/auctions/bids/{id}', [BidController::class, 'latestBids']);

    // Auto-bid routes
    Route::post('/auctions/auto-bid', [AutoBidController::class, 'store']);
    Route::get('/auctions/auto-bid/status/{itemId}', [AutoBidController::class, 'getStatus']);
    Route::delete('/auctions/auto-bid/{itemId}', [AutoBidController::class, 'destroy']);

    //purchase-confirmation
    Route::get('/auctions/purchase-confirmation/{auction_id}', [AuctionController::class, 'purchaseConfirmation']);

    // Public broadcast information (read-only)
    Route::get('/broadcast', [BroadcastController::class, 'getCurrentBroadcast']);
    Route::get('/broadcast/status', [BroadcastController::class, 'getStatus']);

    // Wallet routes
    Route::get('/wallet', [WalletController::class, 'show']);
    Route::post('/wallet/deposit', [WalletController::class, 'deposit']);
    Route::get('/wallet/transactions', [WalletController::class, 'transactions']);
    Route::post('/wallet/recharge', [WalletController::class, 'recharge']);
    //confirm sales
    Route::post('/auctions/confirm-sale', [SettlementController::class, 'confirmSale']);
    // Notification routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/device-tokens', [DeviceTokenController::class, 'store']);
});

Route::post('/wallet/initiate-recharge', [WalletController::class, 'initiateRecharge'])->name('wallet.recharge');
Route::post('/wallet/callback', [WalletController::class, 'handleCallback'])->name('wallet.callback');
Route::get('/wallet/error', [WalletController::class, 'handleError'])->name('wallet.error');


// Dealer-only routes
Route::middleware(['auth:sanctum', \App\Http\Middleware\DealerMiddleware::class])->group(function () {
    // Dealer dashboard
    Route::get('/dealer/dashboard', [DealerController::class, 'dashboard']);

    // Dealer-specific functionality
    Route::get('/auctions/{id}/analytics', [AuctionController::class, 'analytics']);

    // Legacy routes - these duplicate the routes above but are kept for backward compatibility
    // They should be removed in a future update
    Route::get('/dealer/cars', [CarController::class, 'index']);
    Route::post('/dealer/cars', [CarController::class, 'store']);
    Route::get('/dealer/cars/{id}', [CarController::class, 'show']);
    Route::put('/dealer/cars/{id}', [CarController::class, 'update']);
    Route::delete('/dealer/cars/{id}', [CarController::class, 'destroy']);
    Route::get('/dealer/car-statistics', [CarController::class, 'statistics']);
});

// Moderator routes
Route::middleware(['auth:sanctum', \App\Http\Middleware\ModeratorMiddleware::class])->group(function () {
    // Moderator dashboard
    Route::get('/moderator/dashboard', [ModeratorController::class, 'dashboard']);

    // Broadcast management
    Route::post('/moderator/broadcast/start', [ModeratorController::class, 'startBroadcast']);
    Route::post('/moderator/broadcast/stop/{broadcastId}', [ModeratorController::class, 'stopBroadcast']);
    Route::put('/moderator/broadcast/{broadcastId}/current-car', [ModeratorController::class, 'switchCar']);

    // Offline bid management
    Route::post('/moderator/bids/offline', [ModeratorController::class, 'addOfflineBid']);
});

// Admin routes
Route::middleware(['auth:sanctum', \App\Http\Middleware\AdminMiddleware::class])->group(function () {
    // Admin dashboard
    Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
    Route::get('admin/settings', [SettingsController::class, 'index']);
    Route::put('admin/settings', [SettingsController::class, 'update']);
    Route::post('admin/settings', [SettingsController::class, 'update']); // Keep POST for backward compatibility
    Route::get('admin/settings/{key}', [SettingsController::class, 'getSetting']);
    // Admin user management
    Route::get('/admin/users', [AdminController::class, 'users']);
    Route::get('/admin/users/{userId}', [AdminController::class, 'getUserDetails']);
    Route::put('/admin/users/{userId}', [AdminController::class, 'updateUser']);
    Route::post('/admin/users/{userId}/activate', [AdminController::class, 'approveUser']);
    Route::post('/admin/users/{userId}/reject', [AdminController::class, 'rejectUser']);
    Route::get('/admin/pending-verifications', [AdminController::class, 'getPendingVerifications']);
    Route::post('/admin/dealers/{userId}/approve-verification', [AdminController::class, 'approveVerification']);
    Route::post('/admin/dealers/{userId}/reject-verification', [AdminController::class, 'rejectVerification']);

    // Admin moderator management
    Route::get('/admin/moderators', [AdminModeratorController::class, 'index']);
    Route::post('/admin/moderators', [AdminModeratorController::class, 'store']);
    Route::get('/admin/moderators/{id}', [AdminModeratorController::class, 'show']);
    Route::put('/admin/moderators/{id}', [AdminModeratorController::class, 'update']);
    Route::delete('/admin/moderators/{id}', [AdminModeratorController::class, 'destroy']);
    Route::patch('/admin/moderators/{id}/status', [AdminModeratorController::class, 'updateStatus']);

    // Admin auction management
    Route::get('/admin/auctions', [AdminController::class, 'auctions']);
    Route::get('/admin/auctions/{id}', [AdminController::class, 'getAuction']);
    Route::put('/admin/auctions/{id}', [AdminController::class, 'updateAuction']);
    Route::post('/admin/auctions/{id}/approve', [AdminController::class, 'approveAuction']);
    Route::post('/admin/auctions/{id}/reject', [AdminController::class, 'rejectAuction']);
    Route::put('/admin/auctions/{id}/status', [AdminController::class, 'updateAuctionStatus']);
    Route::put('/admin/auctions/{id}/auction-type', [AdminController::class, 'updateAuctionType']);
    Route::post('/admin/auctions/bulk-status', [AuctionController::class, 'bulkUpdateStatus']);
    Route::put('/admin/cars/bulk/approve-reject', [AuctionController::class, 'approveRejectAuctionBulk']);
    Route::put('/admin/auctions/bulk/move-to-status', [AuctionController::class, 'moveBetweenAuctionsBulk']);
    Route::put('/admin/auctions/{id}/set-open-price', [AdminController::class, 'setOpeningPrice']);

    // Admin car management
    Route::get('/admin/cars', [AdminController::class, 'getAllCars']);
    Route::put('/admin/cars/{id}', [AdminController::class, 'updateCar']);
    Route::put('/admin/cars/{id}/status', [AdminController::class, 'updateCarStatus']);
    Route::delete('/admin/cars/{id}', [AdminController::class, 'deleteCar']);


    // Admin blog management
    Route::get('/admin/blogs', [AdminController::class, 'blogs']);
    Route::post('/admin/blogs/{id}/status', [AdminController::class, 'toggleBlogStatus']);
    Route::post('/admin/blog-tags', [AdminController::class, 'manageTags']);
    Route::get('/admin/blogs/tags', [AdminController::class, 'getBlogTags']);

    // Admin financial management
    Route::get('/admin/transactions', [AdminController::class, 'getTransactions']);
    Route::get('/admin/settlements', [AdminController::class, 'getSettlements']);

    // Blog CRUD operations (admin only)
    Route::post('/blog', [BlogController::class, 'store']);
    Route::put('/blog/{id}', [BlogController::class, 'update']);
    Route::delete('/blog/{id}', [BlogController::class, 'destroy']);

    // Admin venue management
    Route::post('/venues', [VenueController::class, 'store']);
    Route::put('/venues/{id}', [VenueController::class, 'update']);
    Route::delete('/venues/{id}', [VenueController::class, 'destroy']);

    // Admin broadcast management

    Route::get('/admin/all-broadcasts', [BroadcastController::class, 'getAllBroadcasts']);
    Route::get('/admin/broadcast', [BroadcastController::class, 'show']);
    Route::post('/admin/broadcast', [BroadcastController::class, 'store']);
    Route::put('/admin/broadcast', [BroadcastController::class, 'update']);
    Route::put('/admin/broadcast/status', [BroadcastController::class, 'updateStatus']);
    Route::delete('/admin/broadcast/{id}', [BroadcastController::class, 'destroy']);
    // Admin commission tiers management
    Route::get('/admin/commission-tiers', [CommissionTierController::class, 'index']);
    Route::post('/admin/commission-tiers', [CommissionTierController::class, 'store']);
    Route::get('/admin/commission-tiers/{id}', [CommissionTierController::class, 'show']);
    Route::put('/admin/commission-tiers/{id}', [CommissionTierController::class, 'update']);
    Route::delete('/admin/commission-tiers/{id}', [CommissionTierController::class, 'destroy']);
    Route::post('/admin/commission-tiers/calculate', [CommissionTierController::class, 'calculateCommission']);

    // Admin subscription plans management
    Route::get('/admin/subscription-plans', [SubscriptionPlanController::class, 'index']);
    Route::post('/admin/subscription-plans', [SubscriptionPlanController::class, 'store']);
    Route::get('/admin/subscription-plans/{id}', [SubscriptionPlanController::class, 'show']);
    Route::put('/admin/subscription-plans/{id}', [SubscriptionPlanController::class, 'update']);
    Route::delete('/admin/subscription-plans/{id}', [SubscriptionPlanController::class, 'destroy']);
    Route::post('/admin/subscription-plans/{id}/toggle-status', [SubscriptionPlanController::class, 'toggleStatus']);

    // Admin auction sessions management
    Route::get('/admin/sessions', [AuctionSessionController::class, 'index']);
    Route::get('/admin/sessions/active-scheduled', [AuctionSessionController::class, 'getActiveAndScheduledSessions']);
    Route::post('/admin/sessions', [AuctionSessionController::class, 'store']);
    Route::get('/admin/sessions/{id}', [AuctionSessionController::class, 'show']);
    Route::put('/admin/sessions/{id}', [AuctionSessionController::class, 'update']);
    Route::post('/admin/sessions/{id}/status', [AuctionSessionController::class, 'updateStatus']);
    Route::delete('/admin/sessions/{id}', [AuctionSessionController::class, 'destroy']);
});

// Public subscription plans routes
Route::get('/subscription-plans/user-type/{userType}', [SubscriptionPlanController::class, 'getByUserType']);

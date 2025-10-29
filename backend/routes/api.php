<?php

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CarController;
use App\Http\Controllers\AuctionController;
use App\Http\Controllers\AutoBidController;
use App\Http\Controllers\BidController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ModeratorController;
use App\Http\Controllers\BroadcastController;
use App\Http\Controllers\DealerController;
use App\Http\Controllers\VenueController; // قد يُستخدم لاحقًا
use App\Http\Controllers\SettlementController;
use App\Http\Controllers\DeviceTokenController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\CarSimilarityController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\ActivityLogController;

use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\BidEventController;
use App\Http\Controllers\Admin\AuctionSessionController as AdminAuctionSessionController;
use App\Http\Controllers\Admin\AuctionController as AdminAuctionController;
use App\Http\Controllers\Admin\CommissionTierController;
use App\Http\Controllers\Admin\SubscriptionPlanController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\ModeratorController as AdminModeratorController;
use App\Http\Controllers\Admin\CarController as AdminCarController;

use App\Http\Controllers\AuctionSessionController;
use App\Http\Controllers\Exhibitor\AuctionSessionController as ExhibitorAuctionSessionController;

// User Wallet (العامة)
use App\Http\Controllers\WalletController as UserWalletController;

// Exhibitor Wallet (محفظة المعرض)
use App\Http\Controllers\Exhibitor\WalletController as ExhibitorWalletController;
use App\Http\Controllers\Exhibitor\WalletDepositController as ExhibitorWalletDepositController;
use App\Http\Controllers\Exhibitor\WalletWithdrawController as ExhibitorWalletWithdrawController;

// =========================
// Exhibitor Ratings
// =========================
use App\Http\Controllers\Exhibitor\VenueOwnerRatingController;

// =========================
// Exhibitor Shipments
// =========================
use App\Http\Controllers\Exhibitor\ShipmentController as ExhibitorShipmentController;

// =========================
// Exhibitor Commission
// =========================
use App\Http\Controllers\Exhibitor\CommissionController as ExhibitorCommissionController;

// =========================
// Exhibitor Extra Services (NEW)
// =========================
use App\Http\Controllers\Exhibitor\ExtraServiceController as ExhibitorExtraServiceController;
use App\Http\Controllers\Exhibitor\ExtraServiceRequestController as ExhibitorExtraServiceRequestController;

/*
|--------------------------------------------------------------------------
| Health
|--------------------------------------------------------------------------
*/
Route::get('/health', fn () => response()->json(['status' => 'ok']));

/*
|--------------------------------------------------------------------------
| Upload
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->post('/upload-image', [UploadController::class, 'store']);

/*
|--------------------------------------------------------------------------
| Utilities
|--------------------------------------------------------------------------
*/
Route::get('/cars/similar', [CarSimilarityController::class, 'suggest']);

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
            if ($now->lessThan($end)) {
                $start->subDay();
            } else {
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

/*
|--------------------------------------------------------------------------
| Public Auth
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/refresh', [AuthController::class, 'refresh']);
Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/resend-verification', [AuthController::class, 'resendVerification']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

/*
|--------------------------------------------------------------------------
| Public: Auctions / Blog / Broadcast
|--------------------------------------------------------------------------
*/
Route::get('/auctions', [AuctionController::class, 'index']);
Route::get('/auctions/fixed', [AuctionController::class, 'getFixedAuctions']);
Route::get('/auctions/{id}', [AuctionController::class, 'show'])->whereNumber('id');

Route::get('/sessions/live', [AuctionSessionController::class, 'getActiveLiveSessions']);
Route::get('/sessions/live/{id}', [AuctionSessionController::class, 'getLiveSession'])->whereNumber('id');

Route::get('/blog', [BlogController::class, 'index']);
Route::get('/blog/latest/{count?}', [BlogController::class, 'latest'])->whereNumber('count');
Route::get('/blog/tags', [BlogController::class, 'tags']);
Route::get('/blog/{slug}', [BlogController::class, 'show']);

Route::get('/broadcast', [BroadcastController::class, 'getCurrentBroadcast']);

/*
|--------------------------------------------------------------------------
| Protected (auth:sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);

    // User
    Route::get('/user/profile', [UserController::class, 'profile']);
    Route::put('/user/profile', [UserController::class, 'updateProfile']);
    Route::get('/user/permissions', [UserController::class, 'getPermissions']);

    // Dealer application
    Route::post('/become-dealer', [DealerController::class, 'becomeDealer']);

    // Cars
    Route::get('/cars', [CarController::class, 'index']);
    Route::get('/cars/in-auctions', [CarController::class, 'CarsInAuction']);
    Route::post('/cars', [CarController::class, 'store']);
    Route::get('/cars/enum-options', [CarController::class, 'enumOptions']);
    Route::get('/cars/{id}', [CarController::class, 'show'])->whereNumber('id');
    Route::get('/car/{id}', [CarController::class, 'showOnly'])->whereNumber('id');
    Route::put('/cars/{id}', [CarController::class, 'update'])->whereNumber('id');
    Route::delete('/cars/{id}', [CarController::class, 'destroy'])->whereNumber('id');
    Route::get('/car-statistics', [CarController::class, 'statistics']);

    // Auctions (user scope)
    Route::post('/auctions', [AuctionController::class, 'store']);
    Route::get('/sessions/active-scheduled', [AdminController::class, 'getActiveAndScheduledSessions']);
    Route::get('/sessions/{id}', [AdminController::class, 'showSessionPublic'])->whereNumber('id');
    Route::put('/auctions/{id}', [AuctionController::class, 'update'])->whereNumber('id');
    Route::post('/auctions/{id}/cancel', [AuctionController::class, 'cancel'])->whereNumber('id');
    Route::get('/my-auctions', [AuctionController::class, 'myAuctions']);
    Route::get('/auctions-finished', [AuctionController::class, 'AuctionsFinished']);
    Route::get('/auction', [AuctionController::class, 'addToAuction']);
    Route::post('/auction', [AuctionController::class, 'addToAuction']);
    Route::post('/auctions/{auction}/leave', [AuctionController::class, 'leave'])->whereNumber('auction');
    Route::get('/auctions/{auction}/status', [AuctionController::class, 'status'])->whereNumber('auction');
    Route::post('/auctions/test-bid', [AuctionController::class, 'testBid']);

    // Bids
    Route::get('/auctions/{auction}/bids', [BidController::class, 'index'])->whereNumber('auction');
    Route::post('/auctions/{auction}/bids', [BidController::class, 'store'])->middleware('bid.rate.limit')->whereNumber('auction');
    Route::get('/auctions/{auction}/leaderboard', [BidController::class, 'leaderboard'])->whereNumber('auction');
    Route::get('/my-bids', [BidController::class, 'myBidHistory']);
    Route::get('/bids/{bid}/status', [BidController::class, 'checkBidStatus'])->whereNumber('bid');
    Route::get('/bids-history', [BidController::class, 'UserBidHistory']);
    Route::post('/auctions/bid', [BidController::class, 'placeBid'])->middleware('bid.rate.limit');
    Route::get('/auctions/bids/{id}', [BidController::class, 'latestBids'])->whereNumber('id');

    // Auto-bid
    Route::post('/auctions/auto-bid', [AutoBidController::class, 'store']);
    Route::get('/auctions/auto-bid/status/{itemId}', [AutoBidController::class, 'getStatus'])->whereNumber('itemId');
    Route::delete('/auctions/auto-bid/{itemId}', [AutoBidController::class, 'destroy'])->whereNumber('itemId');

    // Purchase confirmation
    Route::get('/auctions/purchase-confirmation/{auction_id}', [AuctionController::class, 'purchaseConfirmation'])->whereNumber('auction_id');

    // Broadcast (read-only extras)
    Route::get('/broadcast/status', [BroadcastController::class, 'getStatus']);

    // User Wallet (public wallet)
    Route::get('/wallet', [UserWalletController::class, 'show']);
    Route::post('/wallet/deposit', [UserWalletController::class, 'deposit']);
    Route::get('/wallet/transactions', [UserWalletController::class, 'transactions']);
    Route::post('/wallet/recharge', [UserWalletController::class, 'recharge']);

    // Settlements
    Route::get('/auctions/calculate-settlement/{car_id}', [SettlementController::class, 'calculateSettlement'])->whereNumber('car_id');
    Route::post('/auctions/confirm-sale', [SettlementController::class, 'confirmSale']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/device-tokens', [DeviceTokenController::class, 'store']);
    Route::get('/settlements', [SettlementController::class, 'index']);

    // =========================
    // Exhibitor Ratings (write operations)
    // =========================
    Route::prefix('exhibitor')->group(function () {
        Route::post   ('/ratings',          [VenueOwnerRatingController::class, 'store']);
        Route::put    ('/ratings/{review}', [VenueOwnerRatingController::class, 'update'])->whereNumber('review');
        Route::delete ('/ratings/{review}', [VenueOwnerRatingController::class, 'destroy'])->whereNumber('review');
    });
});

/*
|--------------------------------------------------------------------------
| Public Payment Webhooks for user wallet
|--------------------------------------------------------------------------
*/
Route::post('/wallet/initiate-recharge', [UserWalletController::class, 'initiateRecharge'])->name('wallet.recharge');
Route::post('/wallet/callback', [UserWalletController::class, 'handleCallback'])->name('wallet.callback');
Route::get('/wallet/error', [UserWalletController::class, 'handleError'])->name('wallet.error');

/*
|--------------------------------------------------------------------------
| Dealer
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', \App\Http\Middleware\DealerMiddleware::class])->group(function () {
    Route::get('/dealer/dashboard', [DealerController::class, 'dashboard']);
    Route::get('/auctions/{id}/analytics', [AuctionController::class, 'analytics'])->whereNumber('id');

    // Legacy dealer cars
    Route::get('/dealer/cars', [CarController::class, 'index']);
    Route::post('/dealer/cars', [CarController::class, 'store']);
    Route::get('/dealer/cars/{id}', [CarController::class, 'show'])->whereNumber('id');
    Route::put('/dealer/cars/{id}', [CarController::class, 'update'])->whereNumber('id');
    Route::delete('/dealer/cars/{id}', [CarController::class, 'destroy'])->whereNumber('id');
    Route::get('/dealer/car-statistics', [CarController::class, 'statistics']);
});

/*
|--------------------------------------------------------------------------
| Moderator
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', \App\Http\Middleware\ModeratorMiddleware::class])->group(function () {
    Route::get('/moderator/dashboard', [ModeratorController::class, 'dashboard']);
    Route::post('/moderator/broadcast/start', [ModeratorController::class, 'startBroadcast']);
    Route::post('/moderator/broadcast/stop/{broadcastId}', [ModeratorController::class, 'stopBroadcast'])->whereNumber('broadcastId');
    Route::put('/moderator/broadcast/{broadcastId}/current-car', [ModeratorController::class, 'switchCar'])->whereNumber('broadcastId');
    Route::post('/moderator/bids/offline', [ModeratorController::class, 'addOfflineBid']);
});

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', \App\Http\Middleware\AdminMiddleware::class])
    ->prefix('admin')->group(function () {

    Route::get('/activity-logs', [ActivityLogController::class, 'index']);

    Route::get('dashboard', [AdminController::class, 'dashboard']);
    Route::get('settings', [SettingsController::class, 'index']);
    Route::put('settings', [SettingsController::class, 'update']);
    Route::post('settings', [SettingsController::class, 'update']);
    Route::get('settings/{key}', [SettingsController::class, 'getSetting']);

    // Users
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::get('/users/{userId}', [AdminUserController::class, 'show'])->whereNumber('userId');
    Route::put('/users/{userId}', [AdminUserController::class, 'update'])->whereNumber('userId');
    Route::post('/users/{userId}/activate', [AdminUserController::class, 'approveUser'])->whereNumber('userId');
    Route::post('/users/{userId}/reject', [AdminUserController::class, 'rejectUser'])->whereNumber('userId');
    Route::post('/users/{userId}/toggle-status', [AdminUserController::class, 'toggleUserStatus'])->whereNumber('userId');
    Route::get('/pending-verifications', [AdminUserController::class, 'getPendingVerifications']);
    Route::post('/dealers/{userId}/approve-verification', [AdminUserController::class, 'approveVerification'])->whereNumber('userId');
    Route::post('/dealers/{userId}/reject-verification', [AdminUserController::class, 'rejectVerification'])->whereNumber('userId');

    // Moderators
    Route::get('/moderators', [AdminModeratorController::class, 'index']);
    Route::post('/moderators', [AdminModeratorController::class, 'store']);
    Route::get('/moderators/{id}', [AdminModeratorController::class, 'show'])->whereNumber('id');
    Route::put('/moderators/{id}', [AdminModeratorController::class, 'update'])->whereNumber('id');
    Route::delete('/moderators/{id}', [AdminModeratorController::class, 'destroy'])->whereNumber('id');
    Route::patch('/moderators/{id}/status', [AdminModeratorController::class, 'updateStatus'])->whereNumber('id');

    // Admin auction management
    Route::get('/auctions', [AdminAuctionController::class, 'index']);
    Route::get('/auctions/{id}', [AdminAuctionController::class, 'show'])->whereNumber('id');
    Route::put('/auctions/{id}', [AdminAuctionController::class, 'update'])->whereNumber('id');
    Route::post('/auctions/{id}/approve', [AdminAuctionController::class, 'approve'])->whereNumber('id');
    Route::post('/auctions/{id}/reject', [AdminAuctionController::class, 'reject'])->whereNumber('id');
    Route::put('/auctions/{id}/status', [AdminAuctionController::class, 'updateStatus'])->whereNumber('id');
    Route::put('/auctions/{id}/auction-type', [AdminAuctionController::class, 'updateType'])->whereNumber('id');
    Route::post('/auctions/bulk-status', [AuctionController::class, 'bulkUpdateStatus']);
    Route::put('/cars/bulk/approve-reject', [AuctionController::class, 'approveRejectAuctionBulk']);
    Route::put('/auctions/bulk/move-to-status', [AuctionController::class, 'moveBetweenAuctionsBulk']);
    Route::put('/auctions/{id}/set-open-price', [AdminAuctionController::class, 'setOpeningPrice'])->whereNumber('id');
    Route::post('/auctions/bulk-approve', [AdminAuctionController::class, 'bulkApprove']);
    Route::post('/auctions/bulk-reject',  [AdminAuctionController::class, 'bulkReject']);

    // Bid events
    Route::get('/bids/events', [BidEventController::class, 'index']);
    Route::get('/bids/events/{id}', [BidEventController::class, 'show'])->whereNumber('id');

    // Cars (admin)
    Route::get('/cars', [AdminCarController::class, 'index']);
    Route::get('/cars/{id}', [AdminCarController::class, 'show'])->whereNumber('id');
    Route::put('/cars/{id}', [AdminCarController::class, 'update'])->whereNumber('id');
    Route::put('/cars/{id}/status', [AdminCarController::class, 'updateCarStatus'])->whereNumber('id');
    Route::delete('/cars/{id}', [AdminCarController::class, 'destroy'])->whereNumber('id');

    // Blogs
    Route::get('/blogs', [AdminController::class, 'blogs']);
    Route::post('/blogs/{id}/status', [AdminController::class, 'toggleBlogStatus'])->whereNumber('id');
    Route::post('/blog-tags', [AdminController::class, 'manageTags']);
    Route::get('/blogs/tags', [AdminController::class, 'getBlogTags']);

    // Finance
    Route::get('/transactions', [AdminController::class, 'getTransactions']);
    Route::get('/settlements', [AdminController::class, 'getSettlements']);

    // Broadcast
    Route::get('/all-broadcasts', [BroadcastController::class, 'getAllBroadcasts']);
    Route::get('/broadcast', [BroadcastController::class, 'show']);
    Route::post('/broadcast', [BroadcastController::class, 'store']);
    Route::put('/broadcast', [BroadcastController::class, 'update']);
    Route::put('/broadcast/status', [BroadcastController::class, 'updateStatus']);
    Route::delete('/broadcast/{id}', [BroadcastController::class, 'destroy'])->whereNumber('id');

    // Commission Tiers
    Route::get('/commission-tiers', [CommissionTierController::class, 'index']);
    Route::post('/commission-tiers', [CommissionTierController::class, 'store']);
    Route::get('/commission-tiers/{id}', [CommissionTierController::class, 'show'])->whereNumber('id');
    Route::put('/commission-tiers/{id}', [CommissionTierController::class, 'update'])->whereNumber('id');
    Route::delete('/commission-tiers/{id}', [CommissionTierController::class, 'destroy'])->whereNumber('id');
    Route::post('/commission-tiers/calculate', [CommissionTierController::class, 'calculateCommission']);

    // Subscription Plans
    Route::get('/subscription-plans', [SubscriptionPlanController::class, 'index']);
    Route::post('/subscription-plans', [SubscriptionPlanController::class, 'store']);
    Route::get('/subscription-plans/{id}', [SubscriptionPlanController::class, 'show'])->whereNumber('id');
    Route::put('/subscription-plans/{id}', [SubscriptionPlanController::class, 'update'])->whereNumber('id');
    Route::delete('/subscription-plans/{id}', [SubscriptionPlanController::class, 'destroy'])->whereNumber('id');
    Route::post('/subscription-plans/{id}/toggle-status', [SubscriptionPlanController::class, 'toggleStatus'])->whereNumber('id');

    // Auction Sessions (admin)
    Route::get('/sessions', [AdminAuctionSessionController::class, 'index']);
    Route::get('/sessions/active-scheduled', [AdminAuctionSessionController::class, 'getActiveAndScheduledSessions']);
    Route::post('/sessions', [AdminAuctionSessionController::class, 'store']);
    Route::get('/sessions/{id}', [AdminAuctionSessionController::class, 'show'])->whereNumber('id');
    Route::put('/sessions/{id}', [AdminAuctionSessionController::class, 'update'])->whereNumber('id');
    Route::post('/sessions/{id}/status', [AdminAuctionSessionController::class, 'updateStatus'])->whereNumber('id');
    Route::delete('/sessions/{id}', [AdminAuctionSessionController::class, 'destroy'])->whereNumber('id');
});

/*
|--------------------------------------------------------------------------
| Exhibitor Sessions (قراءة/إدارة الجلسات) + Ratings (قراءة)
|--------------------------------------------------------------------------
*/
Route::prefix('exhibitor')
    ->middleware(['auth:sanctum','role:admin,venue_owner,dealer'])
    ->group(function () {
        Route::get   ('/sessions',             [ExhibitorAuctionSessionController::class, 'index']);
        Route::post  ('/sessions',             [ExhibitorAuctionSessionController::class, 'store']);
        Route::get   ('/sessions/{id}',        [ExhibitorAuctionSessionController::class, 'show'])->whereNumber('id');
        Route::put   ('/sessions/{id}',        [ExhibitorAuctionSessionController::class, 'update'])->whereNumber('id');
        Route::post  ('/sessions/{id}/status', [ExhibitorAuctionSessionController::class, 'updateStatus'])->whereNumber('id');
        Route::delete('/sessions/{id}',        [ExhibitorAuctionSessionController::class, 'destroy'])->whereNumber('id');

        // Ratings (قراءة ملخص وقائمة التقييمات)
        Route::get('/ratings',         [VenueOwnerRatingController::class, 'index']);
        Route::get('/ratings/summary', [VenueOwnerRatingController::class, 'summary']);
    });

/*
|--------------------------------------------------------------------------
| Exhibitor Wallet + Shipments + Commission + Extra Services
|--------------------------------------------------------------------------
*/
Route::prefix('exhibitor')->middleware(['auth:sanctum'])->group(function () {
    // Wallet
    Route::get('/wallet', [ExhibitorWalletController::class, 'show']);
    Route::get('/wallet/transcations', [ExhibitorWalletController::class, 'transactions']); // legacy
    Route::get('/wallet/transactions', [ExhibitorWalletController::class, 'transactions']);
    Route::post('/wallet/deposit/initiate', [ExhibitorWalletDepositController::class, 'initiate']);
    Route::post('/wallet/withdraw', [ExhibitorWalletWithdrawController::class, 'requestPayout']);

    // Shipments
    Route::get   ('/shipments',                   [ExhibitorShipmentController::class, 'index']);
    Route::get   ('/shipments/{shipment}',        [ExhibitorShipmentController::class, 'show'])->whereNumber('shipment');
    Route::post  ('/shipments',                   [ExhibitorShipmentController::class, 'store']);
    Route::patch ('/shipments/{shipment}/status', [ExhibitorShipmentController::class, 'updateStatus'])->whereNumber('shipment');
    Route::delete('/shipments/{shipment}',        [ExhibitorShipmentController::class, 'destroy'])->whereNumber('shipment');

    // Commission
    Route::get ('/commission/summary',    [ExhibitorCommissionController::class, 'summary']);
    Route::put ('/commission/settings',   [ExhibitorCommissionController::class, 'updateSettings']);
    Route::get ('/commission/operations', [ExhibitorCommissionController::class, 'index']);
    Route::post('/commission/operations', [ExhibitorCommissionController::class, 'storeOperation']);
    Route::get ('/commission/tiers',      [ExhibitorCommissionController::class, 'tiers']);
    Route::post('/commission/estimate',   [ExhibitorCommissionController::class, 'estimate']);

    // Extra Services (NEW)
    Route::get ('/extra-services',                 [ExhibitorExtraServiceController::class, 'index']);
    Route::get ('/extra-services/{extraService}',  [ExhibitorExtraServiceController::class, 'show'])->whereNumber('extraService');
    Route::post('/extra-services/requests',        [ExhibitorExtraServiceRequestController::class, 'store']);
    Route::get ('/extra-services/requests',        [ExhibitorExtraServiceRequestController::class, 'index']);
});

/*
|--------------------------------------------------------------------------
| Exhibitor Wallet Webhook (no auth)
|--------------------------------------------------------------------------
*/
Route::post('/exhibitor/wallet/deposit/webhook', [ExhibitorWalletDepositController::class, 'webhook'])
    ->name('exhibitor.wallet.deposit.webhook');

/*
|--------------------------------------------------------------------------
| Public Subscription Plans
|--------------------------------------------------------------------------
*/
Route::get('/subscription-plans/user-type/{userType}', [SubscriptionPlanController::class, 'getByUserType']);

<?php

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// ========= Diagnostics & Infra =========
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Artisan;

// ========= Public / Common Controllers =========
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
use App\Http\Controllers\VenueController;
use App\Http\Controllers\SettlementController;
use App\Http\Controllers\DeviceTokenController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\CarSimilarityController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\ActivityLogController;

// ========= Admin (namespaced) =========
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\BidEventController;
use App\Http\Controllers\Admin\AuctionController as AdminAuctionController;
use App\Http\Controllers\Admin\CommissionTierController;
use App\Http\Controllers\Admin\SubscriptionPlanController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\StaffController as AdminStaffController;
use App\Http\Controllers\Admin\CarController as AdminCarController;
use App\Http\Controllers\Admin\VenueOwnerController as AdminVenueOwnerController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\SalesController;
use App\Http\Controllers\Admin\AdminNotificationController;
use App\Http\Controllers\Admin\OrganizationController;

// ========= Auction Sessions =========
use App\Http\Controllers\AuctionSessionController as PublicAuctionSessionController;
use App\Http\Controllers\Admin\AuctionSessionController as AdminAuctionSessionController;
use App\Http\Controllers\Exhibitor\AuctionSessionController as ExhibitorAuctionSessionController;

// ========= Wallets =========
use App\Http\Controllers\WalletController as UserWalletController;
use App\Http\Controllers\Exhibitor\WalletController as ExhibitorWalletController;
use App\Http\Controllers\Exhibitor\WalletDepositController as ExhibitorWalletDepositController;
use App\Http\Controllers\Exhibitor\WalletWithdrawController as ExhibitorWalletWithdrawController;

// ========= Exhibitor Modules =========
use App\Http\Controllers\Exhibitor\VenueOwnerRatingController;
use App\Http\Controllers\Exhibitor\ShipmentController as ExhibitorShipmentController;
use App\Http\Controllers\Exhibitor\CommissionController as ExhibitorCommissionController;
use App\Http\Controllers\Exhibitor\ExtraServiceController as ExhibitorExtraServiceController;
use App\Http\Controllers\Exhibitor\ExtraServiceRequestController as ExhibitorExtraServiceRequestController;
use App\Http\Controllers\Exhibitor\CarExplorerController;
use App\Http\Controllers\Exhibitor\AnalyticsController as ExhibitorAnalyticsController;

// ========= Dealer Controllers =========
use App\Http\Controllers\Dealer\DashboardController as DealerDashboardController;
use App\Http\Controllers\Dealer\WalletController as DealerWalletController;
use App\Http\Controllers\Dealer\BidController as DealerBidController;
use App\Http\Controllers\Dealer\AiController as DealerAiController;
use App\Http\Controllers\Dealer\WatchlistController as DealerWatchlistController;

// ========= Payment =========
use App\Http\Controllers\Payment\ClickPayController;

/*
|==========================================================================
| SECTION 1: DIAGNOSTICS & HEALTH CHECK
|==========================================================================
| ⚠️ Security Note: Protected endpoints require DIAG_TOKEN in .env
*/

Route::prefix('_diag')->group(function () {
    
    // Health check - lightweight (public)
    Route::get('/health', function () {
        return response()->json([
            'ok'   => true,
            'time' => now()->toIso8601String(),
        ], 200)->header('Cache-Control', 'public, max-age=60');
    })->middleware('throttle:20,1');

    // Lite diagnostics - no sensitive info (public)
    Route::get('/lite', function () {
        $started = microtime(true);

        // DB Check
        $dbMs = -1;
        $dbOk = false;
        $t = microtime(true);
        try {
            DB::select('SELECT 1');
            $dbMs = (microtime(true) - $t) * 1000;
            $dbOk = true;
        } catch (\Throwable $e) {
            $dbMs = -1;
        }

        // Cache Check
        $cacheMs = -1;
        $cacheOk = false;
        $t = microtime(true);
        try {
            Cache::put('diag_lite_key', '1', 60);
            Cache::get('diag_lite_key');
            $cacheMs = (microtime(true) - $t) * 1000;
            $cacheOk = true;
        } catch (\Throwable $e) {
            $cacheMs = -1;
        }

        // Redis Check
        $redisMs = -1;
        $redisOk = false;
        $redisPong = null;
        $t = microtime(true);
        try {
            $raw = Redis::connection('default')->ping();
            $redisMs = (microtime(true) - $t) * 1000;
            $redisOk = is_string($raw) ? stripos($raw, 'PONG') !== false : (bool) $raw;
            $redisPong = is_string($raw) ? $raw : 'PONG';
        } catch (\Throwable $e) {
            $redisMs = -1;
        }

        // Disk Check
        $diskMs = -1;
        $diskOk = false;
        $t = microtime(true);
        try {
            $f = storage_path('app/diag_lite.tmp');
            file_put_contents($f, str_repeat('x', 1024));
            @unlink($f);
            $diskMs = (microtime(true) - $t) * 1000;
            $diskOk = true;
        } catch (\Throwable $e) {
            $diskMs = -1;
        }

        $totalMs = (microtime(true) - $started) * 1000;

        return response()->json([
            'ok'      => $dbOk && $cacheOk,
            'php'     => PHP_VERSION,
            'laravel' => app()->version(),
            'env'     => app()->environment(),
            'metrics' => [
                'db_ms'     => round($dbMs, 1),
                'cache_ms'  => round($cacheMs, 1),
                'redis_ms'  => round($redisMs, 1),
                'disk_ms'   => round($diskMs, 1),
                'total_ms'  => round($totalMs, 1),
            ],
            'status' => [
                'db'    => $dbOk,
                'cache' => $cacheOk,
                'redis' => $redisOk,
                'disk'  => $diskOk,
            ],
        ], 200)->header('Cache-Control', 'no-store');
    })->middleware('throttle:10,1');

    // Protected diagnostics - require DIAG_TOKEN
    Route::middleware('diag.token')->group(function () {
        
        Route::get('/redis', function () {
            $err = null;
            $pong = null;
            $ok = false;
            $pingMs = -1;

            try {
                $t = microtime(true);
                $raw = Redis::connection('default')->ping();
                $pingMs = round((microtime(true) - $t) * 1000, 1);
                $ok  = is_string($raw) ? stripos($raw, 'PONG') !== false : (bool) $raw;
                $pong = is_string($raw) ? $raw : 'PONG';
            } catch (\Throwable $e) {
                $err = $e->getMessage();
            }

            $cacheMs = -1;
            $cacheOk = false;
            try {
                $t = microtime(true);
                Cache::store('redis')->put('diag_r_key', '1', 60);
                $val = Cache::store('redis')->get('diag_r_key');
                $cacheOk = ($val === '1');
                $cacheMs = round((microtime(true) - $t) * 1000, 1);
            } catch (\Throwable $e) {
                $err = ($err ? $err . ' | ' : '') . $e->getMessage();
            }

            return response()->json([
                'ok'       => $ok,
                'pong'     => $pong,
                'ping_ms'  => $pingMs,
                'cache_ok' => $cacheOk,
                'cache_ms' => $cacheMs,
                'error'    => $err,
            ], 200)->header('Cache-Control', 'no-store');
        })->middleware('throttle:10,1');

        Route::post('/reload', function () {
            Artisan::call('config:clear');
            Artisan::call('cache:clear');
            Artisan::call('route:clear');
            return response()->json(['ok' => true, 'message' => 'config/cache/routes cleared'], 200);
        })->middleware('throttle:2,1');
    });
});

/*
|==========================================================================
| SECTION 2: PUBLIC ROUTES (No Authentication Required)
|==========================================================================
*/

// ─────────────────────────────────────────────────────────────────────────
// 2.1 Authentication
// ─────────────────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('/resend-verification', [AuthController::class, 'resendVerification']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
});

// Legacy auth routes (backward compatibility)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/resend-verification', [AuthController::class, 'resendVerification']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/refresh', [AuthController::class, 'refresh']);
Route::get('/middleware/user-role', [App\Http\Controllers\Auth\MiddlewareAuthController::class, 'getUserRole']);

// ─────────────────────────────────────────────────────────────────────────
// 2.2 Public Auctions
// ─────────────────────────────────────────────────────────────────────────
Route::prefix('auctions')->group(function () {
    Route::get('/', [AuctionController::class, 'index']);
    Route::get('/fixed', [AuctionController::class, 'getFixedAuctions']);
    Route::get('/finished', [AuctionController::class, 'AuctionsFinished']);
    Route::get('/live', [AuctionController::class, 'AuctionsLive']);
    Route::get('/by-type/{auction_type}', [AuctionController::class, 'auctionByType']);
    Route::get('/{id}', [AuctionController::class, 'show'])->whereNumber('id');
});

// Legacy auction routes (backward compatibility)
Route::get('/approved-auctions/{auction_type}', [AuctionController::class, 'auctionByType']);
Route::get('/approved-live-auctions', [AuctionController::class, 'AuctionsLive']);
Route::get('/auctions-finished', [AuctionController::class, 'AuctionsFinished']);

// ─────────────────────────────────────────────────────────────────────────
// 2.3 Public Sessions
// ─────────────────────────────────────────────────────────────────────────
Route::prefix('sessions')->group(function () {
    Route::get('/live', [PublicAuctionSessionController::class, 'getActiveLiveSessions']);
    Route::get('/live/{id}', [PublicAuctionSessionController::class, 'getLiveSession'])->whereNumber('id');
    Route::get('/active-scheduled', [PublicAuctionSessionController::class, 'getActiveAndScheduledSessions']);
    Route::get('/{id}', [PublicAuctionSessionController::class, 'show'])->whereNumber('id');
});

// ─────────────────────────────────────────────────────────────────────────
// 2.4 Public Cars & Market
// ─────────────────────────────────────────────────────────────────────────
Route::get('/featured-cars', [CarController::class, 'getFeaturedCars']);
Route::get('/car/{id}', [CarController::class, 'showOnly'])->whereNumber('id');
Route::get('/cars/similar', [CarSimilarityController::class, 'suggest']);

Route::prefix('market')->group(function () {
    Route::get('/cars', [CarController::class, 'publicMarketCars']);
    Route::get('/trucks', [CarController::class, 'publicMarketCars'])->defaults('market', 'trucks');
    Route::get('/buses', [CarController::class, 'publicMarketCars'])->defaults('market', 'buses');
});

// ─────────────────────────────────────────────────────────────────────────
// 2.5 Public Blog
// ─────────────────────────────────────────────────────────────────────────
Route::prefix('blog')->group(function () {
    Route::get('/', [BlogController::class, 'index']);
    Route::get('/latest/{count?}', [BlogController::class, 'latest'])->whereNumber('count');
    Route::get('/tags', [BlogController::class, 'tags']);
    Route::get('/{slug}', [BlogController::class, 'show']);
});

// ─────────────────────────────────────────────────────────────────────────
// 2.6 Public Broadcast & Subscription Plans
// ─────────────────────────────────────────────────────────────────────────
Route::get('/broadcast', [BroadcastController::class, 'getCurrentBroadcast']);
Route::get('/subscription-plans/user-type/{userType}', [SubscriptionPlanController::class, 'getByUserType']);

// ─────────────────────────────────────────────────────────────────────────
// 2.7 Utilities
// ─────────────────────────────────────────────────────────────────────────
Route::get('/check-time', function (Request $request) {
    $page = $request->query('page');
    $pageTimeRanges = [
        'live_auction'    => [['start' => '16:00:00', 'end' => '18:59:59']],
        'instant_auction' => [['start' => '19:00:00', 'end' => '21:59:59']],
        'late_auction'    => [['start' => '22:00:00', 'end' => '15:59:59']],
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
        'page'              => $page,
        'current_time'      => $now->format('H:i:s'),
        'allowed'           => true, // TODO: Change to $isAllowed in production
        'remaining_seconds' => $remainingSeconds,
        'remaining_time'    => $remainingSeconds ? gmdate("H:i:s", $remainingSeconds) : null,
        'timezone'          => 'GMT+3',
    ]);
});

/*
|==========================================================================
| SECTION 3: PAYMENT WEBHOOKS (No Authentication - Called by Payment Gateway)
|==========================================================================
*/

// User Wallet Webhooks
Route::prefix('wallet')->group(function () {
    Route::post('/initiate-recharge', [UserWalletController::class, 'initiateRecharge'])->name('wallet.recharge');
    Route::post('/callback', [UserWalletController::class, 'handleCallback'])->name('wallet.callback');
    Route::get('/error', [UserWalletController::class, 'handleError'])->name('wallet.error');
});

// ClickPay / Moyasar Webhooks
Route::prefix('payment')->group(function () {
    Route::any('/return', [ClickPayController::class, 'handleReturn'])->name('payment.return');
    Route::post('/webhook', [ClickPayController::class, 'handleWebhook'])->name('payment.webhook');
    Route::get('/callback/moyasar', [ClickPayController::class, 'handleMoyasarCallback'])->name('payment.moyasar.callback');
});

// Exhibitor Wallet Webhook
Route::post('/exhibitor/wallet/deposit/webhook', [ExhibitorWalletDepositController::class, 'webhook'])
    ->name('exhibitor.wallet.deposit.webhook');

/*
|==========================================================================
| SECTION 4: AUTHENTICATED USER ROUTES
|==========================================================================
*/

Route::middleware('auth:sanctum')->group(function () {

    // ─────────────────────────────────────────────────────────────────
    // 4.1 Auth Actions
    // ─────────────────────────────────────────────────────────────────
    Route::post('/logout', [AuthController::class, 'logout']);

    // ─────────────────────────────────────────────────────────────────
    // 4.2 User Profile
    // ─────────────────────────────────────────────────────────────────
    Route::prefix('user')->group(function () {
        Route::get('/', [UserController::class, 'profile']);
        Route::get('/profile', [UserController::class, 'profile'])->middleware('set.organization');
        Route::put('/profile', [UserController::class, 'updateProfile']);
        Route::get('/permissions', [UserController::class, 'getPermissions']);
    });

    // ─────────────────────────────────────────────────────────────────
    // 4.3 Dealer Application
    // ─────────────────────────────────────────────────────────────────
    Route::post('/become-dealer', [DealerController::class, 'becomeDealer']);

    // ─────────────────────────────────────────────────────────────────
    // 4.4 Cars Management
    // ─────────────────────────────────────────────────────────────────
    Route::prefix('cars')->group(function () {
        Route::get('/', [CarController::class, 'index']);
        Route::get('/in-auctions', [CarController::class, 'CarsInAuction']);
        Route::get('/enum-options', [CarController::class, 'enumOptions']);
        Route::post('/', [CarController::class, 'store']);
        Route::get('/{id}', [CarController::class, 'show'])->whereNumber('id');
        Route::put('/{id}', [CarController::class, 'update'])->whereNumber('id');
        Route::delete('/{id}', [CarController::class, 'destroy'])->whereNumber('id');
    });
    Route::get('/car-statistics', [CarController::class, 'statistics']);

    // ─────────────────────────────────────────────────────────────────
    // 4.5 Auctions Management
    // ─────────────────────────────────────────────────────────────────
    Route::prefix('auctions')->group(function () {
        Route::post('/', [AuctionController::class, 'store']);
        Route::put('/{id}', [AuctionController::class, 'update'])->whereNumber('id');
        Route::post('/{id}/cancel', [AuctionController::class, 'cancel'])->whereNumber('id');
        Route::post('/{auction}/leave', [AuctionController::class, 'leave'])->whereNumber('auction');
        Route::get('/{auction}/status', [AuctionController::class, 'status'])->whereNumber('auction');
        Route::get('/purchase-confirmation/{auction_id}', [AuctionController::class, 'purchaseConfirmation'])->whereNumber('auction_id');
        Route::post('/test-bid', [AuctionController::class, 'testBid']); // TODO: Remove in production
    });
    
    Route::get('/my-auctions', [AuctionController::class, 'myAuctions']);
    Route::get('/auction', [AuctionController::class, 'addToAuction']);
    Route::post('/auction', [AuctionController::class, 'addToAuction']);
    Route::get('/approved-auctions', [AuctionController::class, 'index']);
    Route::get('/approved-auctions-ids', [AuctionController::class, 'getAllAuctionsIds']);

    // ─────────────────────────────────────────────────────────────────
    // 4.6 Bids
    // ─────────────────────────────────────────────────────────────────
    Route::prefix('auctions/{auction}')->whereNumber('auction')->group(function () {
        Route::get('/bids', [BidController::class, 'index']);
        Route::post('/bids', [BidController::class, 'store'])->middleware('bid.rate.limit');
        Route::get('/leaderboard', [BidController::class, 'leaderboard']);
    });
    
    Route::get('/my-bids', [BidController::class, 'myBidHistory']);
    Route::get('/bids/{bid}/status', [BidController::class, 'checkBidStatus'])->whereNumber('bid');
    Route::get('/bids-history', [BidController::class, 'UserBidHistory']);
    
    // Unified bid endpoints
    Route::post('/auctions/bid', [BidController::class, 'placeBid'])->middleware('bid.rate.limit');
    Route::get('/auctions/bids/{id}', [BidController::class, 'latestBids'])->whereNumber('id');

    // ─────────────────────────────────────────────────────────────────
    // 4.7 Auto-bid
    // ─────────────────────────────────────────────────────────────────
    Route::prefix('auctions/auto-bid')->group(function () {
        Route::post('/', [AutoBidController::class, 'store']);
        Route::get('/status/{itemId}', [AutoBidController::class, 'getStatus'])->whereNumber('itemId');
        Route::delete('/{itemId}', [AutoBidController::class, 'destroy'])->whereNumber('itemId');
    });

    // ─────────────────────────────────────────────────────────────────
    // 4.8 User Wallet
    // ─────────────────────────────────────────────────────────────────
    Route::prefix('wallet')->group(function () {
        Route::get('/', [UserWalletController::class, 'show']);
        Route::post('/deposit', [UserWalletController::class, 'deposit']);
        Route::get('/transactions', [UserWalletController::class, 'transactions']);
        Route::post('/recharge', [UserWalletController::class, 'recharge']);
    });

    // ─────────────────────────────────────────────────────────────────
    // 4.9 Settlements
    // ─────────────────────────────────────────────────────────────────
    Route::get('/settlements', [SettlementController::class, 'index']);
    Route::get('/auctions/calculate-settlement/{car_id}', [SettlementController::class, 'calculateSettlement'])->whereNumber('car_id');
    Route::post('/auctions/confirm-sale', [SettlementController::class, 'confirmSale']);

    // ─────────────────────────────────────────────────────────────────
    // 4.10 Notifications
    // ─────────────────────────────────────────────────────────────────
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/device-tokens', [DeviceTokenController::class, 'store']);

    // ─────────────────────────────────────────────────────────────────
    // 4.11 Broadcast
    // ─────────────────────────────────────────────────────────────────
    Route::get('/broadcast/status', [BroadcastController::class, 'getStatus']);

    // ─────────────────────────────────────────────────────────────────
    // 4.12 Upload
    // ─────────────────────────────────────────────────────────────────
    Route::post('/upload-image', [UploadController::class, 'store']);

    // ─────────────────────────────────────────────────────────────────
    // 4.13 Payment Initiation
    // ─────────────────────────────────────────────────────────────────
    Route::post('/payment/initiate', [ClickPayController::class, 'initiatePayment']);

    // ─────────────────────────────────────────────────────────────────
    // 4.14 Exhibitor Ratings (User Write)
    // ─────────────────────────────────────────────────────────────────
    Route::prefix('exhibitor/ratings')->group(function () {
        Route::post('/', [VenueOwnerRatingController::class, 'store']);
        Route::put('/{review}', [VenueOwnerRatingController::class, 'update'])->whereNumber('review');
        Route::delete('/{review}', [VenueOwnerRatingController::class, 'destroy'])->whereNumber('review');
    });
});

/*
|==========================================================================
| SECTION 5: DEALER ROUTES
|==========================================================================
*/

Route::middleware(['auth:sanctum', \App\Http\Middleware\DealerMiddleware::class])
    ->prefix('dealer')
    ->group(function () {

        // Dashboard
        Route::get('/dashboard', [DealerController::class, 'dashboard']);
        Route::get('/dashboard/init', [DealerDashboardController::class, 'init']);
        Route::get('/dashboard/liquidity-stats', [DealerDashboardController::class, 'liquidityStats']);
        Route::get('/dashboard/bidding-stats', [DealerDashboardController::class, 'biddingStats']);

        // Wallet
        Route::get('/wallet/transactions', [DealerWalletController::class, 'transactions']);

        // Bidding
        Route::post('/bid', [DealerBidController::class, 'placeBid']);

        // AI Toggle
        Route::post('/ai/toggle', [DealerAiController::class, 'toggle']);

        // Watchlists
        Route::prefix('watchlists')->group(function () {
            Route::get('/', [DealerWatchlistController::class, 'index']);
            Route::post('/', [DealerWatchlistController::class, 'store']);
            Route::post('/quick-add', [DealerWatchlistController::class, 'quickAdd']);
            Route::post('/quick-remove', [DealerWatchlistController::class, 'quickRemove']);
            Route::get('/all-items', [DealerWatchlistController::class, 'allItems']);
            Route::put('/{id}', [DealerWatchlistController::class, 'update'])->whereNumber('id');
            Route::delete('/{id}', [DealerWatchlistController::class, 'destroy'])->whereNumber('id');
            Route::get('/{id}/items', [DealerWatchlistController::class, 'items'])->whereNumber('id');
            Route::post('/{id}/items', [DealerWatchlistController::class, 'addItem'])->whereNumber('id');
            Route::delete('/{menuId}/items/{carId}', [DealerWatchlistController::class, 'removeItem'])
                ->whereNumber('menuId')
                ->whereNumber('carId');
        });

        // Auction Analytics
        Route::get('/auctions/{id}/analytics', [AuctionController::class, 'analytics'])->whereNumber('id');

        // Cars (Legacy)
        Route::prefix('cars')->group(function () {
            Route::get('/', [CarController::class, 'index']);
            Route::post('/', [CarController::class, 'store']);
            Route::get('/{id}', [CarController::class, 'show'])->whereNumber('id');
            Route::put('/{id}', [CarController::class, 'update'])->whereNumber('id');
            Route::delete('/{id}', [CarController::class, 'destroy'])->whereNumber('id');
        });
        Route::get('/car-statistics', [CarController::class, 'statistics']);
    });

/*
|==========================================================================
| SECTION 6: MODERATOR ROUTES
|==========================================================================
*/

Route::middleware(['auth:sanctum', \App\Http\Middleware\ModeratorMiddleware::class])
    ->prefix('moderator')
    ->group(function () {
        Route::get('/dashboard', [ModeratorController::class, 'dashboard']);
        Route::post('/broadcast/start', [ModeratorController::class, 'startBroadcast']);
        Route::post('/broadcast/stop/{broadcastId}', [ModeratorController::class, 'stopBroadcast'])->whereNumber('broadcastId');
        Route::put('/broadcast/{broadcastId}/current-car', [ModeratorController::class, 'switchCar'])->whereNumber('broadcastId');
        Route::post('/bids/offline', [ModeratorController::class, 'addOfflineBid']);
    });

/*
|==========================================================================
| SECTION 7: EXHIBITOR ROUTES
|==========================================================================
*/

Route::middleware('auth:sanctum')
    ->prefix('exhibitor')
    ->group(function () {

        // ─────────────────────────────────────────────────────────────
        // 7.1 Sessions (Restricted to venue owners/admins)
        // ─────────────────────────────────────────────────────────────
        Route::middleware('role:admin,venue_owner,dealer')
            ->prefix('sessions')
            ->group(function () {
                Route::get('/', [ExhibitorAuctionSessionController::class, 'index']);
                Route::post('/', [ExhibitorAuctionSessionController::class, 'store']);
                Route::get('/stats', [ExhibitorAuctionSessionController::class, 'stats']);
                Route::get('/{id}', [ExhibitorAuctionSessionController::class, 'show'])->whereNumber('id');
                Route::put('/{id}', [ExhibitorAuctionSessionController::class, 'update'])->whereNumber('id');
                Route::patch('/{id}/status', [ExhibitorAuctionSessionController::class, 'updateStatus'])->whereNumber('id');
                Route::delete('/{id}', [ExhibitorAuctionSessionController::class, 'destroy'])->whereNumber('id');
            });

        // ─────────────────────────────────────────────────────────────
        // 7.2 Ratings (Read only in exhibitor context)
        // ─────────────────────────────────────────────────────────────
        Route::middleware('role:admin,venue_owner,dealer')
            ->prefix('ratings')
            ->group(function () {
                Route::get('/', [VenueOwnerRatingController::class, 'index']);
                Route::get('/summary', [VenueOwnerRatingController::class, 'summary']);
            });

        // ─────────────────────────────────────────────────────────────
        // 7.3 Wallet
        // ─────────────────────────────────────────────────────────────
        Route::prefix('wallet')->group(function () {
            Route::get('/', [ExhibitorWalletController::class, 'show']);
            Route::get('/transactions', [ExhibitorWalletController::class, 'transactions']);
            Route::get('/transcations', [ExhibitorWalletController::class, 'transactions']); // Legacy typo support
            Route::post('/deposit/initiate', [ExhibitorWalletDepositController::class, 'initiate']);
            Route::post('/withdraw', [ExhibitorWalletWithdrawController::class, 'requestPayout']);
        });

        // ─────────────────────────────────────────────────────────────
        // 7.4 Shipments
        // ─────────────────────────────────────────────────────────────
        Route::prefix('shipments')->group(function () {
            Route::get('/', [ExhibitorShipmentController::class, 'index']);
            Route::post('/', [ExhibitorShipmentController::class, 'store']);
            Route::get('/{shipment}', [ExhibitorShipmentController::class, 'show'])->whereNumber('shipment');
            Route::patch('/{shipment}/status', [ExhibitorShipmentController::class, 'updateStatus'])->whereNumber('shipment');
            Route::delete('/{shipment}', [ExhibitorShipmentController::class, 'destroy'])->whereNumber('shipment');
        });

        // ─────────────────────────────────────────────────────────────
        // 7.5 Commission
        // ─────────────────────────────────────────────────────────────
        Route::prefix('commission')->group(function () {
            Route::get('/summary', [ExhibitorCommissionController::class, 'summary']);
            Route::put('/settings', [ExhibitorCommissionController::class, 'updateSettings']);
            Route::get('/operations', [ExhibitorCommissionController::class, 'index']);
            Route::post('/operations', [ExhibitorCommissionController::class, 'storeOperation']);
            Route::get('/tiers', [ExhibitorCommissionController::class, 'tiers']);
            Route::post('/estimate', [ExhibitorCommissionController::class, 'estimate']);
        });

        // ─────────────────────────────────────────────────────────────
        // 7.6 Extra Services
        // ✅ FIXED: Static routes MUST come before dynamic routes
        // ─────────────────────────────────────────────────────────────
        Route::prefix('extra-services')->group(function () {
            Route::get('/', [ExhibitorExtraServiceController::class, 'index']);
            // Static routes first
            Route::get('/requests', [ExhibitorExtraServiceRequestController::class, 'index']);
            Route::post('/requests', [ExhibitorExtraServiceRequestController::class, 'store']);
            // Dynamic route last
            Route::get('/{extraService}', [ExhibitorExtraServiceController::class, 'show'])->whereNumber('extraService');
        });

        // ─────────────────────────────────────────────────────────────
        // 7.7 Marketplace
        // ─────────────────────────────────────────────────────────────
        Route::prefix('market')->group(function () {
            Route::get('/cars', [CarExplorerController::class, 'index']);
            Route::get('/cars/{car}', [CarExplorerController::class, 'show'])->whereNumber('car');
        });

        // ─────────────────────────────────────────────────────────────
        // 7.8 Analytics
        // ─────────────────────────────────────────────────────────────
        Route::prefix('analytics')->group(function () {
            Route::get('/overview', [ExhibitorAnalyticsController::class, 'overview']);
            Route::get('/timeseries', [ExhibitorAnalyticsController::class, 'timeseries']);
            Route::get('/top-models', [ExhibitorAnalyticsController::class, 'topModels']);
            Route::get('/bids-heatmap', [ExhibitorAnalyticsController::class, 'bidsHeatmap']);
        });
    });

/*
|==========================================================================
| SECTION 8: ADMIN ROUTES
|==========================================================================
*/

Route::middleware(['auth:sanctum', 'set.organization', \App\Http\Middleware\AdminMiddleware::class])
    ->prefix('admin')
    ->group(function () {

        // ─────────────────────────────────────────────────────────────
        // 8.1 Dashboard & Settings
        // ─────────────────────────────────────────────────────────────
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        
        Route::prefix('settings')->group(function () {
            Route::get('/', [SettingsController::class, 'index']);
            Route::put('/', [SettingsController::class, 'update']);
            Route::post('/', [SettingsController::class, 'update']); // Legacy
            Route::get('/{key}', [SettingsController::class, 'getSetting']);
        });

        // ─────────────────────────────────────────────────────────────
        // 8.2 Activity Logs
        // ─────────────────────────────────────────────────────────────
        Route::get('/activity-logs', [ActivityLogController::class, 'index'])
            ->middleware('can:activity_logs.view');

        // ─────────────────────────────────────────────────────────────
        // 8.3 Users Management
        // ─────────────────────────────────────────────────────────────
        Route::prefix('users')->group(function () {
            Route::get('/owners', [AdminUserController::class, 'getOwners'])->middleware('can:users.view');
            Route::get('/', [AdminUserController::class, 'index'])->middleware('can:users.view');
            Route::get('/{userId}', [AdminUserController::class, 'show'])->whereNumber('userId')->middleware('can:users.view_details');
            Route::put('/{userId}', [AdminUserController::class, 'update'])->whereNumber('userId')->middleware('can:users.update');
            Route::post('/{userId}/activate', [AdminUserController::class, 'approveUser'])->whereNumber('userId')->middleware('can:users.update');
            Route::post('/{userId}/reject', [AdminUserController::class, 'rejectUser'])->whereNumber('userId')->middleware('can:users.update');
            Route::post('/{userId}/toggle-status', [AdminUserController::class, 'updateStatus'])->whereNumber('userId')->middleware('can:users.update');
        });

        Route::get('/pending-verifications', [AdminUserController::class, 'getPendingVerifications'])->middleware('can:users.view');

        Route::prefix('dealers')->group(function () {
            Route::post('/{userId}/approve-verification', [AdminUserController::class, 'approveVerification'])->whereNumber('userId')->middleware('can:users.update');
            Route::post('/{userId}/reject-verification', [AdminUserController::class, 'rejectVerification'])->whereNumber('userId')->middleware('can:users.update');
        });

        // ─────────────────────────────────────────────────────────────
        // 8.4 Roles & Permissions
        // ─────────────────────────────────────────────────────────────
        Route::get('/roles-list', [RoleController::class, 'list'])->middleware('can:roles.view');
        Route::get('/permissions/tree', [RoleController::class, 'permissionsTree'])->middleware('can:roles.view');
        Route::apiResource('roles', RoleController::class)->middleware('can:roles.view');

        // ─────────────────────────────────────────────────────────────
        // 8.5 Staff Management
        // ─────────────────────────────────────────────────────────────
        Route::prefix('staff')->group(function () {
            Route::get('/', [AdminStaffController::class, 'index'])->middleware('can:staff.view');
            Route::post('/', [AdminStaffController::class, 'store'])->middleware('can:staff.create');
            Route::get('/{id}', [AdminStaffController::class, 'show'])->whereNumber('id')->middleware('can:staff.view_details');
            Route::put('/{id}', [AdminStaffController::class, 'update'])->whereNumber('id')->middleware('can:staff.update');
            Route::delete('/{id}', [AdminStaffController::class, 'destroy'])->whereNumber('id')->middleware('can:staff.delete');
            Route::patch('/{id}/status', [AdminStaffController::class, 'updateStatus'])->whereNumber('id')->middleware('can:staff.update');
        });

        // ─────────────────────────────────────────────────────────────
        // 8.6 Auctions Management
        // ─────────────────────────────────────────────────────────────
        Route::prefix('auctions')->group(function () {
            Route::get('/', [AdminAuctionController::class, 'index'])->middleware('can:auctions.view');
            Route::get('/{id}', [AdminAuctionController::class, 'show'])->whereNumber('id')->middleware('can:auctions.view_details');
            Route::put('/{id}', [AdminAuctionController::class, 'update'])->whereNumber('id')->middleware('can:auctions.update');
            Route::post('/{id}/approve', [AdminAuctionController::class, 'approve'])->whereNumber('id')->middleware('can:auctions.approve');
            Route::post('/{id}/reject', [AdminAuctionController::class, 'reject'])->whereNumber('id')->middleware('can:auctions.reject');
            Route::put('/{id}/status', [AdminAuctionController::class, 'updateStatus'])->whereNumber('id')->middleware('can:auctions.manage_status');
            Route::put('/{id}/auction-type', [AdminAuctionController::class, 'updateType'])->whereNumber('id')->middleware('can:auctions.update');
            Route::put('/{id}/set-open-price', [AdminAuctionController::class, 'setOpeningPrice'])->whereNumber('id')->middleware('can:auctions.update');
            Route::post('/bulk-status', [AuctionController::class, 'bulkUpdateStatus'])->middleware('can:auctions.manage_status');
            Route::post('/bulk-approve', [AdminAuctionController::class, 'bulkApprove'])->middleware('can:auctions.approve');
            Route::post('/bulk-reject', [AdminAuctionController::class, 'bulkReject'])->middleware('can:auctions.reject');
        });

        Route::put('/cars/bulk/approve-reject', [AuctionController::class, 'approveRejectAuctionBulk'])->middleware('can:auctions.approve');
        Route::put('/auctions/bulk/move-to-status', [AuctionController::class, 'moveBetweenAuctionsBulk'])->middleware('can:auctions.manage_status');

        // ─────────────────────────────────────────────────────────────
        // 8.7 Bid Events
        // ─────────────────────────────────────────────────────────────
        Route::prefix('bids/events')->group(function () {
            Route::get('/', [BidEventController::class, 'index']);
            Route::get('/{id}', [BidEventController::class, 'show'])->whereNumber('id');
        });

        // ─────────────────────────────────────────────────────────────
        // 8.8 Cars Management
        // ─────────────────────────────────────────────────────────────
        Route::prefix('cars')->group(function () {
            Route::get('/', [AdminCarController::class, 'index'])->middleware('can:cars.view');
            Route::get('/{id}', [AdminCarController::class, 'show'])->whereNumber('id')->middleware('can:cars.view_details');
            Route::put('/{id}', [AdminCarController::class, 'update'])->whereNumber('id')->middleware('can:cars.update');
            Route::put('/{id}/status', [AdminCarController::class, 'updateCarStatus'])->whereNumber('id')->middleware('can:cars.update');
            Route::delete('/{id}', [AdminCarController::class, 'destroy'])->whereNumber('id')->middleware('can:cars.delete');
        });

        // ─────────────────────────────────────────────────────────────
        // 8.9 Blog Management
        // ─────────────────────────────────────────────────────────────
        Route::prefix('blogs')->group(function () {
            Route::get('/', [AdminController::class, 'blogs']);
            Route::get('/tags', [AdminController::class, 'getBlogTags']);
            Route::post('/{id}/status', [AdminController::class, 'toggleBlogStatus'])->whereNumber('id');
        });
        Route::post('/blog-tags', [AdminController::class, 'manageTags']);

        Route::prefix('blog')->group(function () {
            Route::post('/', [BlogController::class, 'store']);
            Route::put('/{id}', [BlogController::class, 'update'])->whereNumber('id');
            Route::delete('/{id}', [BlogController::class, 'destroy'])->whereNumber('id');
        });

        // ─────────────────────────────────────────────────────────────
        // 8.10 Finance & Transactions
        // ─────────────────────────────────────────────────────────────
        Route::get('/transactions', [AdminController::class, 'getTransactions'])->middleware('can:commissions.view');
        Route::get('/settlements', [AdminController::class, 'getSettlements'])->middleware('can:commissions.view');

        // ─────────────────────────────────────────────────────────────
        // 8.11 Sales Management
        // ─────────────────────────────────────────────────────────────
        Route::prefix('sales')->group(function () {
            Route::get('/', [SalesController::class, 'index'])->middleware('can:commissions.view');
            Route::get('/{id}', [SalesController::class, 'show'])->whereNumber('id')->middleware('can:commissions.view');
            Route::post('/{id}/release-funds', [SalesController::class, 'releaseFunds'])->whereNumber('id')->middleware('can:commissions.manage');
            Route::post('/{id}/refund', [SalesController::class, 'refundBuyer'])->whereNumber('id')->middleware('can:commissions.manage');
            Route::post('/{id}/verify-transfer', [SalesController::class, 'verifyBankTransfer'])->whereNumber('id')->middleware('can:commissions.manage');
        });

        // ─────────────────────────────────────────────────────────────
        // 8.12 Admin Notifications
        // ─────────────────────────────────────────────────────────────
        Route::prefix('notifications')->group(function () {
            Route::get('/', [AdminNotificationController::class, 'index']);
            Route::get('/unread-count', [AdminNotificationController::class, 'unreadCount']);
            Route::post('/{id}/read', [AdminNotificationController::class, 'markAsRead'])->whereNumber('id');
            Route::post('/mark-all-read', [AdminNotificationController::class, 'markAllAsRead']);
        });

        // ─────────────────────────────────────────────────────────────
        // 8.13 Broadcast Management
        // ─────────────────────────────────────────────────────────────
        Route::prefix('broadcast')->group(function () {
            Route::get('/', [BroadcastController::class, 'show'])->middleware('can:live_streams.view');
            Route::post('/', [BroadcastController::class, 'store'])->middleware('can:live_streams.manage');
            Route::put('/', [BroadcastController::class, 'update'])->middleware('can:live_streams.manage');
            Route::put('/status', [BroadcastController::class, 'updateStatus'])->middleware('can:live_streams.manage');
            Route::delete('/{id}', [BroadcastController::class, 'destroy'])->whereNumber('id')->middleware('can:live_streams.manage');
        });
        Route::get('/all-broadcasts', [BroadcastController::class, 'getAllBroadcasts'])->middleware('can:live_streams.view');

        // ─────────────────────────────────────────────────────────────
        // 8.14 Commission Tiers
        // ─────────────────────────────────────────────────────────────
        Route::prefix('commission-tiers')->group(function () {
            Route::get('/', [CommissionTierController::class, 'index'])->middleware('can:commissions.view');
            Route::post('/', [CommissionTierController::class, 'store'])->middleware('can:commissions.manage');
            Route::get('/{id}', [CommissionTierController::class, 'show'])->whereNumber('id')->middleware('can:commissions.view');
            Route::put('/{id}', [CommissionTierController::class, 'update'])->whereNumber('id')->middleware('can:commissions.manage');
            Route::delete('/{id}', [CommissionTierController::class, 'destroy'])->whereNumber('id')->middleware('can:commissions.manage');
            Route::post('/calculate', [CommissionTierController::class, 'calculateCommission'])->middleware('can:commissions.view');
        });

        // ─────────────────────────────────────────────────────────────
        // 8.15 Subscription Plans
        // ─────────────────────────────────────────────────────────────
        Route::prefix('subscription-plans')->group(function () {
            Route::get('/', [SubscriptionPlanController::class, 'index'])->middleware('can:subscription_plans.view');
            Route::post('/', [SubscriptionPlanController::class, 'store'])->middleware('can:subscription_plans.manage');
            Route::get('/{id}', [SubscriptionPlanController::class, 'show'])->whereNumber('id')->middleware('can:subscription_plans.view');
            Route::put('/{id}', [SubscriptionPlanController::class, 'update'])->whereNumber('id')->middleware('can:subscription_plans.manage');
            Route::delete('/{id}', [SubscriptionPlanController::class, 'destroy'])->whereNumber('id')->middleware('can:subscription_plans.manage');
            Route::post('/{id}/toggle-status', [SubscriptionPlanController::class, 'toggleStatus'])->whereNumber('id')->middleware('can:subscription_plans.manage');
        });

        // ─────────────────────────────────────────────────────────────
        // 8.16 Auction Sessions
        // ─────────────────────────────────────────────────────────────
        Route::prefix('sessions')->group(function () {
            Route::get('/', [AdminAuctionSessionController::class, 'index'])->middleware('can:sessions.view');
            Route::get('/stats', [AdminAuctionSessionController::class, 'stats'])->middleware('can:sessions.view');
            Route::get('/active-scheduled', [AdminAuctionSessionController::class, 'getActiveAndScheduledSessions'])->middleware('can:sessions.view');
            Route::post('/', [AdminAuctionSessionController::class, 'store'])->middleware('can:sessions.create');
            Route::get('/{id}', [AdminAuctionSessionController::class, 'show'])->whereNumber('id')->middleware('can:sessions.view_details');
            Route::put('/{id}', [AdminAuctionSessionController::class, 'update'])->whereNumber('id')->middleware('can:sessions.update');
            Route::patch('/{id}/status', [AdminAuctionSessionController::class, 'updateStatus'])->whereNumber('id')->middleware('can:sessions.update');
            Route::delete('/{id}', [AdminAuctionSessionController::class, 'destroy'])->whereNumber('id')->middleware('can:sessions.delete');
        });

        // ─────────────────────────────────────────────────────────────
        // 8.17 Venue Owners
        // ─────────────────────────────────────────────────────────────
        Route::prefix('venue-owners')->group(function () {
            Route::get('/', [AdminVenueOwnerController::class, 'index'])->middleware('can:exhibitors.view');
            Route::get('/{id}', [AdminVenueOwnerController::class, 'show'])->whereNumber('id')->middleware('can:exhibitors.view_details');
            Route::get('/{id}/cars', [AdminVenueOwnerController::class, 'cars'])->whereNumber('id')->middleware('can:exhibitors.view_details');
            Route::get('/{id}/wallet', [AdminVenueOwnerController::class, 'wallet'])->whereNumber('id')->middleware('can:exhibitors.view_details');
            Route::get('/{id}/wallet/transactions', [AdminVenueOwnerController::class, 'walletTransactions'])->whereNumber('id')->middleware('can:exhibitors.view_details');
            Route::post('/{id}/approve', [AdminVenueOwnerController::class, 'approve'])->whereNumber('id')->middleware('can:exhibitors.approve');
            Route::post('/{id}/reject', [AdminVenueOwnerController::class, 'reject'])->whereNumber('id')->middleware('can:exhibitors.approve');
            Route::post('/{id}/toggle-status', [AdminVenueOwnerController::class, 'toggleStatus'])->whereNumber('id')->middleware('can:exhibitors.update');
        });

        // ─────────────────────────────────────────────────────────────
        // 8.18 Organizations
        // ─────────────────────────────────────────────────────────────
        Route::prefix('organizations')->group(function () {
            Route::get('/{id}/members', [OrganizationController::class, 'getMembers'])->whereNumber('id')->middleware('can:organizations.view');
            Route::post('/{id}/members', [OrganizationController::class, 'addMember'])->whereNumber('id')->middleware('can:organizations.update');
            Route::delete('/{id}/members/{userId}', [OrganizationController::class, 'removeMember'])
                ->whereNumber('id')
                ->whereNumber('userId')
                ->middleware('can:organizations.update');
        });
        Route::apiResource('organizations', OrganizationController::class)->middleware('can:organizations.view');

        // ─────────────────────────────────────────────────────────────
        // 8.19 Venues
        // ─────────────────────────────────────────────────────────────
        Route::prefix('venues')->group(function () {
            Route::post('/', [VenueController::class, 'store']);
            Route::put('/{id}', [VenueController::class, 'update'])->whereNumber('id');
            Route::delete('/{id}', [VenueController::class, 'destroy'])->whereNumber('id');
        });
    });

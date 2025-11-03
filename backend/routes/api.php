<?php

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;        // DB test
use Illuminate\Support\Facades\Cache;     // Cache test
use Illuminate\Support\Facades\Redis;     // Redis test

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
| Diagnostics / Health (Postman-only)
|--------------------------------------------------------------------------
| /health     : خفيف جدًا لقياس TTFB.
| /diag-lite  : لقطة واحدة (DB/Cache/Redis/Disk).
| /diag-bench : بنشمارك سريع بدون أي تغييرات .env (loops & payload عبر query).
*/

Route::get('/health', function () {
    return response()->json([
        'ok'   => true,
        'time' => now()->toIso8601String(),
    ], 200)->header('Cache-Control', 'public, max-age=60');
});

Route::get('/diag-lite', function () {
    $started = microtime(true);

    // DB
    $dbMs = -1; $dbOk = false;
    $t = microtime(true);
    try { DB::select('SELECT 1'); $dbMs = (microtime(true) - $t) * 1000; $dbOk = true; } catch (\Throwable $e) { $dbMs = -1; }

    // Cache (default)
    $cacheMs = -1; $cacheOk = false;
    $t = microtime(true);
    try { Cache::put('diag_lite_key', '1', 60); Cache::get('diag_lite_key'); $cacheMs = (microtime(true) - $t) * 1000; $cacheOk = true; } catch (\Throwable $e) { $cacheMs = -1; }

    // Redis ping
    $redisMs = -1; $redisOk = false; $redisPong = null;
    $t = microtime(true);
    try { $pong = Redis::connection()->ping(); $redisMs = (microtime(true) - $t) * 1000; $redisOk = true; $redisPong = is_string($pong) ? $pong : 'PONG'; } catch (\Throwable $e) { $redisMs = -1; }

    // Disk 1KB
    $diskMs = -1; $diskOk = false;
    $t = microtime(true);
    try { $f = storage_path('app/diag_lite.tmp'); file_put_contents($f, str_repeat('x', 1024)); @unlink($f); $diskMs = (microtime(true) - $t) * 1000; $diskOk = true; } catch (\Throwable $e) { $diskMs = -1; }

    $totalMs = (microtime(true) - $started) * 1000;

    return response()->json([
        'ok'      => true,
        'php'     => PHP_VERSION,
        'laravel' => app()->version(),
        'app'     => ['env' => app()->environment(), 'debug' => config('app.debug'), 'url' => config('app.url')],
        'drivers' => ['db_connection' => config('database.default'), 'cache_driver' => config('cache.default'), 'session_driver' => config('session.driver')],
        'opcache' => (function () {
            $op = ['enabled' => false];
            if (function_exists('opcache_get_status')) {
                $st = @opcache_get_status(false);
                if (is_array($st)) {
                    $op = [
                        'enabled'    => (bool)($st['opcache_enabled'] ?? false),
                        'jit'        => $st['jit'] ?? null,
                        'mem_used'   => $st['memory_usage']['used_memory'] ?? null,
                        'mem_free'   => $st['memory_usage']['free_memory'] ?? null,
                        'mem_wasted' => $st['memory_usage']['wasted_memory'] ?? null,
                    ];
                }
            }
            return $op;
        })(),
        'metrics' => [
            'db_ms'     => round($dbMs, 1),
            'cache_ms'  => round($cacheMs, 1),
            'redis_ms'  => round($redisMs, 1),
            'disk_ms'   => round($diskMs, 1),
            'total_ms'  => round($totalMs, 1),
        ],
        'status' => ['db' => $dbOk, 'cache' => $cacheOk, 'redis' => $redisOk, 'disk' => $diskOk, 'pong' => $redisPong],
    ], 200)->header('Cache-Control', 'no-store')
      ->header('X-Response-Time', sprintf('%.1fms', $totalMs))
      ->header('Server-Timing', sprintf(
        'app;dur=%.1f, db;dur=%.1f, cache;dur=%.1f, redis;dur=%.1f, disk;dur=%.1f',
        $totalMs, max(0,$dbMs), max(0,$cacheMs), max(0,$redisMs), max(0,$diskMs)
      ));
})->middleware('throttle:10,1');

Route::get('/diag-bench', function (Request $request) {
    $loops = max(1, min((int)$request->query('loops', 10), 50));   // 1..50
    $kb    = max(1, min((int)$request->query('kb', 1), 64));      // 1..64 KB payload
    $payload = str_repeat('x', $kb * 1024);

    $benchDb = function (int $n) {
        $first = null; $sum = 0.0; $ok = 0;
        for ($i=0; $i<$n; $i++) {
            $t = microtime(true);
            try { DB::select('SELECT 1'); $ms = (microtime(true) - $t) * 1000; $ok++; }
            catch (\Throwable $e) { $ms = -1; }
            if ($i===0) $first = $ms;
            if ($ms >= 0) $sum += $ms;
        }
        return ['first_ms' => $first !== null ? round($first,1) : -1, 'avg_ms' => $ok ? round($sum/$ok,1) : -1, 'ok' => $ok, 'loops' => $n];
    };

    $benchCache = function (string $store, int $n) use ($payload) {
        $sum = 0.0; $ok = 0; $available = true;
        try {
            $cache = $store === 'default' ? Cache::store(config('cache.default')) : Cache::store($store);
        } catch (\Throwable $e) {
            return ['store' => $store, 'available' => false, 'avg_ms' => -1];
        }
        for ($i=0; $i<$n; $i++) {
            $key = "diag_bench:{$store}:".Str::random(8);
            $t = microtime(true);
            try { $cache->put($key, $payload, 60); $cache->get($key); $ms = (microtime(true) - $t) * 1000; $ok++; }
            catch (\Throwable $e) { $ms = -1; $available = false; break; }
            if ($ms >= 0) $sum += $ms;
        }
        return ['store' => $store, 'available' => $available, 'avg_ms' => $ok ? round($sum/$ok,1) : -1, 'loops' => $n];
    };

    $redisPing = (function () {
        try { $t=microtime(true); $pong = Redis::connection()->ping(); return ['ok'=>true,'ms'=>round((microtime(true)-$t)*1000,1),'pong'=>is_string($pong)?$pong:'PONG']; }
        catch (\Throwable $e) { return ['ok'=>false,'ms'=>-1,'pong'=>null]; }
    })();

    $db    = $benchDb($loops);
    $cDef  = $benchCache('default', $loops);
    $cArr  = $benchCache('array',   $loops);
    $cFile = $benchCache('file',    $loops);
    $cRedis= $benchCache('redis',   $loops);

    $tips = [];
    if (config('app.debug') === true) $tips[] = 'APP_DEBUG=false في الإنتاج.';
    if (($cDef['store'] ?? '') === 'database' || str_contains(strval(config('cache.default')), 'database')) {
        $tips[] = 'بدّل CACHE_DRIVER إلى redis (أولوية) أو file/array مؤقتًا — database cache بطيء.';
    }
    if (!$redisPing['ok']) $tips[] = 'Redis غير متاح — فعّله (Upstash/Render Redis) واستخدمه للـ cache & sessions.';
    if (($db['first_ms'] ?? 0) > 200) $tips[] = 'زمن أول اتصال بقاعدة البيانات عالي — قد تكون قاعدة بيانات نائمة/بعيدة. فكّر في connection pooling (PgBouncer) أو health ping.';
    if (($cDef['avg_ms'] ?? 0) > 50) $tips[] = 'الكاش الافتراضي بطيء — غيّره إلى Redis فورًا.';
    if (($db['avg_ms'] ?? 0) > 50) $tips[] = 'زمن DB متوسط عالي — راجع المنطقة/الخطة/الفهارس.';

    return response()->json([
        'ok' => true,
        'loops' => $loops,
        'payload_kb' => $kb,
        'db' => $db,
        'cache' => [
            'default' => $cDef,
            'array'   => $cArr,
            'file'    => $cFile,
            'redis'   => $cRedis,
            'redis_ping' => $redisPing,
        ],
        'advice' => $tips,
    ], 200)->header('Cache-Control','no-store');
})->middleware('throttle:5,1');

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
    Route::post('/subscription-plans/{id}/toggle-status', [SubscriptionPlanController::class, 'toggleStatus']);

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

    // سوق السيارات للمعارض (اعتمادًا على جدول cars الحالي)
    Route::get('/market/cars', [\App\Http\Controllers\Exhibitor\CarExplorerController::class, 'index']);
    Route::get('/market/cars/{car}', [\App\Http\Controllers\Exhibitor\CarExplorerController::class, 'show'])->whereNumber('car');

    // Exhibitor Analytics (NEW)
    Route::get('/analytics/overview',     [\App\Http\Controllers\Exhibitor\AnalyticsController::class, 'overview']);
    Route::get('/analytics/timeseries',   [\App\Http\Controllers\Exhibitor\AnalyticsController::class, 'timeseries']);
    Route::get('/analytics/top-models',   [\App\Http\Controllers\Exhibitor\AnalyticsController::class, 'topModels']);
    Route::get('/analytics/bids-heatmap', [\App\Http\Controllers\Exhibitor\AnalyticsController::class, 'bidsHeatmap']);
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

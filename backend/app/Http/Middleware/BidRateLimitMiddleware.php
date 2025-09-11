<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Services\AuctionLoggingService;

class BidRateLimitMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'المصادقة مطلوبة'
            ], 401);
        }

        $userId = $user->id;
        $auctionId = $request->input('auction_id');
        
        // Rate limiting rules
        $rules = [
            'per_minute' => 5,    // Maximum 5 bids per minute per user
            'per_auction_per_minute' => 3, // Maximum 3 bids per auction per minute per user
            'per_hour' => 50,     // Maximum 50 bids per hour per user
        ];

        $now = now();
        $minuteKey = "bid_rate_limit:user:{$userId}:minute:" . $now->format('Y-m-d-H-i');
        $auctionMinuteKey = "bid_rate_limit:user:{$userId}:auction:{$auctionId}:minute:" . $now->format('Y-m-d-H-i');
        $hourKey = "bid_rate_limit:user:{$userId}:hour:" . $now->format('Y-m-d-H');

        // Check per-minute limit
        $minuteCount = Cache::get($minuteKey, 0);
        if ($minuteCount >= $rules['per_minute']) {
            AuctionLoggingService::logRateLimitViolation($user, 'per_minute', $minuteCount, $rules['per_minute'], $request);

            return response()->json([
                'status' => 'error',
                'message' => 'تم تجاوز الحد الأقصى للمزايدات في الدقيقة. يرجى الانتظار قليلاً',
                'retry_after' => 60 - $now->second
            ], 429);
        }

        // Check per-auction per-minute limit
        if ($auctionId) {
            $auctionMinuteCount = Cache::get($auctionMinuteKey, 0);
            if ($auctionMinuteCount >= $rules['per_auction_per_minute']) {
                AuctionLoggingService::logRateLimitViolation($user, 'per_auction_per_minute', $auctionMinuteCount, $rules['per_auction_per_minute'], $request);

                return response()->json([
                    'status' => 'error',
                    'message' => 'تم تجاوز الحد الأقصى للمزايدات على هذا المزاد في الدقيقة. يرجى الانتظار قليلاً',
                    'retry_after' => 60 - $now->second
                ], 429);
            }
        }

        // Check per-hour limit
        $hourCount = Cache::get($hourKey, 0);
        if ($hourCount >= $rules['per_hour']) {
            AuctionLoggingService::logRateLimitViolation($user, 'per_hour', $hourCount, $rules['per_hour'], $request);

            return response()->json([
                'status' => 'error',
                'message' => 'تم تجاوز الحد الأقصى للمزايدات في الساعة. يرجى المحاولة لاحقاً',
                'retry_after' => 3600 - ($now->minute * 60 + $now->second)
            ], 429);
        }

        // Increment counters
        Cache::put($minuteKey, $minuteCount + 1, 60);
        if ($auctionId) {
            Cache::put($auctionMinuteKey, $auctionMinuteCount + 1, 60);
        }
        Cache::put($hourKey, $hourCount + 1, 3600);

        return $next($request);
    }
}

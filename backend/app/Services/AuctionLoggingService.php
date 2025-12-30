<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AuctionLoggingService
{
    public static function logAuctionCreation($auction, $user, Request $request)
    {
        Log::info('Auction created successfully', [
            'auction_id' => $auction->id,
            'user_id' => $user->id,
            'car_id' => $auction->car_id,
            'starting_bid' => $auction->starting_bid, // ✅ now safe
            'reserve_price' => $auction->reserve_price,
            'start_time' => $auction->start_time,
            'end_time' => $auction->end_time,
            'status' => $auction->status->value ?? $auction->status,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'timestamp' => now()->toISOString()
        ]);
    }

    public static function logBidAttempt($user, $auction, $bidAmount, Request $request)
    {
        Log::info('Bid placement attempt', [
            'user_id' => $user->id,
            'auction_id' => $auction->id,
            'bid_amount' => $bidAmount,
            'current_bid' => $auction->current_bid,
            'auction_type' => $auction->auction_type instanceof \BackedEnum ? $auction->auction_type->value : $auction->auction_type,
            'car_id' => $auction->car_id,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'timestamp' => now()->toISOString()
        ]);
    }

    public static function logBidSuccess($bid, $auction, $user, Request $request)
    {
        Log::info('Bid placed successfully', [
            'bid_id' => $bid->id,
            'user_id' => $user->id,
            'auction_id' => $auction->id,
            'bid_amount' => $bid->bid_amount,
            'previous_bid' => (float)($auction->current_bid ?? 0) - (float)($bid->increment ?? 0),
            'increment' => $bid->increment,
            'auction_type' => $auction->auction_type instanceof \BackedEnum ? $auction->auction_type->value : $auction->auction_type,
            'car_id' => $auction->car_id,
            'ip' => $request->ip(),
            'timestamp' => now()->toISOString()
        ]);
    }

    public static function logAuctionStatusChange($auction, $oldStatus, $newStatus, $user = null)
    {
        Log::info('Auction status changed', [
            'auction_id' => $auction->id,
            'car_id' => $auction->car_id,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'changed_by' => $user ? $user->id : 'system',
            'timestamp' => now()->toISOString()
        ]);
    }

    public static function logAuctionCancellation($auction, $user, Request $request)
    {
        Log::info('Auction cancelled', [
            'auction_id' => $auction->id,
            'user_id' => $user->id,
            'car_id' => $auction->car_id,
            'reason' => 'User cancellation',
            'ip' => $request->ip(),
            'timestamp' => now()->toISOString()
        ]);
    }

    public static function logValidationFailure($errors, $user, Request $request, $context = 'auction')
    {
        Log::warning("{$context} validation failed", [
            'user_id' => $user ? $user->id : null,
            'errors' => $errors,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'timestamp' => now()->toISOString()
        ]);
    }

    public static function logRateLimitViolation($user, $limitType, $count, $limit, Request $request)
    {
        Log::warning('Rate limit violation', [
            'user_id' => $user->id,
            'limit_type' => $limitType,
            'current_count' => $count,
            'limit' => $limit,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'timestamp' => now()->toISOString()
        ]);
    }
}

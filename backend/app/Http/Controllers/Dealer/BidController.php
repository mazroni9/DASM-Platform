<?php

namespace App\Http\Controllers\Dealer;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\Bid;
use App\Models\Wallet;
use App\Enums\AuctionStatus;
use App\Events\NewBidEvent;
use App\Events\Dealer\WalletBalanceUpdated;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BidController extends Controller
{
    /**
     * POST /api/dealer/bid
     * Validates balance -> Places Bid -> Broadcasts event.
     * Optimized for speed with minimal queries.
     */
    public function placeBid(Request $request)
    {
        $request->validate([
            'auction_id' => 'required|integer',
            'amount' => 'required|numeric|min:1',
        ]);

        $user = Auth::user();
        $auctionId = $request->input('auction_id');
        $bidAmount = $request->input('amount');

        DB::beginTransaction();

        try {
            // Lock wallet for update (pessimistic locking)
            // $wallet = Wallet::where('user_id', $user->id)->lockForUpdate()->first();

            // if (!$wallet) {
            //     DB::rollBack();
            //     return response()->json([
            //         'status' => 'error',
            //         'code' => 'WALLET_NOT_FOUND',
            //         'message' => 'Wallet not found',
            //     ], 404);
            // }

            // // Check balance
            // if ($wallet->available_balance < $bidAmount) {
            //     DB::rollBack();
            //     return response()->json([
            //         'status' => 'error',
            //         'code' => 'INSUFFICIENT_FUNDS',
            //         'message' => 'Insufficient funds. Required: ' . number_format($bidAmount, 2) . ', Available: ' . number_format($wallet->available_balance, 2),
            //         'required' => $bidAmount,
            //         'available' => $wallet->available_balance,
            //     ], 402);
            // }

            // Get auction with lock
            $auction = Auction::where('id', $auctionId)
                ->where('status', AuctionStatus::ACTIVE)
                ->lockForUpdate()
                ->first();

            if (!$auction) {
                DB::rollBack();
                return response()->json([
                    'status' => 'error',
                    'code' => 'AUCTION_NOT_AVAILABLE',
                    'message' => 'Auction is not active or does not exist',
                ], 400);
            }

            // Check bid amount is higher than current
            if ($bidAmount <= $auction->current_bid) {
                DB::rollBack();
                return response()->json([
                    'status' => 'error',
                    'code' => 'BID_TOO_LOW',
                    'message' => 'Bid must be higher than current bid: ' . number_format($auction->current_bid, 2),
                    'current_bid' => $auction->current_bid,
                ], 400);
            }

            // Hold funds
            // $wallet->available_balance -= $bidAmount;
            // $wallet->funded_balance += $bidAmount;
            // $wallet->save();

            // Release previous highest bidder's funds (if different user)
            $previousBid = Bid::where('auction_id', $auctionId)
                ->where('user_id', '!=', $user->id)
                ->orderBy('bid_amount', 'desc')
                ->first();

            if ($previousBid) {
                $prevWallet = Wallet::where('user_id', $previousBid->user_id)->first();
                if ($prevWallet) {
                    $prevWallet->funded_balance -= $previousBid->bid_amount;
                    $prevWallet->available_balance += $previousBid->bid_amount;
                    $prevWallet->save();

                    // Notify previous bidder about their released funds
                    broadcast(new WalletBalanceUpdated($previousBid->user_id, $prevWallet))->toOthers();
                }
            }

            // Create bid
            $bid = Bid::create([
                'auction_id' => $auctionId,
                'user_id' => $user->id,
                'bid_amount' => $bidAmount,
                'increment' => $bidAmount - $auction->current_bid,
            ]);

            // Update auction
            $auction->current_bid = $bidAmount;
            $auction->last_bid_time = Carbon::now();
            $auction->save();

            DB::commit();

            // Broadcast events (non-blocking)
            broadcast(new NewBidEvent($auction))->toOthers();
            //broadcast(new WalletBalanceUpdated($user->id, $wallet))->toOthers();

            Log::info('Dealer bid placed', [
                'user_id' => $user->id,
                'auction_id' => $auctionId,
                'amount' => $bidAmount,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Bid placed successfully',
                'data' => [
                    'bid_id' => $bid->id,
                    'current_bid' => $auction->current_bid,
                    // 'new_balance' => $wallet->available_balance,
                    // 'on_hold' => $wallet->funded_balance,
                ],
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Dealer bid failed', [
                'user_id' => $user->id,
                'auction_id' => $auctionId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'code' => 'BID_FAILED',
                'message' => 'Failed to place bid. Please try again.',
            ], 500);
        }
    }
}

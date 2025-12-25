<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AutoBid;
use App\Models\Auction;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class AutoBidController extends Controller
{
    /**
     * Store a new auto bid configuration
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            // Validate request data
            $data = $request->validate([
                'itemId'    => 'required|integer|exists:auctions,id',
                'increment' => 'required|numeric|min:200',
                'maximum'   => 'required|numeric|gt:0',
            ]);

            $auction = Auction::findOrFail($data['itemId']);
            $user    = Auth::user();

            // Check if auction is active (using model helper)
            if (!$auction->isActive()) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'لا يمكن تفعيل المزايدة التلقائية على مزاد غير نشط',
                ], 400);
            }

            // Check if max bid is greater than current bid
            if ($data['maximum'] <= ($auction->current_bid ?? 0)) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'يجب أن يكون الحد الأقصى للمزايدة التلقائية أكبر من السعر الحالي',
                ], 400);
            }

            // Delete any existing auto bid for this user and auction
            AutoBid::where('user_id', $user->id)
                ->where('auction_id', $auction->id)
                ->delete();

            // Create new auto bid configuration
            $autoBid              = new AutoBid();
            $autoBid->user_id     = $user->id;
            $autoBid->auction_id  = $auction->id;
            $autoBid->increment   = $data['increment'];
            $autoBid->maximum     = $data['maximum'];
            $autoBid->is_active   = true;
            $autoBid->save();

            // Process an immediate auto-bid if needed
            $this->processAutoBid($auction, $user->id);

            return response()->json([
                'status'  => 'success',
                'message' => 'تم تفعيل المزايدة التلقائية بنجاح',
                'data'    => [
                    'id'        => $autoBid->id,
                    'increment' => $autoBid->increment,
                    'maximum'   => $autoBid->maximum,
                    'is_active' => $autoBid->is_active,
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'بيانات غير صالحة',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating auto bid: ' . $e->getMessage());

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء تفعيل المزايدة التلقائية',
            ], 500);
        }
    }

    /**
     * Get auto bid status for a specific auction
     *
     * @param  int  $itemId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getStatus($itemId)
    {
        try {
            $user = Auth::user();

            $autoBid = AutoBid::where('user_id', $user->id)
                ->where('auction_id', $itemId)
                ->where('is_active', true)
                ->first();

            if (!$autoBid) {
                return response()->json([
                    'status' => 'success',
                    'active' => false,
                ]);
            }

            return response()->json([
                'status'    => 'success',
                'active'    => true,
                'increment' => $autoBid->increment,
                'maximum'   => $autoBid->maximum,
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting auto bid status: ' . $e->getMessage());

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء التحقق من حالة المزايدة التلقائية',
            ], 500);
        }
    }

    /**
     * Disable/delete auto bid configuration
     *
     * @param  int  $itemId
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($itemId)
    {
        try {
            $user = Auth::user();

            $deleted = AutoBid::where('user_id', $user->id)
                ->where('auction_id', $itemId)
                ->delete();

            if (!$deleted) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'لم يتم العثور على إعدادات المزايدة التلقائية',
                ], 404);
            }

            return response()->json([
                'status'  => 'success',
                'message' => 'تم إلغاء المزايدة التلقائية بنجاح',
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting auto bid: ' . $e->getMessage());

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء إلغاء المزايدة التلقائية',
            ], 500);
        }
    }

    /**
     * Process auto bids for an auction when a new bid is placed
     *
     * @param  \App\Models\Auction  $auction
     * @param  int|null  $excludeUserId
     * @return void
     */
    private function processAutoBid(Auction $auction, $excludeUserId = null): void
    {
        try {
            // Get highest bid and bidder (based on bid_amount)
            $highestBidRecord = $auction->bids()
                ->orderBy('bid_amount', 'desc')
                ->first();

            $highestBid      = $highestBidRecord ? $highestBidRecord->bid_amount : ($auction->current_bid ?? 0);
            $highestBidderId = $highestBidRecord?->user_id;

            // Find all active auto bids for this auction except for highest bidder / excluded user
            $autoBids = AutoBid::where('auction_id', $auction->id)
                ->where('is_active', true)
                ->where('maximum', '>', $highestBid)
                ->when($highestBidderId, function ($query) use ($highestBidderId) {
                    $query->where('user_id', '!=', $highestBidderId);
                })
                ->when($excludeUserId, function ($query) use ($excludeUserId) {
                    $query->where('user_id', '!=', $excludeUserId);
                })
                ->get();

            if ($autoBids->isEmpty()) {
                return;
            }

            // Sort auto bids by maximum amount (highest first)
            $autoBids       = $autoBids->sortByDesc('maximum')->values();
            $winningAutoBid = $autoBids[0];
            $nextHighestMax = $autoBids->count() > 1 ? $autoBids[1]->maximum : $highestBid;

            // Calculate the new bid amount
            $newBidAmount = min(
                $winningAutoBid->maximum,
                $nextHighestMax + $winningAutoBid->increment
            );

            // Place the bid through BidController so all logic (including 5-min extension) runs
            $bidController = new BidController();
            $request       = new Request([
                'itemId' => $auction->id,
                'amount' => $newBidAmount,
            ]);

            // Temporarily authenticate as the auto-bidding user
            $originalUser = Auth::user();
            $autoUser     = \App\Models\User::find($winningAutoBid->user_id);

            if (!$autoUser) {
                return;
            }

            Auth::login($autoUser);

            $response = $bidController->placeBid($request);

            // Restore original authentication
            if ($originalUser) {
                Auth::login($originalUser);
            } else {
                Auth::logout();
            }

            // Log auto-bid activity
            Log::info('Auto bid processed', [
                'auction_id' => $auction->id,
                'user_id'    => $winningAutoBid->user_id,
                'amount'     => $newBidAmount,
                'result'     => method_exists($response, 'getContent')
                    ? json_decode($response->getContent(), true)
                    : null,
            ]);
        } catch (\Exception $e) {
            Log::error('Error processing auto bid: ' . $e->getMessage(), [
                'auction_id'     => $auction->id ?? null,
                'exclude_userId' => $excludeUserId,
            ]);
        }
    }
}

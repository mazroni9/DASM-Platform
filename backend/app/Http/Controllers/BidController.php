<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Bid;
use App\Models\User;
use App\Models\Wallet;
use App\Models\Auction;
use App\Events\NewBidEvent;
use App\Enums\AuctionStatus;
use Illuminate\Http\Request;
use App\Models\CommissionTier;
use App\Events\PublicMessageEvent;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Notifications\NewBidNotification;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Validator;
use App\Notifications\HigherBidNotification;
use Illuminate\Support\Facades\Notification;

class BidController extends Controller
{
    /**
     * Display a listing of bids for an auction
     *
     * @param int $auctionId
     * @return \Illuminate\Http\JsonResponse
     */
    public function index($auctionId)
    {
        $auction = Auction::find($auctionId);

        if (!$auction) {
            return response()->json([
                'status' => 'error',
                'message' => 'Auction not found'
            ], 404);
        }

        $bids = $auction->bids()
            ->with('user:id')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'status' => 'success',
            'data' => $bids,
            'auction' => [
                'id' => $auction->id,
                'current_bid' => $auction->current_bid,
                'status' => [
                    'value' => $auction->status->value,
                    'label' => $auction->status->label(),
                ],
                'time_remaining' => $auction->time_remaining
            ]
        ]);
    }

    /**
     * Place a bid on an auction
     *
     * @param Request $request
     * @param int $auctionId
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request, $auctionId)
    {
        $validator = Validator::make($request->all(), [
            'bid_amount' => 'required|numeric|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $auction = Auction::find($auctionId);

        if (!$auction) {
            return response()->json([
                'status' => 'error',
                'message' => 'Auction not found'
            ], 404);
        }

        // Check if auction is active
        if ($auction->status !== AuctionStatus::ACTIVE) {
            return response()->json([
                'status' => 'error',
                'message' => 'Bids can only be placed on active auctions'
            ], 400);
        }

        // Update auction time status if needed
        $auction->updateStatusBasedOnTime();

        // Double check it's still active after potential status update
        if ($auction->status !== AuctionStatus::ACTIVE) {
            return response()->json([
                'status' => 'error',
                'message' => 'This auction has already ended'
            ], 400);
        }

        $bidAmount = $request->bid_amount;

        // Check if bid is higher than current bid
        if ($bidAmount <= $auction->current_bid) {
            return response()->json([
                'status' => 'error',
                'message' => 'Bid must be higher than the current bid of ' . $auction->current_bid
            ], 400);
        }

        // Check if car owner is trying to bid on their own auction
        if ($auction->car->dealer_id === Auth::user()->dealer->id ?? null) {
            return response()->json([
                'status' => 'error',
                'message' => 'You cannot bid on your own auction'
            ], 400);
        }

        // Check if user has enough funds in wallet
        $wallet = Wallet::where('user_id', Auth::id())->first();

        if (!$wallet || $wallet->available_balance < $bidAmount) {
            return response()->json([
                'status' => 'error',
                'message' => 'Insufficient funds in your wallet'
            ], 400);
        }

        try {
            // Start database transaction
            DB::beginTransaction();

            // Create the bid
            $bid = new Bid();
            $bid->auction_id = $auctionId;
            $bid->user_id = Auth::id();
            $bid->bid_amount = $bidAmount;
            $bid->save();

            // Update auction with new current bid
            $auction->current_bid = $bidAmount;
            $auction->save();

            // Reserve the funds in wallet (Move from available to funded)
            $wallet->available_balance -= $bidAmount;
            $wallet->funded_balance += $bidAmount;
            $wallet->save();

            // If there was a previous highest bid from another user, release their funds
            $previousHighestBidFromOthers = Bid::where('auction_id', $auctionId)
                ->where('user_id', '!=', Auth::id())
                ->where('bid_amount', '<', $bidAmount)
                ->orderBy('bid_amount', 'desc')
                ->first();

            if ($previousHighestBidFromOthers) {
                $previousUserWallet = Wallet::where('user_id', $previousHighestBidFromOthers->user_id)->first();
                if ($previousUserWallet) {
                    $previousUserWallet->funded_balance -= $previousHighestBidFromOthers->bid_amount;
                    $previousUserWallet->available_balance += $previousHighestBidFromOthers->bid_amount;
                    $previousUserWallet->save();
                }
            }

            DB::commit();
            $user = $auction->car->owner;

            // Notify dealer of new bid (could be done with events)
            // BidPlaced::dispatch($bid);

            return response()->json([
                'status' => 'success',
                'message' => 'Bid placed successfully',
                'data' => [
                    'bid' => $bid,
                    'auction' => [
                        'id' => $auction->id,
                        'current_bid' => $auction->current_bid,
                        'time_remaining' => $auction->time_remaining
                    ]
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'status' => 'error',
                'message' => 'Error placing bid: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a user's bidding history
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function myBidHistory()
    {
        $userId = Auth::id();

        $bids = Bid::with(['auction', 'auction.car'])
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        // Group bids by auction
        $auctionsWithBids = [];
        foreach ($bids as $bid) {
            $auctionId = $bid->auction_id;
            if (!isset($auctionsWithBids[$auctionId])) {
                $auction = $bid->auction;
                $auctionsWithBids[$auctionId] = [
                    'auction_id' => $auctionId,
                    'car' => $auction->car,
                    'status' => $auction->status->value,
                    'status_label' => $auction->status->label(),
                    'current_bid' => $auction->current_bid,
                    'end_time' => $auction->end_time,
                    'won' => $auction->status === AuctionStatus::ENDED &&
                             $auction->highestBidder() &&
                             $auction->highestBidder()->id === $userId,
                    'bids' => []
                ];
            }

            $auctionsWithBids[$auctionId]['bids'][] = [
                'amount' => $bid->bid_amount,
                'time' => $bid->created_at,
                'is_winning' => $bid->bid_amount === $bid->auction->current_bid
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => array_values($auctionsWithBids),
            'pagination' => [
                'total' => $bids->total(),
                'per_page' => $bids->perPage(),
                'current_page' => $bids->currentPage(),
                'last_page' => $bids->lastPage()
            ]
        ]);
    }

    /**
     * Get a leaderboard of top bidders for an auction
     *
     * @param int $auctionId
     * @return \Illuminate\Http\JsonResponse
     */
    public function leaderboard($auctionId)
    {
        $auction = Auction::find($auctionId);

        if (!$auction) {
            return response()->json([
                'status' => 'error',
                'message' => 'Auction not found'
            ], 404);
        }

        $topBidders = $auction->bids()
            ->select('user_id', DB::raw('MAX(bid_amount) as highest_bid'), DB::raw('COUNT(*) as bid_count'))
            ->groupBy('user_id')
            ->orderBy('highest_bid', 'desc')
            ->with('user:id,name')
            ->take(10)
            ->get()
            ->map(function($bid) use ($auction) {
                return [
                    'user_id' => $bid->user_id,
                    'name' => $bid->user->name,
                    'highest_bid' => $bid->highest_bid,
                    'is_highest' => $bid->highest_bid == $auction->current_bid,
                    'bid_count' => $bid->bid_count
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $topBidders,
            'auction' => [
                'id' => $auction->id,
                'current_bid' => $auction->current_bid,
                'status' => $auction->status->value,
                'time_remaining' => $auction->time_remaining
            ]
        ]);
    }

    /**
     * Check if a user's bid is still the highest
     *
     * @param int $bidId
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkBidStatus($bidId)
    {
        $bid = Bid::with('auction')->find($bidId);

        if (!$bid || $bid->user_id !== Auth::id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Bid not found'
            ], 404);
        }

        $auction = $bid->auction;
        $isHighestBid = $bid->bid_amount == $auction->current_bid;
        $outbidAmount = $isHighestBid ? null : $auction->current_bid;

        return response()->json([
            'status' => 'success',
            'data' => [
                'is_highest_bid' => $isHighestBid,
                'outbid_by' => $outbidAmount ? ($outbidAmount - $bid->bid_amount) : 0,
                'current_highest' => $auction->current_bid,
                'auction_status' => $auction->status->value,
                'time_remaining' => $auction->time_remaining
            ]
        ]);
    }

    /**
     * Place a bid using the simplified endpoint
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function placeBid(Request $request)
    {
        try {

            $user=Auth::user();
            // Validate incoming request
            $data = $request->validate([
                'auction_id' => 'required|integer|exists:auctions,id',
                'bid_amount' => 'required|numeric|min:1',
                'user_id' => 'required|numeric'
            ]);

            $auction = Auction::select('id','car_id','current_bid','minimum_bid','maximum_bid','last_bid_time','status','start_time','end_time','starting_bid')
            ->withCount('bids')
            ->find($data['auction_id']);

            // Check if auction is active
            if ($auction->status !== AuctionStatus::ACTIVE) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'المزاد غير نشط حالياً'
                ], 400);
            }

            // Check if auction has ended
            if ($auction->end_date && now() > $auction->end_date) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'انتهى وقت المزاد'
                ], 400);
            }

            // $evaluation_price = $auction->car?->evaluation_price;
            // $commission = CommissionTier::getCommissionForPrice($evaluation_price);
            // $available_balance = $user->wallet?->available_balance ?? 0;

            // if ($available_balance <  $commission) {
            //     return response()->json([
            //         'status' => 'error',
            //         'message' => 'ليس لديك رصيد كافي للمزايدة. يجب أن يكون لديك على الأقل ' . number_format($commission, 2) . ' ريال في محفظتك. رصيدك الحالي: ' . number_format($available_balance, 2) . ' ريال. الرجاء شحن محفظتك لتتمكن من المزايدة'
            //     ], 400);
            // }

            // $user->wallet->available_balance -= $commission;
            // $user->wallet->save();
            // Check if the bid amount is higher than the current price
            if ($data['bid_amount'] <= $auction->current_bid || $data['bid_amount'] <= $auction->minimum_bid) {
                return response()->json([
                    'status' => 'error',
                    'message' => '  يجب أن يكون مبلغ المزايدة أعلى من السعر الحالي أو سعر الأفتتاح'
                ], 400);
            }

            // Create the bid
            $bid = new Bid();
            $bid->auction_id = $auction->id;
            $bid->user_id = $user->id;
            $bid->bid_amount = $data['bid_amount'];
            $bid->increment =  $data['bid_amount'] - $auction->current_bid;
            $bid->save();

            // Update the auction's current price
            $auction->current_bid = $data['bid_amount'];
            $auction->last_bid_time = Carbon::now()->toDateTimeString();
            $auction->minimum_bid=Bid::where('auction_id',$data['auction_id'])->min('bid_amount');
            $auction->maximum_bid=Bid::where('auction_id',$data['auction_id'])->max('bid_amount');
            $auction->save();

            // Trigger event for real-time updates (if using broadcasting)
            // event(new \App\Events\NewBidPlaced($bid));

            // Broadcast the new bid event
            $channelName = "auction";
            $message = "new bid";
            //return config('broadcasting.connections.ably');
            //broadcast(new PublicMessageEvent( $channelName, $message ));

            broadcast(new NewBidEvent($auction));

            $owner = $auction->car->owner;
            $owner = User::find($owner->id);

            $owner->notify(new NewBidNotification($auction));

            $users_ids = $auction->bids()->where('user_id','!=',$user->id)
            ->select('user_id')
            ->groupBy('user_id')->pluck('user_id')
            ->toArray();

            $users = User::whereIn('id',$users_ids)->get();
            Notification::sendNow($users, new HigherBidNotification($auction));


            return response()->json([
                'status' => 'success',
                'message' => 'تم تقديم العرض بنجاح',
                'data' => [
                    'bid_id' => $bid->id,
                    'bid_amount' => $bid->bid_amount,
                    'created_at' => $bid->created_at,
                    'auction_id' => $auction->id,
                    'current_bid' => $auction->current_bid
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'بيانات غير صالحة',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error placing bid: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' =>  $e->getMessage()
            ], 500);
        }
    }


    public function latestBids($auctionId)
    {
        $auction = Auction::find($auctionId);

        if (!$auction) {
            return response()->json([
                'status' => 'error',
                'message' => 'Auction not found'
            ], 404);
        }

        $bids = $auction->bids()
            ->with('user:id')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json([
            'status' => 'success',
            'data' => $bids,
            'auction' => [
                'id' => $auction->id,
                'current_bid' => $auction->current_bid,
                'status' => [
                    'value' => $auction->status->value,
                    'label' => $auction->status->label(),
                ],
                'time_remaining' => $auction->time_remaining
            ]
        ]);
    }
}

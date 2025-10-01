<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Bid;
use App\Models\User;
use App\Models\Wallet;
use App\Models\Auction;
use App\Models\BidEvent;
use App\Events\NewBidEvent;
use App\Enums\AuctionStatus;
use Illuminate\Http\Request;
use App\Models\CommissionTier;
use App\Services\BidEventService;
use App\Events\LiveMarketBidEvent;
use App\Events\PublicMessageEvent;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Services\AuctionLoggingService;
use App\Notifications\NewBidNotification;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Validator;
use App\Http\Resources\UserBidLogResource;
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

    public function UserBidHistory()
    {
        $userId = Auth::id();
        $bid_events = BidEvent::with('auction')->where('bidder_id', $userId)->orderBy('created_at', 'desc')
        ->paginate(15);
       $data  = UserBidLogResource::collection($bid_events);
       return response()->json([
            'status' => 'success',
            'data' => $data,
        ]);
    }
    /**
     * Get a user's bidding history
     *
     * @return \Illuminate\Http\JsonResponse
     */
   /*  public function myBidHistory()
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
 */
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
    public function placeBid(Request $request, BidEventService $bidEventService)
    {
        try {
            $user = Auth::user();

            // Enhanced validation rules
            $data = $request->validate([
                'auction_id' => 'required|integer|exists:auctions,id',
                'bid_amount' => [
                    'required',
                    'numeric',
                    'min:1',
                    'max:999999999.99',
                    'regex:/^\d+(\.\d{1,2})?$/'
                ],
                'user_id' => 'required|numeric|exists:users,id'
            ], [
                'auction_id.required' => 'معرف المزاد مطلوب',
                'auction_id.exists' => 'المزاد غير موجود',
                'bid_amount.required' => 'مبلغ المزايدة مطلوب',
                'bid_amount.numeric' => 'مبلغ المزايدة يجب أن يكون رقماً',
                'bid_amount.min' => 'مبلغ المزايدة يجب أن يكون أكبر من صفر',
                'bid_amount.max' => 'مبلغ المزايدة كبير جداً',
                'bid_amount.regex' => 'تنسيق مبلغ المزايدة غير صحيح',
                'user_id.required' => 'معرف المستخدم مطلوب',
                'user_id.exists' => 'المستخدم غير موجود'
            ]);

            $auction = Auction::select('id','car_id','current_bid','minimum_bid','maximum_bid','last_bid_time','status','start_time','end_time','starting_bid','auction_type','reserve_price','opening_price')
            ->with(['car'])
            ->withCount('bids')
            ->with('car:id,dealer_id,user_id')
            ->find($data['auction_id']);

            // Validate auction exists
            if (!$auction) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'المزاد غير موجود'
                ], 404);
            }

            // Check if auction is active
            if ($auction->status !== AuctionStatus::ACTIVE) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'المزاد غير نشط حالياً'
                ], 400);
            }

            // Validate user authorization
            if ($user->id != $data['user_id']) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'غير مصرح لك بالمزايدة نيابة عن مستخدم آخر'
                ], 403);
            }

            // Check if user is trying to bid on their own auction
            $isOwner = false;
            if ($auction->car->dealer_id && $user->dealer && $auction->car->dealer_id === $user->dealer->id) {
                $isOwner = true;
            } elseif ($auction->car->user_id === $user->id) {
                $isOwner = true;
            }

            if ($isOwner) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'لا يمكنك المزايدة على مزادك الخاص'
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
            // Enhanced bid amount validation
            $minBidAmount = max($auction->current_bid, $auction->minimum_bid, $auction->starting_bid);

            if ($data['bid_amount'] <= $minBidAmount) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'يجب أن يكون مبلغ المزايدة أعلى من ' . number_format($minBidAmount, 2) . ' ريال'
                ], 400);
            }

            // Validate bid amount for instant auctions
            if (in_array($auction->auction_type, ['live_instant', 'silent_instant'])) {
                $openingPrice = $auction->opening_price ?? $auction->starting_bid;
                $minAllowed = $openingPrice * 0.9; // -10%
                $maxAllowed = $openingPrice * 1.3; // +30%

                if ($data['bid_amount'] < $minAllowed || $data['bid_amount'] > $maxAllowed) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'مبلغ المزايدة يجب أن يكون بين ' . number_format($minAllowed, 2) . ' و ' . number_format($maxAllowed, 2) . ' ريال'
                    ], 400);
                }
            }

            // Check for reasonable bid increment (minimum 1% of current bid)
            $minIncrement = max($auction->current_bid * 0.01, 100);
            if ($data['bid_amount'] - $auction->current_bid < $minIncrement) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'الزيادة في المزايدة يجب أن تكون على الأقل ' . number_format($minIncrement, 2) . ' ريال'
                ], 400);
            }

            // Log bid attempt
            AuctionLoggingService::logBidAttempt($user, $auction, $data['bid_amount'], $request);
            $last_bid = $auction->bids()->latest()->first();
            // Create the bid
            $bid = Bid::create([
                'auction_id' => $auction->id,
                'user_id' => $user->id,
                'bid_amount' => $data['bid_amount'],
                'increment' =>  $data['bid_amount'] - $auction->current_bid
            ]);

            // Update the auction's current price
            $auction->update([
                'current_bid' => $data['bid_amount'],
                'last_bid_time' => Carbon::now()->toDateTimeString(),
                'minimum_bid' => Bid::where('auction_id',$data['auction_id'])->min('bid_amount'),
                'maximum_bid' => Bid::where('auction_id',$data['auction_id'])->max('bid_amount')
            ]);

            //bid logs
            $bidEventService->log('bid_placed', $auction, $request, ['bid' => $bid, 'user' => $user]);

            if ($last_bid) {
                $bidEventService->log('outbid', $auction, $request, [
                    'last_bid' => $last_bid,
                    'new_bid' => $bid
                ]);
            }




            // Log successful bid placement
            AuctionLoggingService::logBidSuccess($bid, $auction, $user, $request);

            // Trigger event for real-time updates (if using broadcasting)
            // event(new \App\Events\NewBidPlaced($bid));

            // Broadcast the new bid event
            $channelName = "auction";
            $message = "new bid";
            //return config('broadcasting.connections.ably');
            //broadcast(new PublicMessageEvent( $channelName, $message ));

            // Log broadcasting attempt
            \Illuminate\Support\Facades\Log::info('Broadcasting bid event', [
                'auction_id' => $auction->id,
                'bid_id' => $bid->id,
                'user_id' => $user->id,
                'timestamp' => now()->toISOString()
            ]);

            broadcast(new NewBidEvent($auction));

            // Broadcast live market bid event for notifications (excludes the bidder)
            broadcast(new LiveMarketBidEvent($user->id, $auction, $data['bid_amount'], $auction->car));

            $owner = $auction->car->owner;
            $owner = User::find($owner->id);

            // Log notification to auction owner
            \Illuminate\Support\Facades\Log::info('Sending notification to auction owner', [
                'auction_id' => $auction->id,
                'owner_id' => $owner->id,
                'bid_id' => $bid->id,
                'timestamp' => now()->toISOString()
            ]);

            $owner->notify(new NewBidNotification($auction));

            $users_ids = $auction->bids()->where('user_id','!=',$user->id)
            ->select('user_id')
            ->groupBy('user_id')->pluck('user_id')
            ->toArray();

            $users = User::whereIn('id',$users_ids)->get();

            // Log notification to other bidders
            \Illuminate\Support\Facades\Log::info('Sending notifications to other bidders', [
                'auction_id' => $auction->id,
                'bid_id' => $bid->id,
                'recipients_count' => count($users_ids),
                'recipients' => $users_ids,
                'timestamp' => now()->toISOString()
            ]);

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
            \Illuminate\Support\Facades\Log::warning('Bid validation failed', [
                'user_id' => Auth::id(),
                'auction_id' => $request->input('auction_id'),
                'errors' => $e->errors(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'بيانات غير صالحة',
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\QueryException $e) {
            \Illuminate\Support\Facades\Log::error('Database error during bid placement', [
                'user_id' => Auth::id(),
                'auction_id' => $request->input('auction_id'),
                'error' => $e->getMessage(),
                'sql' => $e->getSql(),
                'bindings' => $e->getBindings(),
                'ip' => $request->ip()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'خطأ في قاعدة البيانات. يرجى المحاولة مرة أخرى'
            ], 500);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            \Illuminate\Support\Facades\Log::warning('Model not found during bid placement', [
                'user_id' => Auth::id(),
                'auction_id' => $request->input('auction_id'),
                'error' => $e->getMessage(),
                'ip' => $request->ip()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'المزاد أو المستخدم غير موجود'
            ], 404);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Unexpected error during bid placement', [
                'user_id' => Auth::id(),
                'auction_id' => $request->input('auction_id'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى'
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

<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Bid;
use App\Models\User;
use App\Models\Wallet;
use App\Models\Auction;
use App\Models\BidEvent;
use App\Enums\AuctionType;
use App\Events\NewBidEvent;
use App\Enums\AuctionStatus;
use Illuminate\Http\Request;
use App\Models\CommissionTier;
use App\Services\BidEventService;
use App\Events\LiveMarketBidEvent;
use App\Events\PublicMessageEvent;
use Illuminate\Support\Facades\DB;
use App\Jobs\ProcessAuctionSaleJob;
use Illuminate\Support\Facades\Log;
use function Laravel\Prompts\select;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
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
     * Place a bid on an auction (old endpoint)
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
        if ($auction->car->user_id === Auth::id()) {
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
            Cache::flush();
            $user = $auction->car->owner;

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


    public function UserBidHistory(Request $request)
    {
        $userId = Auth::id();

        $bidEventsQuery = BidEvent::with('auction')
            ->where('bidder_id', $userId)
            ->orderBy('server_ts_utc', 'desc');

        // Clone the query for stats calculation to avoid affecting the main query
        $statsQuery = (clone $bidEventsQuery);

        $stats = [
            'total'      => $statsQuery->count(),
            'bid_placed'     => (clone $statsQuery)->where('event_type', 'bid_placed')->count(),
            'outbid'     => (clone $statsQuery)->where('event_type', 'outbid')->count(),
        ];
        $auctions_ids = (clone $bidEventsQuery)->pluck('auction_id')->unique()->toArray();

        $bid_events = $bidEventsQuery
            ->when($request->filter, function ($query, $filter) {
                if ($filter === 'all') {
                    return $query;
                }
                return $query->where('event_type', $filter);
            })
            ->when($request->auction_id, function ($query, $auctionId) {
                return $query->where('auction_id', $auctionId);
            })
            ->paginate(3);

        $data  = UserBidLogResource::collection($bid_events);

        return response()->json([
            'status' => 'success',
            'data' => $data,
            'pagination' => [
                'total' => $bid_events->total(),
                'per_page' => $bid_events->perPage(),
                'current_page' => $bid_events->currentPage(),
                'last_page' => $bid_events->lastPage()
            ],
            'stats' => $stats,
            'auctions_ids' => (array)$auctions_ids
        ]);
    }

    /**
     * Get a user's bidding history (grouped by auctions)
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
            ->map(function ($bid) use ($auction) {
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
     * Unified bid endpoint with advanced validation + time extension logic
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Services\BidEventService  $bidEventService
     * @return \Illuminate\Http\JsonResponse
     */
    public function placeBid(Request $request, BidEventService $bidEventService)
    {
        DB::beginTransaction();
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

            $auction = Auction::select(
                'id',
                'car_id',
                'current_bid',
                'minimum_bid',
                'maximum_bid',
                'last_bid_time',
                'status',
                'start_time',
                'end_time',
                'starting_bid',
                'auction_type',
                'reserve_price',
                'opening_price',
                'extended_until'
            )
                ->withCount('bids')
                ->with('car:id,user_id,min_price,max_price')
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
            $isOwner = $auction->car->user_id === $user->id;

            if ($isOwner) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'لا يمكنك المزايدة على مزاد خاص بك'
                ], 400);
            }

            // Check if auction has ended (لو عندك end_date عدله لو لازم)
            if ($auction->end_time && now()->gt(Carbon::parse($auction->extended_until ?? $auction->end_time))) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'انتهى وقت المزاد'
                ], 400);
            }

            // Enhanced bid amount validation
            $minBidAmount = max($auction->current_bid, $auction->minimum_bid, $auction->starting_bid);

            if ($auction->auction_type != AuctionType::SILENT_INSTANT->value) {
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
            }

            // Log bid attempt
            AuctionLoggingService::logBidAttempt($user, $auction, $data['bid_amount'], $request);

            // آخر مزايدة قبل الحالية (مهم لموضوع الفائز)
            $last_bid = $auction->bids()->latest()->first();

            // Create the bid
            $bid = Bid::create([
                'auction_id'        => $auction->id,
                'user_id'           => $user->id,
                'bid_amount'        => $data['bid_amount'],
                'auction_type_at_bid' => $auction->auction_type,
                'increment'         => $data['bid_amount'] - $auction->current_bid
            ]);

            // Update the auction's current price + إحصائيات
            $auction->update([
                'current_bid'  => $data['bid_amount'],
                'last_bid_time' => Carbon::now()->toDateTimeString(),
                'minimum_bid'  => Bid::where('auction_id', $data['auction_id'])->min('bid_amount'),
                'maximum_bid'  => Bid::where('auction_id', $data['auction_id'])->max('bid_amount'),
            ]);

            /**
             * ================================
             *  تمديد الوقت في آخر دقيقة
             *  بشرط وجود "فائز" قبل المزايدة الحالية
             *  الفائز = آخر مزايدة سابقة >= min_price للسيارة
             * ================================
             */
            try {
                // الأنواع المسموح لها بالتمديد
                $extendableTypes = [
                    AuctionType::LIVE->value,
                    AuctionType::LIVE_INSTANT->value,
                    AuctionType::SILENT_INSTANT->value,
                ];

                if (in_array($auction->auction_type, $extendableTypes, true)) {

                    // min_price اللي دخّله صاحب السيارة
                    $minPrice = $auction->car->min_price;

                    // هل كان في فائز قبل المزايدة الحالية؟
                    // "آخر مزايدة" قبل الجديدة لازم تكون >= min_price
                    $hadWinnerBefore = $last_bid && $minPrice !== null && $last_bid->bid_amount >= $minPrice;

                    if ($hadWinnerBefore) {
                        // نحسب وقت الانتهاء الفعلي الحالي (extended_until لو موجود، غير كده end_time)
                        $effectiveEnd = $auction->extended_until
                            ? Carbon::parse($auction->extended_until)
                            : Carbon::parse($auction->end_time);

                        $now = Carbon::now();
                        $secondsToEnd = $now->diffInSeconds($effectiveEnd, false); // موجب لو لسه ما انتهاش

                        // آخر دقيقة (0..60 ثانية قبل النهاية)
                        if ($secondsToEnd > 0 && $secondsToEnd <= 60) {
                            // نمدد 5 دقائق من وقت الانتهاء الفعلي الحالي
                            $newExtendedUntil = $effectiveEnd->copy()->addMinutes(5);
                            $auction->extended_until = $newExtendedUntil;
                            $auction->save();

                            Log::info('Auction time extended (last minute & winner exists)', [
                                'auction_id'        => $auction->id,
                                'previous_end'      => $effectiveEnd->toDateTimeString(),
                                'new_extended_until' => $newExtendedUntil->toDateTimeString(),
                                'last_bid_id'       => $last_bid?->id,
                                'last_bid_amount'   => $last_bid?->bid_amount,
                                'min_price'         => $minPrice,
                            ]);
                        }
                    } else {
                        // مفيش فائز قبل المزايدة الحالية → حتى لو آخر دقيقة، ما نمددش
                        Log::info('No time extension: no winner before current bid', [
                            'auction_id'      => $auction->id,
                            'last_bid_id'     => $last_bid?->id,
                            'last_bid_amount' => $last_bid?->bid_amount,
                            'min_price'       => $minPrice,
                        ]);
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('Failed to process auction time extension', [
                    'auction_id' => $auction->id,
                    'error'      => $e->getMessage(),
                ]);
            }

            //bid logs
            if ($last_bid) {
                $bidEventService->log('outbid', $auction, $request, [
                    'last_bid' => $last_bid,
                    'new_bid' => $bid
                ]);
            }

            $bidEventService->log('bid_placed', $auction, $request, ['bid' => $bid, 'user' => $user]);

            // Log successful bid placement
            AuctionLoggingService::logBidSuccess($bid, $auction, $user, $request);

            // Log broadcasting attempt
            Log::info('Broadcasting bid event', [
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
            Log::info('Sending notification to auction owner', [
                'auction_id' => $auction->id,
                'owner_id' => $owner->id,
                'bid_id' => $bid->id,
                'timestamp' => now()->toISOString()
            ]);

            $owner->notify(new NewBidNotification($auction));

            $users_ids = $auction->bids()->where('user_id', '!=', $user->id)
                ->select('user_id')
                ->groupBy('user_id')->pluck('user_id')
                ->toArray();

            $users = User::whereIn('id', $users_ids)->get();

            // Log notification to other bidders
            Log::info('Sending notifications to other bidders', [
                'auction_id' => $auction->id,
                'bid_id' => $bid->id,
                'recipients_count' => count($users_ids),
                'recipients' => $users_ids,
                'timestamp' => now()->toISOString()
            ]);

            Notification::sendNow($users, new HigherBidNotification($auction));

            // --- NEW LOGIC: Min / Max price auto sale ---
            $min_price = $auction->car->min_price;
            $max_price = $auction->car->max_price;
            $newBidAmount = $bid->bid_amount;

            // Check Max Price (Instant Sale)
            if ($max_price > 0 && $newBidAmount >= $max_price) {
                Log::info("Max price reached for auction {$auction->id}. Dispatching immediate sale job.");

                // Dispatch the job immediately
                ProcessAuctionSaleJob::dispatch($auction->id, $bid->id);

                DB::commit();
                Cache::flush();

                // Return a special status for the frontend
                return response()->json([
                    'status' => 'success_sold',
                    'message' => 'تهانينا! لقد وصلت للحد الأعلى وفزت بالمزاد فوراً.',
                    'data' => ['bid_id' => $bid->id, 'current_bid' => $auction->current_bid]
                ]);
            }

            // Check Min Price - Instant Sale for SILENT_INSTANT (Delayed Market), Delayed Sale for others
            if ($min_price > 0 && $newBidAmount >= $min_price) {
                // SILENT_INSTANT (السوق المتأخر / Delayed Market): Instant sale on min price
                if ($auction->auction_type == AuctionType::SILENT_INSTANT->value) {
                    Log::info("Min price reached for SILENT_INSTANT auction {$auction->id}. Dispatching immediate sale job.");

                    // Dispatch the job immediately for instant sale
                    ProcessAuctionSaleJob::dispatch($auction->id, $bid->id);

                    DB::commit();
                    Cache::flush();

                    // Return a special status for the frontend indicating instant win
                    return response()->json([
                        'status' => 'success_sold',
                        'message' => 'تهانينا! لقد وصلت للحد الأدنى في السوق المتأخر وفزت بالمزاد فوراً.',
                        'data' => ['bid_id' => $bid->id, 'current_bid' => $auction->current_bid]
                    ]);
                } else {
                    // Other auction types: Delayed sale (30 minutes countdown)
                    Log::info("Min price reached for auction {$auction->id}. Dispatching delayed sale job (30 mins).");
                    ProcessAuctionSaleJob::dispatch($auction->id, $bid->id)->delay(now()->addMinutes(30));
                }
            }
            // --- NEW LOGIC ENDS HERE ---

            DB::commit();
            Cache::flush();
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
            Log::warning('Bid validation failed', [
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
            Log::error('Database error during bid placement', [
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
            Log::warning('Model not found during bid placement', [
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
            Log::error('Unexpected error during bid placement', [
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

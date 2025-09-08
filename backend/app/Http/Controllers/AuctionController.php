<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Bid;
use App\Models\Car;
use App\Models\Dealer;
use App\Models\Auction;
use App\Models\Setting;
use App\Enums\AuctionType;
use App\Models\Settlement;
use App\Enums\AuctionStatus;
use Illuminate\Http\Request;
use App\Models\CommissionTier;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AuctionController extends Controller
{
    /**
     * Display a listing of auctions
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $query = Auction::with(['car.dealer', 'bids', 'car', 'broadcasts']);

        // Only show control room approved auctions in public listing by default
        if (!$request->has('control_room_approved')) {
            $query->where('control_room_approved', true);
        } else if ($request->has('control_room_approved')) {
            $query->where('control_room_approved', $request->control_room_approved);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter active auctions (ongoing)
        if ($request->has('active') && $request->active) {
            $now = Carbon::now();
            $query->where('start_time', '<=', $now)
                ->where('end_time', '>=', $now)
                ->where('status', AuctionStatus::ACTIVE->value);
        }

        // Filter by car make/model
        if ($request->has('car_make')) {
            $query->whereHas('car', function ($q) use ($request) {
                $q->where('make', $request->car_make);
            });
        }

        // Sort options
        $sortField = $request->input('sort_by', 'created_at');
        $sortDirection = $request->input('sort_dir', 'desc');
        $allowedSortFields = ['created_at', 'start_time', 'end_time', 'current_bid', 'starting_bid'];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection);
        }

        $perPage = $request->input('per_page', 20);
        $auctions = $query->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $auctions
        ]);
    }

    public function AuctionsLive()
    {
        /*
            status === "live" &&
            auction_type === "live" &&
            approved_for_live
        */

        $current_live_car = Auction::with(['car.dealer', 'bids', 'car'])
            ->where('auction_type', AuctionType::LIVE->value)
            ->where('approved_for_live', true)
            ->where('status', AuctionStatus::ACTIVE->value)->first();

        $query = Auction::with(['car.dealer', 'bids', 'car'])
            ->where('auction_type', AuctionType::LIVE->value)
            //->where('approved_for_live', false)
            ->orderBy('approved_for_live', 'desc')
            ->where('status', AuctionStatus::ACTIVE->value);

        $pendingLiveAuctions = $query->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'current_live_car' => $current_live_car,
                'pending_live_auctions' => $pendingLiveAuctions,
                'completed_live_auctions' => []
            ]
        ]);
    }

    public function AuctionsFinished()
    {
        $query = Auction::with(['car.dealer', 'bids', 'car'])
            ->where('status', AuctionStatus::ENDED->value);
        $auctions = $query->paginate(10);

        return response()->json([
            'status' => 'success',
            'data' => $auctions
        ]);
    }

    /**
     * Store a newly created auction
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'car_id' => 'required',
            'starting_bid' => 'required|numeric|min:0',
            'reserve_price' => 'nullable|numeric|min:0',
            'start_time' => 'required|date|after_or_equal:today',
            'end_time' => 'required|date|after:start_time',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Verify car belongs to the authenticated user (either as dealer or regular user)
        $user = Auth::user();
        $car = Car::find($request->car_id);

        $isOwner = false;
        if ($user->role === 'dealer' && $user->dealer && $car->dealer_id === $user->dealer->id) {
            $isOwner = true;
        } elseif ($car->user_id === $user->id) {
            $isOwner = true;
        }

        if (!$isOwner) {
            return response()->json([
                'status' => 'error',
                'message' => 'You can only create auctions for your own cars'
            ], 403);
        }

        // Check if car is available for auction
        if ($car->auction_status !== 'available') {
            return response()->json([
                'status' => 'error',
                'message' => 'This car is not available for auction'
            ], 400);
        }

        // Create the auction
        $auction = new Auction();
        $auction->car_id = $request->car_id;
        $auction->starting_bid = $request->starting_bid;
        $auction->current_bid = $request->starting_bid;
        $auction->reserve_price = $request->reserve_price ?? 0;
        $auction->start_time = $request->start_time;
        $auction->end_time = $request->end_time;
        $auction->description = $request->description;

        // Set initial status based on start time
        $now = Carbon::now();
        if (Carbon::parse($request->start_time) <= $now) {
            $auction->status = AuctionStatus::ACTIVE;
        } else {
            $auction->status = AuctionStatus::SCHEDULED;
        }

        $auction->save();

        // Update car status
        $car->auction_status = 'in_auction';
        $car->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Auction created successfully',
            'data' => $auction
        ], 201);
    }

    /**
     * add to acution
     */
    public function addToAuction(Request $request)
    {


        $validator = Validator::make($request->all(), [
            'car_id' => 'required',
            'starting_bid' => 'required|numeric|min:0',
            'reserve_price' => 'nullable|numeric|min:0',
            'min_price' => 'required|numeric|min:0',
            'max_price' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        $car = Car::find($request->car_id);

        $isOwner = false;
        if ($user->role === 'dealer' && $user->dealer && $car->dealer_id === $user->dealer->id) {
            $isOwner = true;
        } elseif ($car->user_id === $user->id) {
            $isOwner = true;
        }

        if (!$isOwner) {
            return response()->json([
                'status' => 'error',
                'message' => 'You can only create auctions for your own cars'
            ], 403);
        }

        // Check if car is available for auction
        if ($car->auction_status !== 'available') {
            return response()->json([
                'status' => 'error',
                'message' => 'This car is not available for auction'
            ], 400);
        }


        // Create the auction
        $auction = new Auction();
        $auction->car_id = $request->car_id;
        $auction->starting_bid = $request->starting_bid;
        $auction->current_bid = $request->starting_bid;
        $auction->reserve_price = $request->reserve_price ?? 0;
        $auction->min_price = $request->min_price;
        $auction->max_price = $request->max_price;
        $auction->start_time = Carbon::now();
        $auction->end_time = Carbon::parse($request->start_time)->addMinutes(60);
        // Set initial status based on start time
        $now = Carbon::now();
        if (Carbon::parse($request->start_time) <= $now) {
            $auction->status = AuctionStatus::ACTIVE;
        } else {
            $auction->status = AuctionStatus::SCHEDULED;
        }

        $auction->save();

        // Update car status
        $car->auction_status = 'in_auction';
        $car->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Auction created successfully',
            'data' => $auction
        ], 201);
    }


    public function approveRejectAuctionBulk(Request $request)
    {

        $user = Auth::user();
        $tracking = collect([]);
        if ($user->role != 'admin') {
            return response()->json([
                'status' => 'error',
                'message' => 'You are not authorized to create auctions'
            ], 403);
        }
        if ($request->action === true) {
            $ids = $request->ids;
            foreach ($ids as $id) {
                $car = Car::find($id);
                $auction = Auction::where('car_id', $car->id)->first();

                if ($auction != null && $car->auction_status == 'available') {
                    $auction->status = AuctionStatus::ACTIVE->value;
                    $car->auction_status = 'in_auction';
                    $auction->save();
                    $car->save();
                    $tracking->push($auction);
                } else if ($car->auction_status == 'available' && $auction == null) {
                    // Create the auction
                    $auction = new Auction();
                    $auction->car_id = $id;
                    $auction->starting_bid = $car->starting_bid ?? 0;
                    $auction->current_bid = $car->starting_bid ?? 0;
                    $auction->reserve_price = $car->reserve_price ?? 0;
                    $auction->min_price = $car->min_price ?? 0;
                    $auction->max_price = $car->max_price ?? 0;
                    $auction->start_time = Carbon::now();
                    $auction->end_time = Carbon::parse($car->start_time)->addMinutes(60);
                    // Set initial status based on start time
                    $now = Carbon::now();
                    if (Carbon::parse($car->start_time) <= $now) {
                        $auction->status = AuctionStatus::ACTIVE;
                    } else {
                        $auction->status = AuctionStatus::SCHEDULED;
                    }
                    $auction->save();
                    // Update car status
                    $car->auction_status = 'in_auction';
                    $car->save();
                    $tracking->push($auction);
                }
            }
        } else if ($request->action === false) {
            $ids = $request->ids;
            foreach ($ids as $id) {
                $car = Car::find($id);
                // Check if car is available for auction
                if ($car->auction_status == 'available') {
                    $car->auction_status = 'cancelled';
                    $car->save();
                    $tracking->push($car);
                }
            }
        }


        if (count($tracking) > 0) {
            return response()->json([
                'status' => 'success',
                'message' => 'تم الأجراء بنجاح',
                'data' => $tracking
            ], 201);
        } else {
            return response()->json([
                'status' => 'success',
                'message' => 'لا شي  ',
                'data' => $tracking
            ], 201);
        }
    }





    public function moveBetweenAuctionsBulk(Request $request)
    {

        $user = Auth::user();
        $ids = $request->ids;

        $tracking = collect([]);
        if ($user->role != 'admin') {
            return response()->json([
                'status' => 'error',
                'message' => 'You are not authorized to create auctions'
            ], 403);
        }
        if ($request->status === "active") {
            foreach ($ids as $id) {
                $car = Car::find($id);
                // Check if car is available for auction
                if ($car->auction_status != 'available') {
                    $auction1 = Auction::where('car_id', $car->id)->first();
                    $auction = Auction::find($auction1->id);
                    $auction->control_room_approved = true;
                    $auction->status = AuctionStatus::ACTIVE->value;
                    $auction->auction_type = AuctionType::LIVE_INSTANT->value;
                    $auction->save();
                    $tracking->push($auction);
                }
            }
        } else  if ($request->status === "instant") {
            foreach ($ids as $id) {
                $car = Car::find($id);
                // Check if car is available for auction
                if ($car->auction_status != 'available') {
                    $auction1 = Auction::where('car_id', $car->id)->first();
                    $auction = Auction::find($auction1->id);
                    $auction->control_room_approved = true;
                    $auction->status = AuctionStatus::ACTIVE->value;
                    $auction->auction_type = AuctionType::LIVE_INSTANT->value;
                    $auction->save();
                    $tracking->push($auction);
                }
            }
        } else  if ($request->status === "late") {
            foreach ($ids as $id) {
                $car = Car::find($id);
                // Check if car is available for auction
                if ($car->auction_status != 'available') {
                    $auction1 = Auction::where('car_id', $car->id)->first();
                    $auction = Auction::find($auction1->id);
                    $auction->control_room_approved = true;
                    $auction->status = AuctionStatus::ACTIVE->value;
                    $auction->auction_type = AuctionType::SILENT_INSTANT->value;
                    $auction->save();
                    $tracking->push($auction);
                }
            }
        } else if ($request->status === "live") {
            foreach ($ids as $id) {
                $car = Car::find($id);
                // Check if car is available for auction
                if ($car->auction_status != 'available') {
                    $auction1 = Auction::where('car_id', $car->id)->first();
                    $auction = Auction::find($auction1->id);
                    $auction->control_room_approved = true;
                    $auction->status = AuctionStatus::ACTIVE->value;
                    $auction->auction_type = AuctionStatus::ACTIVE->value;
                    $auction->approved_for_live = false;
                    $auction->save();
                    $tracking->push($car);
                }
            }
        } else if ($request->status === "pending") {
            foreach ($ids as $id) {
                $car = Car::find($id);
                // Check if car is available for auction
                if ($car->auction_status != 'available') {
                    $auction1 = Auction::where('car_id', $car->id)->first();
                    $auction = Auction::find($auction1->id);
                    $auction->control_room_approved = false;
                    $auction->status = AuctionStatus::SCHEDULED->value;
                    $auction->save();
                    $tracking->push($car);
                }
            }
        }


        if (count($tracking) > 0) {
            return response()->json([
                'status' => 'success',
                'message' => 'تم الأجراء بنجاح',
                'data' => $tracking
            ], 201);
        } else {
            return response()->json([
                'status' => 'success',
                'message' => 'لا شي  ',
                'data' => $tracking
            ], 201);
        }
    }


    /**
     * Display the specified auction
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        // Update to include both dealer and user relationship
        $auction = Auction::with(['car', 'car.dealer.user', 'car.user', 'bids.user'])
            ->findOrFail($id);

        // Check if status needs updating based on time
        $auction->updateStatusBasedOnTime();

        // Format status with localized label
        $auction->status_info = [
            'value' => $auction->status->value,
            'label' => $auction->status->label(),
            'english_label' => $auction->status->englishLabel(),
            'color' => $auction->status->color(),
        ];

        // Get recent bids
        $recentBids = $auction->bids()
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // Get bid count
        $bidCount = $auction->bids()->count();

        return response()->json([
            'status' => 'success',
            'data' => [
                'auction' => $auction,
                'recent_bids' => $recentBids,
                'bid_count' => $bidCount,
                'time_remaining' => $auction->time_remaining
            ]
        ]);
    }


    public function getAllAuctions()
    {
        // Update to include both dealer and user relationship
        $auction = Auction::all();
        return response()->json([
            'status' => 'success',
            'data' => [
                'auction' => $auction
            ]
        ]);
    }
    public function getAuctionsByType($type)
    {
        // Update to include both dealer and user relationship
        $auction = Auction::where('type', $type);
        return response()->json([
            'status' => 'success',
            'data' => [
                'auction' => $auction
            ]
        ]);
    }

    /**
     * Update an existing auction
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        $auction = Auction::findOrFail($id);
        $user = Auth::user();

        // Verify ownership based on user role
        $isOwner = false;
        if ($user->role === 'dealer' && $user->dealer && $auction->car->dealer_id === $user->dealer->id) {
            $isOwner = true;
        } elseif ($auction->car->user_id === $user->id) {
            $isOwner = true;
        }

        if (!$isOwner) {
            return response()->json([
                'status' => 'error',
                'message' => 'You can only update your own auctions'
            ], 403);
        }

        // Can only update if not active yet
        if ($auction->status !== AuctionStatus::SCHEDULED) {
            return response()->json([
                'status' => 'error',
                'message' => 'Only scheduled auctions can be updated'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'starting_bid' => 'sometimes|numeric|min:0',
            'reserve_price' => 'nullable|numeric|min:0',
            'start_time' => 'sometimes|date|after_or_equal:today',
            'end_time' => 'sometimes|date|after:start_time',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Update auction fields
        if ($request->has('starting_bid')) {
            $auction->starting_bid = $request->starting_bid;
            $auction->current_bid = $request->starting_bid; // Reset current bid since no bids yet
        }

        if ($request->has('reserve_price')) {
            $auction->reserve_price = $request->reserve_price;
        }

        if ($request->has('start_time')) {
            $auction->start_time = $request->start_time;
        }

        if ($request->has('end_time')) {
            $auction->end_time = $request->end_time;
        }

        if ($request->has('description')) {
            $auction->description = $request->description;
        }

        $auction->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Auction updated successfully',
            'data' => $auction
        ]);
    }

    /**
     * Cancel an auction
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function cancel(Request $request, $id)
    {
        $auction = Auction::findOrFail($id);
        $user = Auth::user();

        // Verify ownership based on user role
        $isOwner = false;
        if ($user->role === 'dealer' && $user->dealer && $auction->car->dealer_id === $user->dealer->id) {
            $isOwner = true;
        } elseif ($auction->car->user_id === $user->id) {
            $isOwner = true;
        }

        if (!$isOwner) {
            return response()->json([
                'status' => 'error',
                'message' => 'You can only cancel your own auctions'
            ], 403);
        }

        // Can only cancel if not active or has no bids
        if ($auction->status === AuctionStatus::ACTIVE && $auction->bids()->count() > 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot cancel an active auction with bids'
            ], 400);
        }

        // Set status to canceled
        $auction->status = AuctionStatus::CANCELED;
        $auction->save();

        // Update car status
        $car = $auction->car;
        $car->auction_status = 'available';
        $car->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Auction canceled successfully',
            'data' => $auction
        ]);
    }

    /**
     * Display auctions owned by the authenticated user
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function myAuctions(Request $request)
    {
        $user = Auth::user();
        $query = null;

        if ($user->role === 'dealer' && $user->dealer) {
            // Get auctions for dealer's cars
            $query = Auction::whereHas('car', function ($q) use ($user) {
                $q->where('dealer_id', $user->dealer->id);
            });
        } else {
            // Get auctions for regular user's cars
            $query = Auction::whereHas('car', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }

        $query->with(['car', 'bids']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Sort options
        $sortField = $request->input('sort_by', 'created_at');
        $sortDirection = $request->input('sort_dir', 'desc');
        $allowedSortFields = ['created_at', 'start_time', 'end_time', 'current_bid'];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection);
        }

        $auctions = $query->paginate(10);

        return response()->json([
            'status' => 'success',
            'data' => $auctions
        ]);
    }



    public function approvedAuctions(Request $request)
    {
        $user = Auth::user();
        $query = null;
        $dealer = Dealer::where('user_id', $user->id)->first();
        $query = Auction::where('control_room_approved', true);

        $query->with(['car', 'bids', $dealer]);


        // Sort options
        $sortField = $request->input('sort_by', 'created_at');
        $sortDirection = $request->input('sort_dir', 'desc');
        $allowedSortFields = ['created_at', 'start_time', 'end_time', 'current_bid'];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection);
        }

        $auctions = $query->paginate(10);

        return response()->json([
            'status' => 'success',
            'data' => $auctions
        ]);
    }





    /**
     * Get analytics for a specific auction
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function analytics($id)
    {
        $auction = Auction::with(['car', 'bids.user'])->findOrFail($id);
        $user = Auth::user();

        // Verify ownership based on user role - this endpoint is dealer-only
        if (!$user->dealer || $auction->car->dealer_id !== $user->dealer->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'You can only view analytics for your own auctions'
            ], 403);
        }

        // Calculate analytics
        $totalBids = $auction->bids->count();
        $uniqueBidders = $auction->bids->pluck('user_id')->unique()->count();

        // Bid history over time
        $bidTimeline = $auction->bids()
            ->select('created_at', 'bid_amount')
            ->orderBy('created_at')
            ->get()
            ->map(function ($bid) {
                return [
                    'time' => $bid->created_at,
                    'amount' => $bid->bid_amount
                ];
            });

        // Price increase percentage
        $priceIncreasePercentage = 0;
        if ($auction->starting_bid > 0 && $auction->current_bid > $auction->starting_bid) {
            $priceIncreasePercentage = (($auction->current_bid - $auction->starting_bid) / $auction->starting_bid) * 100;
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'auction_id' => $auction->id,
                'car' => $auction->car->only(['id', 'make', 'model', 'year']),
                'status' => $auction->status->value,
                'status_label' => $auction->status->label(),
                'total_bids' => $totalBids,
                'unique_bidders' => $uniqueBidders,
                'starting_bid' => $auction->starting_bid,
                'current_bid' => $auction->current_bid,
                'price_increase_percentage' => round($priceIncreasePercentage, 2),
                'time_remaining' => $auction->time_remaining,
                'bid_timeline' => $bidTimeline,
                'highest_bidder' => $auction->highestBidder() ? [
                    'id' => $auction->highestBidder()->id,
                    'name' => $auction->highestBidder()->name
                ] : null
            ]
        ]);
    }

    public function purchaseConfirmation($auction_id)
    {
        $auction = Auction::with(['car', 'bids', 'car.dealer'])->findOrFail($auction_id);
        //$settlement = Settlement::where('auction_id', $auction_id)->first();

        $trafficManagementFee = Setting::where('key', 'trafficManagementFee')->first();
        $tamFeeSetting = Setting::where('key', 'tamFee')->first();

        $trafficManagementFee = $trafficManagementFee->value ?? 0;
        $tamFee = $tamFeeSetting->value ?? 0;

        $evaluation_price = $auction->car?->evaluation_price ?? 0;
        $commission = CommissionTier::getCommissionForPrice($evaluation_price);

        return response()->json([
            'status' => 'success',
            'data' => [
                'auction' => $auction,
                'trafficPoliceFees' => (int)$trafficManagementFee,
                'tamFee' => (int)$tamFee,
                'platformFee' => (int)$commission
            ]
        ]);
    }
}

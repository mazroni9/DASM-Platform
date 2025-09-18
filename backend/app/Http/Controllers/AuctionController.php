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
use App\Notifications\CarApprovedForAuctionNotification;
use App\Notifications\CarMovedToAuctionNotification;
use App\Events\CarMovedBetweenAuctionsEvent;
use Illuminate\Support\Facades\DB;
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

        $auctions = $query->paginate(5);

        return response()->json([
            'status' => 'success',
            'data' => $auctions
        ]);
    }


    public function getAllAuctionsIds(Request $request)
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

        $auctions = $query->get();

        return response()->json([
            'status' => 'success',
            'data' => $auctions
        ]);
    }

    public function auctionByType(Request $request)
    {

        $query = Auction::with(['car.dealer', 'bids', 'car', 'broadcasts'])->where('auction_type',$request->auction_type);
        $brands = Auction::query()
            ->where('auction_type', $request->auction_type)
            ->where('control_room_approved', true)
            ->join('cars', 'auctions.car_id', '=', 'cars.id')
            ->distinct()
            ->pluck('cars.make');

        // Only show control room approved auctions in public listing by default
        if (!$request->has('control_room_approved')) {
            $query->where('control_room_approved', true);
        } else if ($request->has('control_room_approved')) {
            $query->where('control_room_approved', true);
        }

        // Filter active auctions (ongoing)
        if ($request->has('active') && $request->active) {
            $now = Carbon::now();
            $query->where('start_time', '<=', $now)
                ->where('end_time', '>=', $now)
                ->where('status', AuctionStatus::ACTIVE->value);
        }

                            // Search by name or email
        if ($request->has('brand')) {
            $brand = $request->brand;
            $query->whereHas('car',function($q) use ($brand) {
                $q->where('make', 'like', "%{$brand}%");
            });
        }
                       // Search by name or email
        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('car',function($q) use ($search) {
                $q->where('year', 'like', "%{$search}%")
                 ->orWhere('plate', 'like', "%{$search}%")
                 ->orWhere('make', 'like', "%{$search}%");
            });
        }
        
        // Sort options
        $sortField = $request->input('sort_by', 'updated_at');
        $sortDirection = $request->input('sort_dir', 'desc');
        $allowedSortFields = ['created_at', 'updated_at', 'start_time', 'end_time', 'current_bid', 'starting_bid'];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection);
        }

        $auctions = $query->paginate(50);
        $total = $auctions->total();

        return response()->json([
            'status' => 'success',
            'data' => $auctions,
            'brands'=>$brands,
            'total'=> $auctions
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
            'car_id' => 'required|integer|exists:cars,id',
            'starting_bid' => 'required|numeric|min:1|max:999999999.99',
            'reserve_price' => 'nullable|numeric|min:0|max:999999999.99',
            'start_time' => 'required|date|after_or_equal:today',
            'end_time' => 'required|date|after:start_time',
            'description' => 'nullable|string|max:1000',
        ], [
            'car_id.required' => 'معرف السيارة مطلوب',
            'car_id.exists' => 'السيارة غير موجودة',
            'starting_bid.required' => 'سعر البداية مطلوب',
            'starting_bid.min' => 'سعر البداية يجب أن يكون أكبر من صفر',
            'starting_bid.max' => 'سعر البداية كبير جداً',
            'reserve_price.max' => 'السعر الاحتياطي كبير جداً',
            'start_time.required' => 'وقت البداية مطلوب',
            'start_time.after_or_equal' => 'وقت البداية يجب أن يكون اليوم أو بعده',
            'end_time.required' => 'وقت النهاية مطلوب',
            'end_time.after' => 'وقت النهاية يجب أن يكون بعد وقت البداية',
            'description.max' => 'وصف المزاد طويل جداً'
        ]);

        if ($validator->fails()) {
            \Illuminate\Support\Facades\Log::warning('Auction creation validation failed', [
                'user_id' => Auth::id(),
                'errors' => $validator->errors(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'بيانات المزاد غير صالحة',
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

    if (!$user || !$user->isAdmin()) {
        return response()->json([
            'status'  => 'error',
            'message' => 'You are not authorized to create auctions'
        ], 403);
    }

    // --- Validate & normalize input ---
    $request->validate([
        'action' => ['required'],             // true/false (قد تأتي كسلسلة)
        'ids'    => ['required','array','min:1'],
        'ids.*'  => ['integer'],
    ]);

    // حوّل action لبوول بأمان (تتعامل مع 'true'/'false' كسترنج)
    $approve = filter_var($request->action, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    if ($approve === null) {
        return response()->json([
            'status'  => 'error',
            'message' => 'Invalid action value. Expected boolean.'
        ], 422);
    }

    // حافظ على ترتيب الإدخال مع إزالة التكرارات
    $inputIds = $request->ids;
    $seen = [];
    $ids = [];
    foreach ($inputIds as $id) {
        if (!isset($seen[$id])) {
            $seen[$id] = true;
            $ids[] = (int) $id;
        }
    }

    $tracking = []; // front-end-only per-id results
    $now = Carbon::now();

    // --- Process inside one transaction for safety ---
    DB::beginTransaction();
    try {
        foreach ($ids as $id) {
            // قفل الصف لمنع التضارب
            $car = Car::whereKey($id)->lockForUpdate()->first();

            if (!$car) {
                $tracking[] = [
                    'id'      => $id,
                    'outcome' => 'error',
                    'message' => 'Car not found',
                    'code'    => 'not_found',
                ];
                continue;
            }

            try {
                if ($approve === true) {
                    // APPROVE
                    if ($car->auction_status === 'available') {
                        if ($car->activeAuction) {
                            // عنده مزاد نشط بالفعل -> فقط غيّر حالة السيارة
                            $car->auction_status = 'in_auction';
                            $car->save();

                            // إشعار المالك (اختياري وآمن)
                            $this->notifyOwnerIfPossible($car, $car->activeAuction);

                            $tracking[] = [
                                'id'      => $car->id,
                                'outcome' => 'approved',
                                'message' => 'Car moved into existing auction',
                                'code'    => 'approved_existing',
                                'after'   => [
                                    'auction_status'    => $car->auction_status,
                                    'active_auction_id' => $car->activeAuction->id,
                                ],
                            ];
                        } else {
                            // لا يوجد مزاد -> أنشئ واحداً
                            $auction = new Auction();
                            $auction->car_id        = $car->id;
                            $auction->starting_bid  = $car->starting_bid ?? 0;
                            $auction->current_bid   = $car->starting_bid ?? 0;
                            $auction->reserve_price = $car->reserve_price ?? 0;
                            $auction->min_price     = $car->min_price ?? 0;
                            $auction->max_price     = $car->max_price ?? 0;

                            // ابدأ الآن إن لم يكن هناك start_time صالح
                            $start = $car->start_time ? Carbon::parse($car->start_time) : $now;
                            $auction->start_time = $start;
                            $auction->end_time   = (clone $start)->addMinutes(60);

                            $auction->status = $start->lessThanOrEqualTo($now)
                                ? AuctionStatus::ACTIVE
                                : AuctionStatus::SCHEDULED;

                            $auction->save();

                            // حدث حالة السيارة
                            $car->auction_status = 'in_auction';
                            $car->save();

                            // إشعار المالك (اختياري وآمن)
                            $this->notifyOwnerIfPossible($car, $auction);

                            $tracking[] = [
                                'id'      => $car->id,
                                'outcome' => 'approved',
                                'message' => 'Car approved and new auction created',
                                'code'    => 'approved_created',
                                'after'   => [
                                    'auction_status'    => $car->auction_status,
                                    'active_auction_id' => $auction->id,
                                ],
                            ];
                        }
                    } else {
                        // ليست متاحة للموافقة
                        $tracking[] = [
                            'id'      => $car->id,
                            'outcome' => 'skipped',
                            'message' => 'Car not available for approval',
                            'code'    => 'not_available_for_approval',
                            'before'  => [
                                'auction_status'     => $car->auction_status,
                                'has_active_auction' => (bool) $car->activeAuction,
                            ],
                        ];
                    }
                } else {
                    // REJECT
                    if ($car->auction_status === 'available') {
                        $car->auction_status = 'cancelled';
                        $car->save();

                        $tracking[] = [
                            'id'      => $car->id,
                            'outcome' => 'rejected',
                            'message' => 'Car rejected and cancelled',
                            'code'    => 'rejected',
                            'after'   => ['auction_status' => $car->auction_status],
                        ];
                    } else {
                        $tracking[] = [
                            'id'      => $car->id,
                            'outcome' => 'skipped',
                            'message' => 'Car not available to reject',
                            'code'    => 'not_available_for_reject',
                            'before'  => ['auction_status' => $car->auction_status],
                        ];
                    }
                }
            } catch (\Throwable $e) {
                // لا نوقف بقية العناصر
                $tracking[] = [
                    'id'      => $car->id,
                    'outcome' => 'error',
                    'message' => app()->hasDebugModeEnabled() && config('app.debug')
                        ? $e->getMessage()
                        : 'Error while processing this car',
                    'code'    => 'exception',
                ];
            }
        }

        DB::commit();
    } catch (\Throwable $e) {
        DB::rollBack();

        return response()->json([
            'status'  => 'error',
            'message' => 'Bulk operation failed.',
            'error'   => config('app.debug') ? $e->getMessage() : null,
        ], 500);
    }

    // Response
    $hasAny = count($tracking) > 0;

    // summary سريع
    $summary = ['approved'=>0,'rejected'=>0,'skipped'=>0,'errors'=>0];
    foreach ($tracking as $t) {
        if (isset($t['outcome']) && isset($summary[$t['outcome']])) {
            $summary[$t['outcome']]++;
        }
    }

    return response()->json([
        'status'   => 'success',
        'message'  => $approve ? 'تمت الموافقة على الدفعة' : 'تم رفض الدفعة',
        'summary'  => $summary,
        'tracking' => $tracking, // استهلكها مباشرةً في الفرونت
    ], $hasAny ? 200 : 204);
}

/**
 * محاولة إرسال إشعار للمالك فقط إذا كانت علاقة owner() أو user() موجودة.
 * لا تكسر العملية لو الإشعار فشل.
 */
protected function notifyOwnerIfPossible(Car $car, Auction $auction = null): void
{
    try {
        $owner = null;
        if (method_exists($car, 'owner')) {
            $owner = $car->owner;
        } elseif (method_exists($car, 'user')) {
            $owner = $car->user;
        }

        if ($owner && method_exists($owner, 'notify')) {
            $owner->notify(new CarApprovedForAuctionNotification($car, $auction ?? $car->activeAuction));
        }
    } catch (\Throwable $e) {
        // تجاهل أخطاء الإشعار ولا نوقف الدفقة
        logger()->warning('Car owner notification failed', [
            'car_id'   => $car->id,
            'auction'  => $auction?->id,
            'error'    => $e->getMessage(),
        ]);
    }
}


    public function approveRejectAuctionBulk1(Request $request)
    {

        $user = Auth::user();
        $tracking = collect([]);

        if (!$user->isAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'You are not authorized to create auctions'
            ], 403);
        }
        if ($request->action === true) {
            $ids = $request->ids;
            foreach ($ids as $id) {
                $car = Car::find($id);
                //$auction = Auction::where('car_id', $car->id)->first();
                if ($car->activeAuction && $car->auction_status == 'available') {
                    $car->auction_status = 'in_auction';
                    $car->save();
                    // Send notification to car owner
                    $carOwner = $car->owner;
                    if ($carOwner) {
                        $carOwner->notify(new CarApprovedForAuctionNotification($car, $car->activeAuction));
                    }

                    $tracking->push($car->activeAuction);
                } else if ($car->auction_status == 'available' && !$car->activeAuction) {
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

                    // Send notification to car owner
                    $carOwner = $car->owner;
                    if ($carOwner) {
                        $carOwner->notify(new CarApprovedForAuctionNotification($car, $auction));
                    }

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
    /** ---------- Auth & Validate ---------- */
    $user = Auth::user();
    if (!$user || !$user->isAdmin()) {
        return response()->json([
            'status'  => 'error',
            'message' => 'You are not authorized to move auctions.',
        ], 403);
    }

    $validated = $request->validate([
        'ids'    => ['required', 'array', 'min:1'],
        'ids.*'  => ['integer', 'distinct'],
        'status' => ['required', 'string', 'in:active,instant,late,live,pending'],
    ]);

    $targetStatus = $validated['status'];
    $carIds       = array_values($validated['ids']);

    /** ---------- Status → Base Payload ---------- */
    $baseDataByStatus = [
        'active'  => [
            'control_room_approved' => true,
            'status'                => AuctionStatus::ACTIVE->value,
            'auction_type'          => AuctionType::LIVE_INSTANT->value,
            'approved_for_live'     => null,
        ],
        'instant' => [
            'control_room_approved' => true,
            'status'                => AuctionStatus::ACTIVE->value,
            'auction_type'          => AuctionType::LIVE_INSTANT->value,
            'approved_for_live'     => null,
        ],
        'late'    => [
            'control_room_approved' => true,
            'status'                => AuctionStatus::ACTIVE->value,
            'auction_type'          => AuctionType::SILENT_INSTANT->value,
            'approved_for_live'     => null,
        ],
        'live'    => [
            'control_room_approved' => true,
            'status'                => AuctionStatus::ACTIVE->value,
            'auction_type'          => AuctionType::LIVE->value,
            'approved_for_live'     => false,
        ],
        'pending' => [
            'control_room_approved' => false,
            'status'                => AuctionStatus::SCHEDULED->value,
            'auction_type'          => null, // مهم: لا نقارن النوع هنا
            'approved_for_live'     => null,
        ],
    ];
    $targetData = $baseDataByStatus[$targetStatus];

    /** ---------- Fetch cars ---------- */
    $cars = Car::with(['user', 'dealer'])
        ->whereIn('id', $carIds)
        ->get();

    if ($cars->isEmpty()) {
        return response()->json([
            'status'  => 'success',
            'message' => 'لا توجد سيارات مطابقة للمعرّفات المرسلة.',
            'summary' => ['requested' => count($carIds), 'found' => 0],
            'data'    => [],
        ], 200);
    }

    /** ---------- Process ---------- */
    $nowRiyadh  = Carbon::now('Asia/Riyadh');
    $endDefault = (clone $nowRiyadh)->addMinutes(60);

    $results    = [];
    $updatedCnt = 0;
    $createdCnt = 0;
    $skippedCnt = 0;

    DB::beginTransaction();
    try {
        foreach ($cars as $car) {

            /** ========= SKIP: if already same status/type =========
             * نتحقق من وجود *أي* مزاد لنفس السيارة يطابق الحالة المستهدفة،
             * وإذا كان للهدف auction_type (غير null) نضيف شرط النوع.
             */
            $sameExists = Auction::where('car_id', $car->id)
                ->where('status', $targetData['status'])
                ->when(!is_null($targetData['auction_type']), function ($q) use ($targetData) {
                    $q->where('auction_type', $targetData['auction_type']);
                })
                ->exists();

            if ($sameExists) {
                $skippedCnt++;
                $results[] = [
                    'car_id'        => $car->id,
                    'action'        => 'skipped',
                    'reason'        => 'already in same target status/type',
                    'target_status' => $targetStatus,
                ];
                continue;
            }

            /** ========= UPDATE or CREATE ========= */
            // نبحث عن مزاد نشط/مجدول لنعمل عليه تحديث إن توفر
            $auction = Auction::where('car_id', $car->id)
                ->whereIn('status', [AuctionStatus::ACTIVE->value, AuctionStatus::SCHEDULED->value])
                ->latest('id')
                ->first();

            if ($auction) {
                // تحديث المزاد القائم
                $payload = array_filter([
                    'control_room_approved' => $targetData['control_room_approved'],
                    'status'                => $targetData['status'],
                    'auction_type'          => $targetData['auction_type'],
                    'approved_for_live'     => $targetData['approved_for_live'],
                ], fn ($v) => !is_null($v));

                $auction->update($payload);
                $updatedCnt++;

                $results[] = [
                    'car_id'        => $car->id,
                    'action'        => 'updated',
                    'auction_id'    => $auction->id,
                    'target_status' => $targetStatus,
                ];
            } else {
                // إنشاء مزاد جديد
                $startingBid = $car->starting_bid ?? 0;
                $startTime   = $car->start_time ? Carbon::parse($car->start_time, 'Asia/Riyadh') : $nowRiyadh;
                $endTime     = $car->end_time ? Carbon::parse($car->end_time, 'Asia/Riyadh') : $endDefault;

                $createData = array_filter([
                    'car_id'                => $car->id,
                    'starting_bid'          => $startingBid,
                    'current_bid'           => $startingBid,
                    'reserve_price'         => $car->reserve_price ?? 0,
                    'min_price'             => $car->min_price ?? 0,
                    'max_price'             => $car->max_price ?? 0,
                    'start_time'            => $startTime,
                    'end_time'              => $endTime,
                    'control_room_approved' => $targetData['control_room_approved'],
                    'status'                => $targetData['status'],
                    'auction_type'          => $targetData['auction_type'],
                    'approved_for_live'     => $targetData['approved_for_live'],
                ], fn ($v) => !is_null($v));

                $auction = Auction::create($createData);
                $createdCnt++;

                $results[] = [
                    'car_id'        => $car->id,
                    'action'        => 'created',
                    'auction_id'    => $auction->id,
                    'target_status' => $targetStatus,
                ];
            }

            /** ---------- Notifications ---------- */
            $recipient = $car->user ?? $car->dealer;
            if ($recipient && method_exists($recipient, 'notify')) {
                try {
                    $recipient->notify(new CarMovedToAuctionNotification($car, $auction, $targetStatus));
                } catch (\Throwable $e) {
                    \Log::warning('CarMovedToAuctionNotification failed', [
                        'car_id'     => $car->id,
                        'auction_id' => $auction->id ?? null,
                        'error'      => $e->getMessage(),
                    ]);
                }
            }

            /** ---------- Broadcast ---------- */
            try {
                event(new CarMovedBetweenAuctionsEvent($auction, $targetStatus, $car));
            } catch (\Throwable $e) {
                \Log::warning('CarMovedBetweenAuctionsEvent failed', [
                    'car_id'     => $car->id,
                    'auction_id' => $auction->id ?? null,
                    'error'      => $e->getMessage(),
                ]);
            }
        }

        DB::commit();

    } catch (\Throwable $e) {
        DB::rollBack();

        \Log::error('moveBetweenAuctionsBulk failed', [
            'status'   => $targetStatus,
            'car_ids'  => $carIds,
            'error'    => $e->getMessage(),
        ]);

        return response()->json([
            'status'  => 'error',
            'message' => 'حدث خطأ أثناء نقل السيارات بين المزادات.',
        ], 500);
    }

    /** ---------- Response ---------- */
    $summary = [
        'requested' => count($carIds),
        'processed' => count($results),
        'updated'   => $updatedCnt,
        'created'   => $createdCnt,
        'skipped'   => $skippedCnt,
        'target'    => $targetStatus,
    ];

    return response()->json([
        'status'  => 'success',
        'message' => 'تم الإجراء بنجاح.',
        'summary' => $summary,
        'data'    => $results,
    ], 200);
}



    public function moveBetweenAuctionsBulk1(Request $request)
    {

        $user = Auth::user();
        $ids = $request->ids;

        $tracking = collect([]);
        if (!$user->isAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'You are not authorized to create auctions'
            ], 403);
        }
        if ($request->status === "active") {
            $data = [
                'control_room_approved' => true,
                'status' => AuctionStatus::ACTIVE->value,
                'auction_type' => AuctionType::LIVE_INSTANT->value,
            ];
        } else  if ($request->status === "instant") {

            $data = [
                'control_room_approved' => true,
                'status' => AuctionStatus::ACTIVE->value,
                'auction_type' => AuctionType::LIVE_INSTANT->value,
            ];
        } else  if ($request->status === "late") {

            $data = [
                'control_room_approved' => true,
                'status' => AuctionStatus::ACTIVE->value,
                'auction_type' => AuctionType::SILENT_INSTANT->value,
            ];
        } else if ($request->status === "live") {
            $data = [
                'control_room_approved' => true,
                'status' => AuctionStatus::ACTIVE->value,
                'auction_type' => AuctionType::LIVE->value,
                'approved_for_live' => false
            ];
        } else if ($request->status === "pending") {
            $data = [
                'control_room_approved' => false,
                'status' => AuctionStatus::SCHEDULED->value,
            ];
        }
        //request statuses: active, instant, late, live, pending
        foreach ($ids as $id) {
            $car = Car::find($id);
            // Check if car is available for auction
            if ($car->auction_status != 'available') {
                 $auction = Auction::where('car_id', $car->id)
                ->where('status', AuctionStatus::ACTIVE->value)
                ->orWhere('status', AuctionStatus::SCHEDULED->value)
                ->first();
                if($auction){
                    $auction->update($data);
                    $tracking->push($auction);

                    // Send notification to car owner about auction update
                    $carOwner = $car->owner;
                    if ($carOwner) {
                        $carOwner->notify(new CarMovedToAuctionNotification($car, $auction, $request->status));
                    }

                    // Broadcast event for real-time updates
                    event(new CarMovedBetweenAuctionsEvent($auction, $request->status, $car));
                } else {

                    // Ensure we have all required fields with proper fallbacks
                    $startingBid = $car->starting_bid ?? 0;
                    $startTime = Carbon::now();
                    $endTime = $car->start_time ? Carbon::parse($car->start_time)->addMinutes(60) : Carbon::now()->addMinutes(60);

                    $newData = [
                        'car_id' => $car->id,
                        'starting_bid' => $startingBid,
                        'current_bid' => $startingBid,
                        'reserve_price' => $car->reserve_price ?? 0,
                        'min_price' => $car->min_price ?? 0,
                        'max_price' => $car->max_price ?? 0,
                        'start_time' => $startTime,
                        'end_time' => $endTime,
                    ];
                    $data = array_merge($newData, $data);
                    $auction = Auction::create($data);
                    $tracking->push($auction);

                    // Send notification to car owner about new auction
                    $carOwner = $car->owner;
                    if ($carOwner) {
                        $carOwner->notify(new CarMovedToAuctionNotification($car, $auction, $request->status));
                    }

                    // Broadcast event for real-time updates
                    event(new CarMovedBetweenAuctionsEvent($auction, $request->status, $car));
                }
                $tracking->push($car);
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

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Car;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

// Enums from your model
use App\Enums\CarCondition;
use App\Enums\CarTransmission;
use App\Enums\CarsMarketsCategory;
use App\Enums\AuctionStatus;

class CarController extends Controller
{
    /**
     * Admin — all cars (with filters + pagination + sorting)
     */
    public function index(Request $request)
    {
        $query = Car::query()->with([
            'dealer.user',
            'user',
            'auctions',
            'reportImages',
            'carAttributes',
        ]);

        // -------- Filters --------
        $auctionStatus = $request->input('auction_status', $request->input('status'));
        if ($auctionStatus !== null && $auctionStatus !== '') {
            $query->where('auction_status', $auctionStatus);
        }

        if ($request->filled('review_status')) {
            $query->where('review_status', $request->review_status);
        }

        if ($request->filled('dealer_id')) {
            $query->where('dealer_id', $request->dealer_id);
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('market_category')) {
            $query->where('market_category', $request->market_category);
        }

        if ($request->filled('make')) {
            $query->where('make', $request->make);
        }

        if ($request->filled('model')) {
            $query->where('model', $request->model);
        }

        if ($request->filled('province')) {
            $query->where('province', $request->province);
        }

        if ($request->filled('city')) {
            $query->where('city', $request->city);
        }

        // year range
        if ($request->filled('year_from')) {
            $query->where('year', '>=', (int) $request->year_from);
        }
        if ($request->filled('year_to')) {
            $query->where('year', '<=', (int) $request->year_to);
        }

        // price range (evaluation_price)
        if ($request->filled('min_eval_price')) {
            $query->where('evaluation_price', '>=', (float) $request->min_eval_price);
        }
        if ($request->filled('max_eval_price')) {
            $query->where('evaluation_price', '<=', (float) $request->max_eval_price);
        }

        // search
        $search = $request->input('search', $request->input('q'));
        if ($search !== null && trim($search) !== '') {
            $search = trim($search);
            $query->where(function ($q) use ($search) {
                $q->where('make', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%")
                    ->orWhere('vin', 'like', "%{$search}%")
                    ->orWhere('plate', 'like', "%{$search}%");
            });
        }

        // -------- Sorting --------
        $sortBy  = $request->input('sort_by', 'created_at');
        $sortDir = strtolower($request->input('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        $allowedSort = ['created_at', 'updated_at', 'evaluation_price', 'year', 'odometer', 'id', 'reviewed_at'];
        if (!in_array($sortBy, $allowedSort, true)) {
            $sortBy = 'created_at';
        }

        // -------- Pagination --------
        $perPage = (int) $request->input('per_page', 10);
        $perPage = max(1, min($perPage, 100));

        $cars = $query->orderBy($sortBy, $sortDir)->paginate($perPage);

        // ✅ show hidden fields for admin
        $cars->getCollection()->transform(function (Car $car) {
            return $car->makeVisible(['min_price', 'max_price']);
        });

        return response()->json([
            'status' => 'success',
            'data' => $cars->items(),
            'pagination' => [
                'current_page' => $cars->currentPage(),
                'per_page' => $cars->perPage(),
                'total' => $cars->total(),
                'last_page' => $cars->lastPage(),
                'from' => $cars->firstItem(),
                'to' => $cars->lastItem(),
                'next_page_url' => $cars->nextPageUrl(),
                'prev_page_url' => $cars->previousPageUrl(),
            ],
        ], 200);
    }

    /**
     * Admin — show single car (includes user + dealer + auctions + files + AI review)
     */
    public function show($id)
    {
        $car = Car::with([
            'dealer.user',
            'user',
            'auctions',
            'reportImages',
            'carAttributes',
        ])->findOrFail($id);

        // ✅ show hidden fields for admin
        $car->makeVisible(['min_price', 'max_price']);

        // owner accessor (dealer.user OR user)
        $owner = null;
        try {
            $owner = $car->owner; // uses getOwnerAttribute()
        } catch (\Throwable $e) {
            $owner = null;
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'car' => $car,
                'owner' => $owner,
                'active_auction' => $car->activeAuction()->first(),
            ],
        ], 200);
    }

    /**
     * Admin — Update car auction_status (and keep auctions consistent)
     */
    public function updateCarStatus($id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            // ✅ include pending لأن الموديل بيحطه default
            'status' => ['required', 'string', Rule::in([
                'pending',
                'available',
                'in_auction',
                'sold',
                'cancelled',
                'canceled',
            ])],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $car = Car::with('auctions')->findOrFail($id);

        $newStatus = $this->normalizeCarStatus($request->status);
        $car->auction_status = $newStatus;

        /**
         * Logic:
         * - in_auction => activate scheduled auction if no active
         * - available/pending/cancelled => cancel active + scheduled auctions
         * - sold => cancel scheduled (optional) and leave active to be handled by auction flow
         */
        if ($newStatus === 'in_auction') {
            $active = $car->auctions()->where('status', AuctionStatus::ACTIVE->value)->first();
            if (!$active) {
                $scheduled = $car->auctions()->where('status', AuctionStatus::SCHEDULED->value)->first();
                if ($scheduled) {
                    $scheduled->status = AuctionStatus::ACTIVE->value;
                    $scheduled->control_room_approved = true;
                    $scheduled->save();
                }
            }
        }

        if (in_array($newStatus, ['available', 'pending', 'cancelled'], true)) {
            $car->auctions()
                ->whereIn('status', [AuctionStatus::ACTIVE->value, AuctionStatus::SCHEDULED->value])
                ->update(['status' => AuctionStatus::CANCELLED->value]);
        }

        if ($newStatus === 'sold') {
            $car->auctions()
                ->whereIn('status', [AuctionStatus::SCHEDULED->value])
                ->update(['status' => AuctionStatus::CANCELLED->value]);
        }

        $car->save();

        $car->refresh()->load(['dealer.user', 'user', 'auctions', 'reportImages', 'carAttributes']);
        $car->makeVisible(['min_price', 'max_price']);

        return response()->json([
            'status' => 'success',
            'message' => 'Car status updated successfully',
            'data' => $car,
        ], 200);
    }

    /**
     * Admin — Update AI review fields (bot/AI inspection management)
     * Example:
     * review_status: under_review|approved|rejected|failed|processing
     * review_reason: string
     * review_score: numeric
     * review_details: array/json
     */
    public function updateReviewStatus($id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'review_status' => ['required', 'string', Rule::in([
                'processing',
                'under_review',
                'approved',
                'rejected',
                'failed',
            ])],
            'review_reason' => 'nullable|string|max:1000',
            'review_score' => 'nullable|numeric|min:0|max:100',
            'review_details' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $car = Car::findOrFail($id);

        $car->review_status = $request->review_status;
        if ($request->has('review_reason')) $car->review_reason = $request->review_reason;
        if ($request->has('review_score')) $car->review_score = $request->review_score;
        if ($request->has('review_details')) $car->review_details = $request->review_details;

        // mark reviewed_at when final decision
        if (in_array($request->review_status, ['approved', 'rejected', 'failed'], true)) {
            $car->reviewed_at = now();
        }

        $car->save();

        $car->refresh()->load(['dealer.user', 'user', 'auctions', 'reportImages', 'carAttributes']);
        $car->makeVisible(['min_price', 'max_price']);

        return response()->json([
            'status' => 'success',
            'message' => 'Review status updated successfully',
            'data' => $car,
        ], 200);
    }

    /**
     * Admin — Update car details (supports new fields + enums + images array)
     */
    public function update(Request $request, $id)
    {
        $car = Car::findOrFail($id);

        $rules = [
            'make' => 'sometimes|string|max:50',
            'model' => 'sometimes|string|max:50',
            'year' => 'sometimes|integer|min:1900|max:' . (date('Y') + 1),
            'vin' => 'sometimes|string|max:17|unique:cars,vin,' . $id,
            'odometer' => 'sometimes|integer|min:0',

            // enums
            'condition' => ['sometimes', 'string', Rule::in($this->enumValues(CarCondition::class))],
            'transmission' => ['sometimes', 'string', Rule::in($this->enumValues(CarTransmission::class))],
            'market_category' => ['sometimes', 'string', Rule::in($this->enumValues(CarsMarketsCategory::class))],

            // prices
            'evaluation_price' => 'sometimes|numeric|min:0',
            'min_price' => 'sometimes|numeric|min:0',
            'max_price' => 'sometimes|numeric|min:0',

            // new fields
            'province' => 'nullable|string|max:80',
            'city' => 'nullable|string|max:80',
            'plate' => 'nullable|string|max:30',
            'main_auction_duration' => 'sometimes|integer|in:10,20,30',

            // misc
            'color' => 'nullable|string|max:30',
            'engine' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:2000',

            // files/paths stored in db
            'registration_card_image' => 'nullable|string|max:255',

            // images array (stored as JSON)
            'images' => 'sometimes|array',
            'images.*' => 'string|max:500',

            // optional: allow update car status here too
            'auction_status' => ['sometimes', 'string', Rule::in(['pending','available','in_auction','sold','cancelled','canceled'])],

            // AI review optional edit
            'review_status' => ['sometimes', 'string', Rule::in(['processing','under_review','approved','rejected','failed'])],
            'review_request_id' => 'nullable|string|max:255',
            'review_score' => 'nullable|numeric|min:0|max:100',
            'review_details' => 'nullable|array',
            'review_reason' => 'nullable|string|max:1000',
            'reviewed_at' => 'nullable|date',
        ];

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $request->only(array_keys($rules));

        // normalize statuses
        if (array_key_exists('auction_status', $data)) {
            $data['auction_status'] = $this->normalizeCarStatus($data['auction_status']);
        }

        // guard: min_price <= max_price
        if (array_key_exists('min_price', $data) && array_key_exists('max_price', $data)) {
            $min = $data['min_price'];
            $max = $data['max_price'];
            if ($min !== null && $max !== null && (float)$min > (float)$max) {
                return response()->json([
                    'status' => 'error',
                    'errors' => ['max_price' => ['max_price يجب أن يكون أكبر من أو يساوي min_price']],
                ], 422);
            }
        }

        // convert empty strings to null for nullable fields
        foreach ([
            'province','city','plate','color','engine','description',
            'registration_card_image','review_request_id','review_reason'
        ] as $f) {
            if (array_key_exists($f, $data) && $data[$f] === '') {
                $data[$f] = null;
            }
        }

        $car->fill($data);
        $car->save();

        $car->refresh()->load(['dealer.user', 'user', 'auctions', 'reportImages', 'carAttributes']);
        $car->makeVisible(['min_price', 'max_price']);

        return response()->json([
            'status' => 'success',
            'message' => 'Car updated successfully.',
            'data' => $car,
        ], 200);
    }

    /**
     * Admin — delete car (admin only)
     */
    public function destroy($id)
    {
        $car = Car::findOrFail($id);

        $hasActiveAuctions = $car->auctions()->where('status', AuctionStatus::ACTIVE->value)->exists();
        if ($hasActiveAuctions) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot delete car with active auctions. Please cancel the auctions first.',
            ], 400);
        }

        $car->auctions()->where('status', AuctionStatus::SCHEDULED->value)
            ->update(['status' => AuctionStatus::CANCELLED->value]);

        $car->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Car deleted successfully',
        ], 200);
    }

    // ================= Helpers =================

    private function enumValues(string $enumClass): array
    {
        return array_map(fn($c) => $c->value, $enumClass::cases());
    }

    private function normalizeCarStatus(string $status): string
    {
        $s = strtolower(trim($status));
        if ($s === 'canceled') return 'cancelled';
        return $s;
    }
}

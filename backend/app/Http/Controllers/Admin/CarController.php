<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\CarCollection;
use App\Models\Car;
use App\Models\Auction;
use App\Enums\AuctionStatus;
use App\Enums\AuctionType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class CarController extends Controller
{
    /**
     * Display a listing of cars.
     * GET /api/admin/cars
     * 
     * ✅ Performance: Fixed N+1 with eager loading
     */
    public function index(Request $request)
    {
        $query = Car::query();

        // ✅ Eager loading to prevent N+1
        $query->with([
            'dealer:id,user_id,company_name',
            'dealer.user:id,first_name,last_name,email,phone',
            'user:id,first_name,last_name',
            'auctions' => fn($q) => $q->latest()->limit(1),
        ]);

        // Filters
        if ($request->filled('auction_status')) {
            $query->where('auction_status', $request->auction_status);
        }

        if ($request->filled('condition')) {
            $query->where('condition', $request->condition);
        }

        if ($request->filled('make')) {
            $query->where('make', 'like', "%{$request->make}%");
        }

        if ($request->filled('model')) {
            $query->where('model', 'like', "%{$request->model}%");
        }

        if ($request->filled('year_from')) {
            $query->where('year', '>=', (int) $request->year_from);
        }

        if ($request->filled('year_to')) {
            $query->where('year', '<=', (int) $request->year_to);
        }

        if ($request->filled('dealer_id')) {
            $query->where('dealer_id', $request->dealer_id);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('make', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%")
                  ->orWhere('vin', 'like', "%{$search}%")
                  ->orWhere('color', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['created_at', 'year', 'evaluation_price', 'odometer', 'make', 'model'];
        
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');
        }

        $perPage = min(50, max(1, (int) $request->get('per_page', 15)));
        
        return new CarCollection($query->paginate($perPage));
    }

    /**
     * Display the specified car.
     * GET /api/admin/cars/{id}
     */
    public function show($id): JsonResponse
    {
        $car = Car::with([
            'dealer.user:id,first_name,last_name,email,phone',
            'user:id,first_name,last_name,email',
            'images',
            'auctions' => fn($q) => $q->orderBy('created_at', 'desc'),
            'auctions.bids' => fn($q) => $q->orderBy('created_at', 'desc')->limit(5),
        ])->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data'   => $car,
        ]);
    }

    /**
     * Update the specified car.
     * PUT /api/admin/cars/{id}
     */
    public function update(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'make'             => 'sometimes|string|max:100',
            'model'            => 'sometimes|string|max:100',
            'year'             => 'sometimes|integer|min:1900|max:' . (date('Y') + 1),
            'vin'              => 'sometimes|string|max:50',
            'odometer'         => 'sometimes|integer|min:0',
            'color'            => 'sometimes|string|max:50',
            'condition'        => 'sometimes|string',
            'evaluation_price' => 'sometimes|numeric|min:0',
            'auction_status'   => 'sometimes|string|in:available,pending,in_auction,sold,withdrawn',
            'description'      => 'sometimes|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $car = Car::findOrFail($id);
            
            $car->fill($request->only([
                'make', 'model', 'year', 'vin', 'odometer', 'color',
                'condition', 'evaluation_price', 'auction_status', 'description'
            ]));
            
            $car->save();

            Log::info('Car updated by admin', [
                'car_id'   => $id,
                'admin_id' => auth()->id(),
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'تم تحديث بيانات السيارة بنجاح',
                'data'    => $car->fresh(['dealer.user', 'images']),
            ]);

        } catch (\Exception $e) {
            Log::error('Car update failed', ['error' => $e->getMessage(), 'car_id' => $id]);

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء تحديث السيارة'
            ], 500);
        }
    }

    /**
     * Delete the specified car.
     * DELETE /api/admin/cars/{id}
     */
    public function destroy($id): JsonResponse
    {
        try {
            $car = Car::with('auctions')->findOrFail($id);

            // Check if car has active auctions
            $hasActiveAuction = $car->auctions()
                ->whereIn('status', AuctionStatus::activeValues())
                ->exists();

            if ($hasActiveAuction) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'لا يمكن حذف السيارة، يوجد مزاد نشط مرتبط بها'
                ], 422);
            }

            DB::beginTransaction();

            // Delete related auctions first
            $car->auctions()->delete();
            
            // Delete car images (if needed)
            // $car->images()->delete();
            
            $car->delete();

            DB::commit();

            Log::info('Car deleted by admin', [
                'car_id'   => $id,
                'admin_id' => auth()->id(),
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'تم حذف السيارة بنجاح',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Car deletion failed', ['error' => $e->getMessage(), 'car_id' => $id]);

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء حذف السيارة'
            ], 500);
        }
    }

    /**
     * Create auction for a car.
     * POST /api/admin/cars/{id}/create-auction
     */
    public function createAuction(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'session_id'    => 'nullable|exists:auction_sessions,id',
            'start_time'    => 'required|date|after:now',
            'end_time'      => 'required|date|after:start_time',
            'minimum_bid'   => 'required|numeric|min:0',
            'reserve_price' => 'required|numeric|min:0',
            'opening_price' => 'nullable|numeric|min:0',
            'auction_type'  => 'required|in:' . implode(',', AuctionType::values()),
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $car = Car::findOrFail($id);

            // Check if car already has active auction
            $hasActiveAuction = Auction::where('car_id', $id)
                ->whereIn('status', AuctionStatus::activeValues())
                ->exists();

            if ($hasActiveAuction) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'السيارة لديها مزاد نشط بالفعل'
                ], 422);
            }

            DB::beginTransaction();

            $auction = Auction::create([
                'car_id'        => $id,
                'session_id'    => $request->session_id,
                'start_time'    => $request->start_time,
                'end_time'      => $request->end_time,
                'minimum_bid'   => $request->minimum_bid,
                'reserve_price' => $request->reserve_price,
                'opening_price' => $request->opening_price ?? $request->minimum_bid,
                'auction_type'  => $request->auction_type,
                'status'        => AuctionStatus::SCHEDULED,
                'control_room_approved' => false,
                'approved_for_live'     => false,
            ]);

            $car->auction_status = 'pending';
            $car->save();

            DB::commit();

            Log::info('Auction created by admin', [
                'auction_id' => $auction->id,
                'car_id'     => $id,
                'admin_id'   => auth()->id(),
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'تم إنشاء المزاد بنجاح',
                'data'    => $auction->load('car'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Auction creation failed', ['error' => $e->getMessage(), 'car_id' => $id]);

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء إنشاء المزاد'
            ], 500);
        }
    }

    /**
     * Get car statistics.
     * GET /api/admin/cars/stats
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'total'       => Car::count(),
            'available'   => Car::where('auction_status', 'available')->count(),
            'pending'     => Car::where('auction_status', 'pending')->count(),
            'in_auction'  => Car::where('auction_status', 'in_auction')->count(),
            'sold'        => Car::where('auction_status', 'sold')->count(),
            'withdrawn'   => Car::where('auction_status', 'withdrawn')->count(),
            'by_condition'=> Car::select('condition', DB::raw('COUNT(*) as count'))
                ->groupBy('condition')
                ->pluck('count', 'condition'),
            'avg_price'   => round(Car::avg('evaluation_price') ?? 0, 2),
        ];

        return response()->json([
            'status' => 'success',
            'data'   => $stats,
        ]);
    }
}

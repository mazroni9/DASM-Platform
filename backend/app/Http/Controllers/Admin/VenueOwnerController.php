<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\VenueOwner;
use App\Models\User;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class VenueOwnerController extends Controller
{
    /**
     * Display a listing of venue owners.
     * GET /api/admin/venue-owners
     */
    public function index(Request $request): JsonResponse
    {
        $query = VenueOwner::with([
            'user:id,first_name,last_name,email,phone,is_active,status,created_at',
        ]);

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Active filter
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('venue_name', 'like', "%{$search}%")
                  ->orWhere('commercial_registry', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('first_name', 'like', "%{$search}%")
                         ->orWhere('last_name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%")
                         ->orWhere('phone', 'like', "%{$search}%");
                  });
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['created_at', 'venue_name', 'rating', 'status'];
        
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');
        }

        $perPage = min(50, max(1, (int) $request->get('per_page', 15)));
        $venueOwners = $query->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data'   => $venueOwners,
        ]);
    }

    /**
     * Display the specified venue owner.
     * GET /api/admin/venue-owners/{id}
     */
    public function show($id): JsonResponse
    {
        $venueOwner = VenueOwner::with([
            'user',
            'reviews' => fn($q) => $q->where('is_approved', true)->orderBy('created_at', 'desc')->limit(10),
            'reviews.user:id,first_name,last_name',
            'commissionOperations' => fn($q) => $q->orderBy('created_at', 'desc')->limit(10),
            'shipments' => fn($q) => $q->orderBy('created_at', 'desc')->limit(10),
        ])->findOrFail($id);

        // Load additional stats
        $stats = [
            'total_reviews'     => $venueOwner->reviews()->count(),
            'approved_reviews'  => $venueOwner->reviews()->where('is_approved', true)->count(),
            'pending_reviews'   => $venueOwner->reviews()->where('is_approved', false)->count(),
            'total_commission'  => $venueOwner->commissionOperations()->sum('amount'),
            'total_shipments'   => $venueOwner->shipments()->count(),
        ];

        return response()->json([
            'status' => 'success',
            'data'   => $venueOwner,
            'stats'  => $stats,
        ]);
    }

    /**
     * Store a newly created venue owner.
     * POST /api/admin/venue-owners
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            // User fields
            'first_name' => 'required|string|max:255',
            'last_name'  => 'required|string|max:255',
            'email'      => 'required|email|unique:users,email',
            'phone'      => 'required|string|max:15|unique:users,phone',
            'password'   => 'required|string|min:8|confirmed',
            // Venue owner fields
            'venue_name'          => 'required|string|max:255',
            'commercial_registry' => 'nullable|string|max:100',
            'description'         => 'nullable|string',
            'address'             => 'nullable|string',
            'commission_value'    => 'nullable|numeric|min:0',
            'commission_currency' => 'nullable|string|max:10',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Create user
            $user = User::create([
                'first_name'        => $request->first_name,
                'last_name'         => $request->last_name,
                'email'             => $request->email,
                'phone'             => $request->phone,
                'password_hash'     => Hash::make($request->password),
                'type'              => UserRole::VENUE_OWNER,
                'is_active'         => true,
                'status'            => UserStatus::ACTIVE,
                'email_verified_at' => now(),
            ]);

            // Create venue owner
            $venueOwner = VenueOwner::create([
                'user_id'             => $user->id,
                'venue_name'          => $request->venue_name,
                'commercial_registry' => $request->commercial_registry,
                'description'         => $request->description,
                'address'             => $request->address,
                'commission_value'    => $request->commission_value,
                'commission_currency' => $request->commission_currency ?? 'SAR',
                'status'              => 'active',
                'is_active'           => true,
            ]);

            DB::commit();

            Log::info('Venue owner created by admin', [
                'venue_owner_id' => $venueOwner->id,
                'admin_id'       => auth()->id(),
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'تم إنشاء مالك المعرض بنجاح',
                'data'    => $venueOwner->load('user'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Venue owner creation failed', ['error' => $e->getMessage()]);

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء إنشاء مالك المعرض'
            ], 500);
        }
    }

    /**
     * Update the specified venue owner.
     * PUT /api/admin/venue-owners/{id}
     */
    public function update(Request $request, $id): JsonResponse
    {
        $venueOwner = VenueOwner::with('user')->findOrFail($id);

        $validator = Validator::make($request->all(), [
            // User fields
            'first_name' => 'sometimes|string|max:255',
            'last_name'  => 'sometimes|string|max:255',
            'email'      => 'sometimes|email|unique:users,email,' . $venueOwner->user_id,
            'phone'      => 'sometimes|string|max:15|unique:users,phone,' . $venueOwner->user_id,
            'password'   => 'sometimes|nullable|string|min:8',
            // Venue owner fields
            'venue_name'          => 'sometimes|string|max:255',
            'commercial_registry' => 'sometimes|nullable|string|max:100',
            'description'         => 'sometimes|nullable|string',
            'address'             => 'sometimes|nullable|string',
            'commission_value'    => 'sometimes|nullable|numeric|min:0',
            'commission_currency' => 'sometimes|nullable|string|max:10',
            'status'              => 'sometimes|string|in:active,inactive,pending,suspended',
            'is_active'           => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Update user
            if ($venueOwner->user) {
                $venueOwner->user->fill($request->only(['first_name', 'last_name', 'email', 'phone']));
                
                if ($request->filled('password')) {
                    $venueOwner->user->password_hash = Hash::make($request->password);
                }
                
                $venueOwner->user->save();
            }

            // Update venue owner
            $venueOwner->fill($request->only([
                'venue_name', 'commercial_registry', 'description', 'address',
                'commission_value', 'commission_currency', 'status', 'is_active'
            ]));
            $venueOwner->save();

            DB::commit();

            Log::info('Venue owner updated by admin', [
                'venue_owner_id' => $id,
                'admin_id'       => auth()->id(),
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'تم تحديث بيانات مالك المعرض بنجاح',
                'data'    => $venueOwner->fresh('user'),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Venue owner update failed', ['error' => $e->getMessage(), 'id' => $id]);

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء تحديث البيانات'
            ], 500);
        }
    }

    /**
     * Update venue owner status.
     * PATCH /api/admin/venue-owners/{id}/status
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status'    => 'sometimes|string|in:active,inactive,pending,suspended',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $venueOwner = VenueOwner::with('user')->findOrFail($id);

            if ($request->has('status')) {
                $venueOwner->status = $request->status;
            }
            if ($request->has('is_active')) {
                $venueOwner->is_active = $request->is_active;
                
                // Sync user status
                if ($venueOwner->user) {
                    $venueOwner->user->is_active = $request->is_active;
                    $venueOwner->user->save();
                }
            }

            $venueOwner->save();

            Log::info('Venue owner status updated', [
                'venue_owner_id' => $id,
                'admin_id'       => auth()->id(),
                'status'         => $venueOwner->status,
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'تم تحديث الحالة بنجاح',
                'data'    => $venueOwner->fresh('user'),
            ]);

        } catch (\Exception $e) {
            Log::error('Venue owner status update failed', ['error' => $e->getMessage(), 'id' => $id]);

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء تحديث الحالة'
            ], 500);
        }
    }

    /**
     * Delete the specified venue owner.
     * DELETE /api/admin/venue-owners/{id}
     */
    public function destroy($id): JsonResponse
    {
        try {
            $venueOwner = VenueOwner::with(['shipments', 'commissionOperations'])->findOrFail($id);

            // Check for active operations
            $hasActiveShipments = $venueOwner->shipments()
                ->whereIn('status', ['pending', 'in_transit'])
                ->exists();

            if ($hasActiveShipments) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'لا يمكن حذف مالك المعرض، يوجد شحنات نشطة مرتبطة به'
                ], 422);
            }

            DB::beginTransaction();

            // Delete venue owner (soft delete if enabled)
            $venueOwner->delete();

            // Optionally delete or deactivate user
            // $venueOwner->user?->delete();

            DB::commit();

            Log::info('Venue owner deleted by admin', [
                'venue_owner_id' => $id,
                'admin_id'       => auth()->id(),
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'تم حذف مالك المعرض بنجاح',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Venue owner deletion failed', ['error' => $e->getMessage(), 'id' => $id]);

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء الحذف'
            ], 500);
        }
    }

    /**
     * Get venue owner statistics.
     * GET /api/admin/venue-owners/stats
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'total'         => VenueOwner::count(),
            'active'        => VenueOwner::where('is_active', true)->count(),
            'inactive'      => VenueOwner::where('is_active', false)->count(),
            'by_status'     => VenueOwner::select('status', DB::raw('COUNT(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status'),
            'avg_rating'    => round(VenueOwner::avg('rating') ?? 0, 2),
            'total_commission' => DB::table('venue_commission_operations')->sum('amount'),
        ];

        return response()->json([
            'status' => 'success',
            'data'   => $stats,
        ]);
    }
}

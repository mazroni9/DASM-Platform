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
use Illuminate\Support\Facades\Schema;

class VenueOwnerController extends Controller
{
    /**
     * Display a listing of venue owners.
     * GET /api/admin/venue-owners
     */
    public function index(Request $request): JsonResponse
    {
        $query = VenueOwner::query()->with([
            'user:id,first_name,last_name,email,phone,is_active,status,created_at',
        ]);

        // ✅ لو عندك علاقة cars في الموديل، هتطلع count باسم venue_cars_count
        if (method_exists(VenueOwner::class, 'cars')) {
            $query->withCount(['cars as venue_cars_count']);
        }

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
        $sortBy  = $request->get('sort_by', 'created_at');
        $sortDir = strtolower($request->get('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        $allowedSorts = ['id', 'created_at', 'updated_at', 'venue_name', 'rating', 'status', 'is_active'];

        if ($sortBy === 'user_name') {
            // ✅ فرز باسم المستخدم
            $query->leftJoin('users', 'venue_owners.user_id', '=', 'users.id')
                ->select('venue_owners.*')
                ->orderBy('users.first_name', $sortDir)
                ->orderBy('users.last_name', $sortDir);
        } elseif (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('created_at', 'desc');
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
            'reviews' => fn ($q) => $q->where('is_approved', true)->orderBy('created_at', 'desc')->limit(10),
            'reviews.user:id,first_name,last_name',
            'commissionOperations' => fn ($q) => $q->orderBy('created_at', 'desc')->limit(10),
            'shipments' => fn ($q) => $q->orderBy('created_at', 'desc')->limit(10),
        ])->findOrFail($id);

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
     * ✅ APPROVE venue owner
     * POST /api/admin/venue-owners/{id}/approve
     */
    public function approve($id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $venueOwner = VenueOwner::with('user')->findOrFail($id);

            $venueOwner->status = 'active';
            $venueOwner->is_active = true;
            $venueOwner->save();

            if ($venueOwner->user) {
                $venueOwner->user->is_active = true;

                // لو status متخزن كـ enum في User model، ده آمن لأنك بالفعل مستخدم ACTIVE في store()
                $venueOwner->user->status = UserStatus::ACTIVE;
                $venueOwner->user->save();
            }

            DB::commit();

            Log::info('Venue owner approved by admin', [
                'venue_owner_id' => $venueOwner->id,
                'admin_id' => auth()->id(),
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'تم قبول مالك المعرض وتفعيله بنجاح',
                'data'    => $venueOwner->fresh('user'),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Venue owner approve failed', ['error' => $e->getMessage(), 'id' => $id]);

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء الموافقة',
            ], 500);
        }
    }

    /**
     * ✅ REJECT venue owner
     * POST /api/admin/venue-owners/{id}/reject
     */
    public function reject(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'sometimes|nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            DB::beginTransaction();

            $venueOwner = VenueOwner::with('user')->findOrFail($id);

            $venueOwner->status = 'rejected';
            $venueOwner->is_active = false;

            // لو عندك عمود reason (اختياري)
            if ($request->filled('reason')) {
                if (Schema::hasColumn($venueOwner->getTable(), 'rejection_reason')) {
                    $venueOwner->rejection_reason = $request->reason;
                }
            }

            $venueOwner->save();

            if ($venueOwner->user) {
                $venueOwner->user->is_active = false;
                // ما بنغيرش user.status هنا عشان ما نكسرش enum لو مش فيه rejected
                $venueOwner->user->save();
            }

            DB::commit();

            Log::info('Venue owner rejected by admin', [
                'venue_owner_id' => $venueOwner->id,
                'admin_id' => auth()->id(),
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'تم رفض مالك المعرض بنجاح',
                'data'    => $venueOwner->fresh('user'),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Venue owner reject failed', ['error' => $e->getMessage(), 'id' => $id]);

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء الرفض',
            ], 500);
        }
    }

    /**
     * ✅ TOGGLE STATUS (route موجود عندك)
     * POST /api/admin/venue-owners/{id}/toggle-status
     *
     * - لو بعت is_active => هيتطبق
     * - لو مبعتش => هيعمل toggle
     * - ممكن تبعت status كمان (pending/active/rejected/inactive/suspended)
     */
    public function toggleStatus(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'is_active' => 'sometimes|boolean',
            'status'    => 'sometimes|string|in:active,inactive,pending,suspended,rejected',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            DB::beginTransaction();

            $venueOwner = VenueOwner::with('user')->findOrFail($id);

            $newIsActive = $request->has('is_active')
                ? (bool) $request->boolean('is_active')
                : !$venueOwner->is_active;

            $venueOwner->is_active = $newIsActive;

            if ($request->has('status')) {
                $venueOwner->status = $request->status;
            } else {
                // لو اتفعل ومافيش status مبعوت، نخليه active
                if ($newIsActive && $venueOwner->status !== 'active') {
                    $venueOwner->status = 'active';
                }
            }

            $venueOwner->save();

            if ($venueOwner->user) {
                $venueOwner->user->is_active = $newIsActive;

                // لو اتفعل نخليه ACTIVE (ده متوافق مع store())
                if ($newIsActive) {
                    $venueOwner->user->status = UserStatus::ACTIVE;
                }

                $venueOwner->user->save();
            }

            DB::commit();

            return response()->json([
                'status'  => 'success',
                'message' => 'تم تحديث حالة التفعيل بنجاح',
                'data'    => $venueOwner->fresh('user'),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Venue owner toggleStatus failed', ['error' => $e->getMessage(), 'id' => $id]);

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء تحديث حالة التفعيل',
            ], 500);
        }
    }

    /**
     * ✅ CARS (route موجود عندك)
     * GET /api/admin/venue-owners/{id}/cars
     *
     * بيحاول:
     * 1) لو VenueOwner model فيه relation اسمها cars() => يستخدمها
     * 2) لو مفيش => يحاول fallback على جدول cars لو موجود
     */
    public function cars(Request $request, $id): JsonResponse
    {
        $venueOwner = VenueOwner::findOrFail($id);
        $perPage = min(50, max(1, (int) $request->get('per_page', 15)));

        // 1) لو عندك علاقة cars() في الموديل
        if (method_exists($venueOwner, 'cars')) {
            $q = $venueOwner->cars();

            // Search بسيط لو حابب
            if ($request->filled('search')) {
                $s = $request->search;
                $q->where(function ($qq) use ($s) {
                    $qq->where('title', 'like', "%{$s}%")
                        ->orWhere('name', 'like', "%{$s}%")
                        ->orWhere('vin', 'like', "%{$s}%")
                        ->orWhere('plate_number', 'like', "%{$s}%");
                });
            }

            $cars = $q->orderByDesc('id')->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data'   => $cars,
            ]);
        }

        // 2) Fallback على جدول cars لو موجود
        try {
            if (Schema::hasTable('cars')) {
                $q = DB::table('cars');

                // نحاول أشهر أسماء الأعمدة اللي بتربط السيارة بالمالك
                $candidateCols = ['venue_owner_id', 'owner_id', 'venue_id', 'exhibitor_id', 'dealer_id', 'user_id'];

                $linked = false;
                foreach ($candidateCols as $col) {
                    if (Schema::hasColumn('cars', $col)) {
                        $q->where($col, $venueOwner->id);
                        $linked = true;
                        break;
                    }
                }

                if (!$linked) {
                    return response()->json([
                        'status'  => 'success',
                        'message' => 'لا توجد علاقة سيارات معرفة لمالك المعرض حالياً',
                        'data'    => [
                            'current_page' => 1,
                            'data' => [],
                            'per_page' => $perPage,
                            'total' => 0,
                            'last_page' => 1,
                        ],
                    ]);
                }

                if ($request->filled('search')) {
                    $s = $request->search;
                    $q->where(function ($qq) use ($s) {
                        $qq->where('title', 'like', "%{$s}%")
                            ->orWhere('name', 'like', "%{$s}%")
                            ->orWhere('vin', 'like', "%{$s}%")
                            ->orWhere('plate_number', 'like', "%{$s}%");
                    });
                }

                $cars = $q->orderByDesc('id')->paginate($perPage);

                return response()->json([
                    'status' => 'success',
                    'data'   => $cars,
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('VenueOwner cars fallback failed', ['error' => $e->getMessage(), 'id' => $id]);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'لا توجد سيارات (أو لم يتم إعداد العلاقة بعد)',
            'data'    => [
                'current_page' => 1,
                'data' => [],
                'per_page' => $perPage,
                'total' => 0,
                'last_page' => 1,
            ],
        ]);
    }

    /**
     * ✅ WALLET (route موجود عندك)
     * GET /api/admin/venue-owners/{id}/wallet
     */
    public function wallet(Request $request, $id): JsonResponse
    {
        $venueOwner = VenueOwner::with('user')->findOrFail($id);

        if (method_exists($venueOwner, 'wallet')) {
            $wallet = $venueOwner->wallet()->first();

            return response()->json([
                'status' => 'success',
                'data'   => $wallet,
            ]);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'لا يوجد Wallet relation معرفة حالياً لمالك المعرض',
            'data'    => null,
        ]);
    }

    /**
     * ✅ WALLET TRANSACTIONS (route موجود عندك)
     * GET /api/admin/venue-owners/{id}/wallet/transactions
     */
    public function walletTransactions(Request $request, $id): JsonResponse
    {
        $venueOwner = VenueOwner::findOrFail($id);
        $perPage = min(50, max(1, (int) $request->get('per_page', 15)));

        // لو عندك relation باسم walletTransactions أو transactions
        if (method_exists($venueOwner, 'walletTransactions')) {
            $tx = $venueOwner->walletTransactions()->orderByDesc('id')->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data'   => $tx,
            ]);
        }

        if (method_exists($venueOwner, 'transactions')) {
            $tx = $venueOwner->transactions()->orderByDesc('id')->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data'   => $tx,
            ]);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'لا توجد Wallet Transactions relation معرفة حالياً',
            'data'    => [
                'current_page' => 1,
                'data' => [],
                'per_page' => $perPage,
                'total' => 0,
                'last_page' => 1,
            ],
        ]);
    }

    /**
     * Store a newly created venue owner.
     * POST /api/admin/venue-owners
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name'  => 'required|string|max:255',
            'email'      => 'required|email|unique:users,email',
            'phone'      => 'required|string|max:15|unique:users,phone',
            'password'   => 'required|string|min:8|confirmed',

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
        } catch (\Throwable $e) {
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
            'first_name' => 'sometimes|string|max:255',
            'last_name'  => 'sometimes|string|max:255',
            'email'      => 'sometimes|email|unique:users,email,' . $venueOwner->user_id,
            'phone'      => 'sometimes|string|max:15|unique:users,phone,' . $venueOwner->user_id,
            'password'   => 'sometimes|nullable|string|min:8',

            'venue_name'          => 'sometimes|string|max:255',
            'commercial_registry' => 'sometimes|nullable|string|max:100',
            'description'         => 'sometimes|nullable|string',
            'address'             => 'sometimes|nullable|string',
            'commission_value'    => 'sometimes|nullable|numeric|min:0',
            'commission_currency' => 'sometimes|nullable|string|max:10',

            // ✅ دعم rejected كمان
            'status'              => 'sometimes|string|in:active,inactive,pending,suspended,rejected',
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

            if ($venueOwner->user) {
                $venueOwner->user->fill($request->only(['first_name', 'last_name', 'email', 'phone']));

                if ($request->filled('password')) {
                    $venueOwner->user->password_hash = Hash::make($request->password);
                }

                $venueOwner->user->save();
            }

            $venueOwner->fill($request->only([
                'venue_name', 'commercial_registry', 'description', 'address',
                'commission_value', 'commission_currency', 'status', 'is_active'
            ]));
            $venueOwner->save();

            // sync is_active على user لو موجود
            if ($request->has('is_active') && $venueOwner->user) {
                $venueOwner->user->is_active = (bool) $request->boolean('is_active');
                $venueOwner->user->save();
            }

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
        } catch (\Throwable $e) {
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
            'status'    => 'sometimes|string|in:active,inactive,pending,suspended,rejected',
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
                $venueOwner->is_active = (bool) $request->boolean('is_active');

                if ($venueOwner->user) {
                    $venueOwner->user->is_active = (bool) $request->boolean('is_active');
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
        } catch (\Throwable $e) {
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

            $venueOwner->delete();

            DB::commit();

            Log::info('Venue owner deleted by admin', [
                'venue_owner_id' => $id,
                'admin_id'       => auth()->id(),
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'تم حذف مالك المعرض بنجاح',
            ]);
        } catch (\Throwable $e) {
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
            'total'            => VenueOwner::count(),
            'active'           => VenueOwner::where('is_active', true)->count(),
            'inactive'         => VenueOwner::where('is_active', false)->count(),
            'by_status'        => VenueOwner::select('status', DB::raw('COUNT(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status'),
            'avg_rating'       => round(VenueOwner::avg('rating') ?? 0, 2),
            'total_commission' => DB::table('venue_commission_operations')->sum('amount'),
        ];

        return response()->json([
            'status' => 'success',
            'data'   => $stats,
        ]);
    }
}

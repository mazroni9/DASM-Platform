<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Dealer;
use App\Models\VenueOwner;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    /**
     * Display a listing of users.
     * GET /api/admin/users
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        // ✅ Eager loading
        $query->with([
            'dealer:id,user_id,company_name,status',
            'venueOwner:id,user_id,venue_name,status',
            'area:id,name,code',
            'roles:id,name,display_name',
        ]);

        // ✅ Exclude super admins from non-super-admin views
        /** @var User $currentUser */
        $currentUser = auth()->user();
        if ($currentUser->type !== UserRole::SUPER_ADMIN) {
            $query->where('type', '!=', UserRole::SUPER_ADMIN);
        }

        // Type filter
        if ($request->filled('type')) {
            $type = UserRole::tryFrom($request->type);
            if ($type) {
                $query->where('type', $type);
            }
        }

        // Status filter
        if ($request->filled('status')) {
            $status = UserStatus::tryFrom($request->status);
            if ($status) {
                $query->where('status', $status);
            }
        }

        // Active filter
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // KYC filter
        if ($request->filled('kyc_status')) {
            $query->where('kyc_status', $request->kyc_status);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('user_code', 'like', "%{$search}%");
            });
        }

        // Date range
        if ($request->filled('created_from')) {
            $query->whereDate('created_at', '>=', $request->created_from);
        }
        if ($request->filled('created_to')) {
            $query->whereDate('created_at', '<=', $request->created_to);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['created_at', 'first_name', 'last_name', 'email', 'type', 'status'];
        
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');
        }

        $perPage = min(50, max(1, (int) $request->get('per_page', 15)));
        $users = $query->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data'   => $users,
        ]);
    }

    /**
     * Display the specified user.
     * GET /api/admin/users/{id}
     */
    public function show($id): JsonResponse
    {
        $user = User::with([
            'dealer',
            'venueOwner',
            'area',
            'roles',
            'wallet',
            'bids' => fn($q) => $q->orderBy('created_at', 'desc')->limit(10),
            'cars' => fn($q) => $q->orderBy('created_at', 'desc')->limit(10),
        ])->findOrFail($id);

        // ✅ Security: Non-super-admins cannot view super admin details
        /** @var User $currentUser */
        $currentUser = auth()->user();
        if ($user->type === UserRole::SUPER_ADMIN && $currentUser->type !== UserRole::SUPER_ADMIN) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Unauthorized'
            ], 403);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $user,
        ]);
    }

    /**
     * Update the specified user.
     * PUT /api/admin/users/{id}
     */
    public function update(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);

        // ✅ Security check
        /** @var User $currentUser */
        $currentUser = auth()->user();
        if ($user->type === UserRole::SUPER_ADMIN && $currentUser->type !== UserRole::SUPER_ADMIN) {
            return response()->json([
                'status'  => 'error',
                'message' => 'لا يمكنك تعديل بيانات مدير النظام الرئيسي'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'first_name' => 'sometimes|string|max:255',
            'last_name'  => 'sometimes|string|max:255',
            'email'      => 'sometimes|email|unique:users,email,' . $id,
            'phone'      => 'sometimes|string|max:15|unique:users,phone,' . $id,
            'password'   => 'sometimes|nullable|string|min:8',
            'type'       => 'sometimes|in:' . implode(',', UserRole::values()),
            'status'     => 'sometimes|in:' . implode(',', array_column(UserStatus::cases(), 'value')),
            'is_active'  => 'sometimes|boolean',
            'kyc_status' => 'sometimes|string',
            'area_id'    => 'sometimes|nullable|exists:areas,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // ✅ Prevent type change for super admin
            if ($user->type === UserRole::SUPER_ADMIN && $request->has('type') && $request->type !== UserRole::SUPER_ADMIN->value) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'لا يمكن تغيير نوع مدير النظام الرئيسي'
                ], 403);
            }

            $user->fill($request->only([
                'first_name', 'last_name', 'email', 'phone',
                'type', 'status', 'is_active', 'kyc_status', 'area_id'
            ]));

            if ($request->filled('password')) {
                $user->password_hash = Hash::make($request->password);
            }

            $user->save();

            Log::info('User updated by admin', [
                'user_id'  => $id,
                'admin_id' => $currentUser->id,
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'تم تحديث بيانات المستخدم بنجاح',
                'data'    => $user->fresh(['dealer', 'venueOwner', 'roles']),
            ]);

        } catch (\Exception $e) {
            Log::error('User update failed', ['error' => $e->getMessage(), 'user_id' => $id]);

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء تحديث المستخدم'
            ], 500);
        }
    }

    /**
     * Update user status.
     * PATCH /api/admin/users/{id}/status
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status'    => 'sometimes|in:' . implode(',', array_column(UserStatus::cases(), 'value')),
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::findOrFail($id);

            // ✅ Security
            /** @var User $currentUser */
            $currentUser = auth()->user();
            if ($user->type === UserRole::SUPER_ADMIN && $currentUser->type !== UserRole::SUPER_ADMIN) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Unauthorized'
                ], 403);
            }

            // Cannot deactivate yourself
            if ($currentUser->id === $user->id && $request->has('is_active') && !$request->is_active) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'لا يمكنك إلغاء تفعيل حسابك'
                ], 403);
            }

            if ($request->has('status')) {
                $user->status = $request->status;
            }
            if ($request->has('is_active')) {
                $user->is_active = $request->is_active;
            }

            $user->save();

            Log::info('User status updated', [
                'user_id'  => $id,
                'admin_id' => $currentUser->id,
                'status'   => $user->status,
                'active'   => $user->is_active,
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'تم تحديث حالة المستخدم بنجاح',
                'data'    => $user,
            ]);

        } catch (\Exception $e) {
            Log::error('User status update failed', ['error' => $e->getMessage(), 'user_id' => $id]);

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء تحديث الحالة'
            ], 500);
        }
    }

    /**
     * Delete the specified user.
     * DELETE /api/admin/users/{id}
     */
    public function destroy($id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            // ✅ Security checks
            /** @var User $currentUser */
            $currentUser = auth()->user();

            // Cannot delete super admin
            if ($user->type === UserRole::SUPER_ADMIN) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'لا يمكن حذف مدير النظام الرئيسي'
                ], 403);
            }

            // Cannot delete yourself
            if ($currentUser->id === $user->id) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'لا يمكنك حذف حسابك الشخصي'
                ], 403);
            }

            // Check for active auctions/bids
            $hasActiveBids = $user->bids()
                ->whereHas('auction', fn($q) => $q->whereIn('status', ['live', 'active']))
                ->exists();

            if ($hasActiveBids) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'لا يمكن حذف المستخدم، لديه مزايدات نشطة'
                ], 422);
            }

            DB::beginTransaction();

            // Soft delete or hard delete based on your needs
            $user->delete();

            DB::commit();

            Log::info('User deleted by admin', [
                'user_id'  => $id,
                'admin_id' => $currentUser->id,
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'تم حذف المستخدم بنجاح',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('User deletion failed', ['error' => $e->getMessage(), 'user_id' => $id]);

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء حذف المستخدم'
            ], 500);
        }
    }

    /**
     * Get user statistics.
     * GET /api/admin/users/stats
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'total'     => User::count(),
            'active'    => User::where('is_active', true)->count(),
            'inactive'  => User::where('is_active', false)->count(),
            'pending'   => User::where('status', UserStatus::PENDING)->count(),
            'by_type'   => User::select('type', DB::raw('COUNT(*) as count'))
                ->groupBy('type')
                ->pluck('count', 'type'),
            'by_status' => User::select('status', DB::raw('COUNT(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status'),
            'dealers'   => Dealer::count(),
            'venue_owners' => VenueOwner::count(),
            'new_today' => User::whereDate('created_at', today())->count(),
            'new_this_week' => User::whereBetween('created_at', [now()->startOfWeek(), now()])->count(),
        ];

        return response()->json([
            'status' => 'success',
            'data'   => $stats,
        ]);
    }
}

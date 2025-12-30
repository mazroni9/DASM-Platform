<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;

class StaffController extends Controller
{
    /**
     * Staff types allowed
     */
    private const STAFF_TYPES = [UserRole::ADMIN, UserRole::MODERATOR];

    /**
     * Protected role names
     */
    private const PROTECTED_ROLES = ['super_admin', 'platform_super_admin'];

    /**
     * Display a listing of staff (admins and moderators).
     */
    public function index(Request $request)
    {
        try {
            $query = User::whereIn('type', self::STAFF_TYPES)
                ->with('roles:id,name,display_name');

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            }

            if ($request->filled('status')) {
                if ($request->status === 'active') {
                    $query->where('is_active', true);
                } elseif ($request->status === 'inactive') {
                    $query->where('is_active', false);
                }
            }

            if ($request->filled('type')) {
                $type = UserRole::tryFrom($request->type);
                if ($type && in_array($type, self::STAFF_TYPES)) {
                    $query->where('type', $type);
                }
            }

            $moderators = $query->orderBy('created_at', 'desc')->paginate(15);

            return response()->json([
                'status' => 'success',
                'data'   => $moderators
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching staff', ['error' => $e->getMessage()]);

            return response()->json([
                'status'  => 'error',
                'message' => 'فشل في تحميل بيانات الموظفين'
            ], 500);
        }
    }

    /**
     * Store a newly created staff member.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name'     => 'required|string|max:255',
            'last_name'      => 'required|string|max:255',
            'email'          => 'required|email|unique:users,email',
            'phone'          => 'required|string|max:15|unique:users,phone',
            'password'       => 'required|string|min:8|confirmed',
            'type'           => 'required|in:admin,moderator',
            'spatie_role_id' => 'nullable|exists:roles,id',
        ], $this->validationMessages());

        if ($validator->fails()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'بيانات غير صالحة',
                'errors'  => $validator->errors()
            ], 422);
        }

        // ✅ Security: Check super_admin role assignment
        if (!$this->canAssignRole($request->spatie_role_id)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'لا تملك صلاحية تعيين هذا الدور'
            ], 403);
        }

        try {
            $platform_organization = Organization::where('slug', 'dasm-e-platform')
                ->where('type', 'platform')
                ->first();

            if (!$platform_organization) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'لم يتم العثور على المنظمة الأساسية'
                ], 500);
            }

            $staff = User::create([
                'first_name'        => $request->first_name,
                'last_name'         => $request->last_name,
                'email'             => $request->email,
                'phone'             => $request->phone,
                'password_hash'     => Hash::make($request->password),
                'type'              => $request->type,
                'is_active'         => true,
                'status'            => UserStatus::ACTIVE,
                'organization_id'   => $platform_organization->id,
                'email_verified_at' => now(),
            ]);

            if ($request->filled('spatie_role_id')) {
                app(\Spatie\Permission\PermissionRegistrar::class)
                    ->setPermissionsTeamId($platform_organization->id);
                $staff->syncRoles([$request->spatie_role_id]);
            }

            Log::info('Staff created', ['staff_id' => $staff->id, 'by' => auth()->id()]);

            return response()->json([
                'status'  => 'success',
                'message' => 'تم إنشاء الموظف بنجاح',
                'data'    => $staff->load('roles:id,name,display_name')
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating staff', [
                'error' => $e->getMessage(),
                'data'  => $request->except(['password', 'password_confirmation']),
            ]);

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء إنشاء الموظف'
            ], 500);
        }
    }

    /**
     * Display the specified staff member.
     */
    public function show($id)
    {
        try {
            $staff = User::whereIn('type', self::STAFF_TYPES)
                ->with('roles:id,name,display_name')
                ->findOrFail($id);

            return response()->json([
                'status' => 'success',
                'data'   => $staff
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'لم يتم العثور على الموظف'
            ], 404);
        }
    }

    /**
     * Update the specified staff member.
     */
    public function update(Request $request, $id)
    {
        try {
            $staff = User::whereIn('type', self::STAFF_TYPES)->findOrFail($id);

            $validator = Validator::make($request->all(), [
                'first_name'     => 'sometimes|required|string|max:255',
                'last_name'      => 'sometimes|required|string|max:255',
                'email'          => 'sometimes|required|email|unique:users,email,' . $id,
                'phone'          => 'sometimes|required|string|max:15|unique:users,phone,' . $id,
                'password'       => 'sometimes|nullable|string|min:8|confirmed',
                'type'           => 'sometimes|required|in:admin,moderator',
                'spatie_role_id' => 'nullable|exists:roles,id',
            ], $this->validationMessages());

            if ($validator->fails()) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'بيانات غير صالحة',
                    'errors'  => $validator->errors()
                ], 422);
            }

            // ✅ Security: Check role assignment
            if ($request->has('spatie_role_id') && !$this->canAssignRole($request->spatie_role_id)) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'لا تملك صلاحية تعيين هذا الدور'
                ], 403);
            }

            // ✅ Security: Cannot demote yourself
            /** @var User $currentUser */
            $currentUser = Auth::user();
            if ($currentUser->id === $staff->id) {
                if ($request->has('type') && $request->type !== $staff->type->value) {
                    return response()->json([
                        'status'  => 'error',
                        'message' => 'لا يمكنك تغيير نوع حسابك الشخصي'
                    ], 403);
                }
            }

            $platform_organization = Organization::where('slug', 'dasm-e-platform')
                ->where('type', 'platform')
                ->first();

            // Update fields
            $staff->fill($request->only(['first_name', 'last_name', 'email', 'phone']));
            
            if ($request->has('type')) {
                $staff->type = $request->type;
            }

            if ($platform_organization) {
                $staff->organization_id = $platform_organization->id;
            }

            if ($request->filled('password')) {
                $staff->password_hash = Hash::make($request->password);
            }

            $staff->save();

            // Sync roles
            if ($request->has('spatie_role_id') && $platform_organization) {
                app(\Spatie\Permission\PermissionRegistrar::class)
                    ->setPermissionsTeamId($platform_organization->id);
                    
                if ($request->filled('spatie_role_id')) {
                    $staff->syncRoles([$request->spatie_role_id]);
                } else {
                    $staff->syncRoles([]);
                }
            }

            Log::info('Staff updated', ['staff_id' => $staff->id, 'by' => auth()->id()]);

            return response()->json([
                'status'  => 'success',
                'message' => 'تم تحديث بيانات الموظف بنجاح',
                'data'    => $staff->fresh('roles:id,name,display_name')
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating staff', [
                'staff_id' => $id,
                'error'    => $e->getMessage(),
            ]);

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء تحديث بيانات الموظف'
            ], 500);
        }
    }

    /**
     * Remove the specified staff member.
     */
    public function destroy($id)
    {
        try {
            $staff = User::whereIn('type', self::STAFF_TYPES)->findOrFail($id);

            // ✅ Security: Cannot delete yourself
            $currentUser = Auth::user();
            if ($currentUser && $currentUser->id === $staff->id) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'لا يمكنك حذف حسابك الشخصي'
                ], 403);
            }

            // ✅ Security: Cannot delete super admin
            if ($staff->type === UserRole::SUPER_ADMIN) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'لا يمكن حذف مدير النظام الرئيسي'
                ], 403);
            }

            $staff->delete();

            Log::info('Staff deleted', ['staff_id' => $id, 'by' => auth()->id()]);

            return response()->json([
                'status'  => 'success',
                'message' => 'تم حذف الموظف بنجاح'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting staff', [
                'staff_id' => $id,
                'error'    => $e->getMessage(),
            ]);

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء حذف الموظف'
            ], 500);
        }
    }

    /**
     * Update staff member status (active/inactive).
     */
    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'is_active' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'بيانات غير صالحة',
                'errors'  => $validator->errors()
            ], 422);
        }

        try {
            $staff = User::whereIn('type', self::STAFF_TYPES)->findOrFail($id);

            // ✅ Security: Cannot deactivate yourself
            $currentUser = Auth::user();
            if ($currentUser && $currentUser->id === $staff->id && !$request->is_active) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'لا يمكنك إلغاء تفعيل حسابك الشخصي'
                ], 403);
            }

            $staff->is_active = $request->is_active;
            $staff->status = $request->is_active ? UserStatus::ACTIVE : UserStatus::PENDING;
            $staff->save();

            $message = $request->is_active
                ? 'تم تفعيل الموظف بنجاح'
                : 'تم إلغاء تفعيل الموظف بنجاح';

            Log::info('Staff status updated', [
                'staff_id'  => $id,
                'is_active' => $request->is_active,
                'by'        => auth()->id()
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => $message,
                'data'    => $staff
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating staff status', [
                'staff_id' => $id,
                'error'    => $e->getMessage(),
            ]);

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء تحديث حالة الموظف'
            ], 500);
        }
    }

    /**
     * Get staff dashboard statistics.
     */
    public function dashboard()
    {
        try {
            $totalStaff      = User::whereIn('type', self::STAFF_TYPES)->count();
            $totalAdmins     = User::where('type', UserRole::ADMIN)->count();
            $totalModerators = User::where('type', UserRole::MODERATOR)->count();
            $activeStaff     = User::whereIn('type', self::STAFF_TYPES)->where('is_active', true)->count();
            $inactiveStaff   = $totalStaff - $activeStaff;

            $recentStaff = User::whereIn('type', self::STAFF_TYPES)
                ->with('roles:id,name,display_name')
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get(['id', 'first_name', 'last_name', 'email', 'type', 'is_active', 'created_at']);

            return response()->json([
                'status' => 'success',
                'data'   => [
                    'total_staff'      => $totalStaff,
                    'total_admins'     => $totalAdmins,
                    'total_moderators' => $totalModerators,
                    'active_staff'     => $activeStaff,
                    'inactive_staff'   => $inactiveStaff,
                    'recent_staff'     => $recentStaff
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching staff dashboard', ['error' => $e->getMessage()]);

            return response()->json([
                'status'  => 'error',
                'message' => 'حدث خطأ أثناء تحميل لوحة المعلومات'
            ], 500);
        }
    }

    /**
     * Check if current user can assign the given role
     */
    private function canAssignRole(?int $roleId): bool
    {
        if (empty($roleId)) {
            return true;
        }

        $role = Role::find($roleId);
        if (!$role) {
            return true;
        }

        // Super admin roles require super admin user
        if (in_array($role->name, self::PROTECTED_ROLES)) {
            /** @var User $currentUser */
            $currentUser = Auth::user();
            return $currentUser->type === UserRole::SUPER_ADMIN;
        }

        return true;
    }

    /**
     * Validation messages in Arabic
     */
    private function validationMessages(): array
    {
        return [
            'first_name.required'   => 'الاسم الأول مطلوب',
            'last_name.required'    => 'الاسم الأخير مطلوب',
            'email.required'        => 'البريد الإلكتروني مطلوب',
            'email.email'           => 'يرجى إدخال بريد إلكتروني صالح',
            'email.unique'          => 'هذا البريد الإلكتروني مستخدم بالفعل',
            'phone.required'        => 'رقم الهاتف مطلوب',
            'phone.unique'          => 'رقم الهاتف هذا مستخدم بالفعل',
            'password.required'     => 'كلمة المرور مطلوبة',
            'password.min'          => 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
            'password.confirmed'    => 'تأكيد كلمة المرور غير متطابق',
            'type.required'         => 'نوع المستخدم مطلوب',
            'type.in'               => 'نوع المستخدم يجب أن يكون مدير أو مشرف',
            'spatie_role_id.exists' => 'الدور الوظيفي المختار غير صالح',
        ];
    }
}

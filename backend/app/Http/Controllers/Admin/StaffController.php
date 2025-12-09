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

class StaffController extends Controller
{
    /**
     * Display a listing of staff (admins and moderators).
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $query = User::whereIn('type', [UserRole::ADMIN, UserRole::MODERATOR]);

            // Search functionality
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            }

            // Status filter
            if ($request->has('status') && !empty($request->status)) {
                if ($request->status === 'active') {
                    $query->where('is_active', true);
                } elseif ($request->status === 'inactive') {
                    $query->where('is_active', false);
                }
            }

            $moderators = $query->orderBy('created_at', 'desc')->paginate(15);

            return response()->json([
                'status' => 'success',
                'data' => $moderators
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching staff', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'فشل في تحميل بيانات الموظفين'
            ], 500);
        }
    }

    /**
     * Store a newly created staff member (admin or moderator).
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|max:15|unique:users,phone',
            'password' => 'required|string|min:8|confirmed',
            'type' => 'required|in:admin,moderator',
            'spatie_role_id' => 'nullable|exists:roles,id',
        ], [
            'first_name.required' => 'الاسم الأول مطلوب',
            'first_name.string' => 'الاسم الأول يجب أن يكون نصًا',
            'first_name.max' => 'الاسم الأول يجب ألا يتجاوز 255 حرفًا',
            'last_name.required' => 'الاسم الأخير مطلوب',
            'last_name.string' => 'الاسم الأخير يجب أن يكون نصًا',
            'last_name.max' => 'الاسم الأخير يجب ألا يتجاوز 255 حرفًا',
            'email.required' => 'البريد الإلكتروني مطلوب',
            'email.email' => 'يرجى إدخال بريد إلكتروني صالح',
            'email.unique' => 'هذا البريد الإلكتروني مستخدم بالفعل',
            'phone.required' => 'رقم الهاتف مطلوب',
            'phone.string' => 'رقم الهاتف يجب أن يكون نصًا',
            'phone.max' => 'رقم الهاتف يجب ألا يتجاوز 15 رقمًا',
            'phone.unique' => 'رقم الهاتف هذا مستخدم بالفعل',
            'password.required' => 'كلمة المرور مطلوبة',
            'password.string' => 'كلمة المرور يجب أن تكون نصًا',
            'password.min' => 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
            'password.confirmed' => 'تأكيد كلمة المرور غير متطابق',
            'role.required' => 'نوع المستخدم مطلوب',
            'role.in' => 'نوع المستخدم يجب أن يكون مدير أو مشرف',
            'spatie_role_id.exists' => 'الدور الوظيفي المختار غير صالح',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'بيانات غير صالحة',
                'errors' => $validator->errors()
            ], 422);
        }

        // Security Check: Prevent assigning super_admin role if not super_admin
        if ($request->has('spatie_role_id') && !empty($request->spatie_role_id)) {
            $spatieRole = \Spatie\Permission\Models\Role::find($request->spatie_role_id);
            if ($spatieRole && $spatieRole->name === 'super_admin') {
                /** @var \App\Models\User $currentUser */
                $currentUser = Auth::user();
                if (!$currentUser->hasRole('super_admin')) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'لا تملك صلاحية تعيين دور مدير النظام الرئيسي'
                    ], 403);
                }
            }
        }

        try {
            $platform_organization = Organization::where('slug', 'dasm-e-platform')
                ->where('type', 'platform')
                ->first();

            $staff = User::create([
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password_hash' => Hash::make($request->password),
                'type' => $request->type,
                'is_active' => true,
                'status' => UserStatus::ACTIVE,
                'organization_id' => $platform_organization->id,
                'email_verified_at' => now(), // Auto-verify admin-created staff
            ]);

            if ($request->has('spatie_role_id') && !empty($request->spatie_role_id)) {
                app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($platform_organization->id);
                $staff->syncRoles([$request->spatie_role_id]);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'تم إنشاء الموظف بنجاح',
                'data' => $staff
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating staff member', [
                'error' => $e->getMessage(),
                'data' => $request->except(['password', 'password_confirmation']),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ أثناء إنشاء الموظف'
            ], 500);
        }
    }

    /**
     * Display the specified staff member.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $staff = User::whereIn('type', [UserRole::ADMIN, UserRole::MODERATOR])->with('roles')->findOrFail($id);

            return response()->json([
                'status' => 'success',
                'data' => $staff
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching staff details', [
                'staff_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'لم يتم العثور على الموظف'
            ], 404);
        }
    }

    /**
     * Update the specified staff member.
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            $staff = User::whereIn('type', [UserRole::ADMIN, UserRole::MODERATOR])->findOrFail($id);

            $validator = Validator::make($request->all(), [
                'first_name' => 'sometimes|required|string|max:255',
                'last_name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|email|unique:users,email,' . $id,
                'phone' => 'sometimes|required|string|max:15|unique:users,phone,' . $id,
                'password' => 'sometimes|nullable|string|min:8|confirmed',
                'type' => 'sometimes|required|in:admin,moderator',
                'spatie_role_id' => 'nullable|exists:roles,id',
            ], [
                'first_name.required' => 'الاسم الأول مطلوب',
                'first_name.string' => 'الاسم الأول يجب أن يكون نصًا',
                'first_name.max' => 'الاسم الأول يجب ألا يتجاوز 255 حرفًا',
                'last_name.required' => 'الاسم الأخير مطلوب',
                'last_name.string' => 'الاسم الأخير يجب أن يكون نصًا',
                'last_name.max' => 'الاسم الأخير يجب ألا يتجاوز 255 حرفًا',
                'email.required' => 'البريد الإلكتروني مطلوب',
                'email.email' => 'يرجى إدخال بريد إلكتروني صالح',
                'email.unique' => 'هذا البريد الإلكتروني مستخدم بالفعل',
                'phone.required' => 'رقم الهاتف مطلوب',
                'phone.string' => 'رقم الهاتف يجب أن يكون نصًا',
                'phone.max' => 'رقم الهاتف يجب ألا يتجاوز 15 رقمًا',
                'phone.unique' => 'رقم الهاتف هذا مستخدم بالفعل',
                'password.string' => 'كلمة المرور يجب أن تكون نصًا',
                'password.min' => 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
                'password.confirmed' => 'تأكيد كلمة المرور غير متطابق',
                'role.required' => 'نوع المستخدم مطلوب',
                'role.in' => 'نوع المستخدم يجب أن يكون مدير أو مشرف',
                'spatie_role_id.exists' => 'الدور المختار غير صالح',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'بيانات غير صالحة',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Security Check: Prevent assigning super_admin role if not super_admin
            if ($request->has('spatie_role_id') && !empty($request->spatie_role_id)) {
                $spatieRole = \Spatie\Permission\Models\Role::find($request->spatie_role_id);
                if ($spatieRole && $spatieRole->name === 'super_admin') {
                    /** @var \App\Models\User $currentUser */
                    $currentUser = Auth::user();
                    if (!$currentUser->hasRole('super_admin')) {
                        return response()->json([
                            'status' => 'error',
                            'message' => 'لا تملك صلاحية تعيين دور مدير النظام الرئيسي'
                        ], 403);
                    }
                }
            }

            $platform_organization = Organization::where('slug', 'dasm-e-platform')
                ->where('type', 'platform')
                ->first();

            // Update basic information
            if ($request->has('first_name')) {
                $staff->first_name = $request->first_name;
            }
            if ($request->has('last_name')) {
                $staff->last_name = $request->last_name;
            }
            if ($request->has('email')) {
                $staff->email = $request->email;
            }
            if ($request->has('phone')) {
                $staff->phone = $request->phone;
            }
            if ($request->has('role')) {
                $staff->type = $request->type;
            }

            $staff->organization_id = $platform_organization->id;

            // Update password only if provided
            if ($request->has('password') && !empty($request->password)) {
                $staff->password_hash = Hash::make($request->password);
            }

            if ($request->has('spatie_role_id')) {
                if (!empty($request->spatie_role_id)) {
                    app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($platform_organization->id);
                    $staff->syncRoles([$request->spatie_role_id]);
                } else {
                    $staff->syncRoles([]);
                }
            }

            $staff->save();

            return response()->json([
                'status' => 'success',
                'message' => 'تم تحديث بيانات الموظف بنجاح',
                'data' => $staff
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating staff member', [
                'staff_id' => $id,
                'error' => $e->getMessage(),
                'data' => $request->except(['password', 'password_confirmation']),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ أثناء تحديث بيانات الموظف'
            ], 500);
        }
    }

    /**
     * Remove the specified staff member.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $staff = User::whereIn('type', [UserRole::ADMIN, UserRole::MODERATOR])->findOrFail($id);

            // Prevent deletion of currently authenticated admin if they're deleting themselves
            $currentUser = Auth::user();
            if ($currentUser && $currentUser->id === $staff->id) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'لا يمكنك حذف حسابك الشخصي'
                ], 403);
            }

            $staff->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'تم حذف الموظف بنجاح'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting staff member', [
                'staff_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ أثناء حذف الموظف'
            ], 500);
        }
    }

    /**
     * Update staff member status (active/inactive).
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'is_active' => 'required|boolean',
        ], [
            'is_active.required' => 'حالة النشاط مطلوبة',
            'is_active.boolean' => 'حالة النشاط يجب أن تكون صحيحة أو خاطئة',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'بيانات غير صالحة',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $staff = User::whereIn('type', [UserRole::ADMIN, UserRole::MODERATOR])->findOrFail($id);

            // Prevent deactivation of currently authenticated admin if they're deactivating themselves
            $currentUser = Auth::user();
            if ($currentUser && $currentUser->id === $staff->id && !$request->is_active) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'لا يمكنك إلغاء تفعيل حسابك الشخصي'
                ], 403);
            }

            $staff->is_active = $request->is_active;
            $staff->status = $request->is_active ? UserStatus::ACTIVE : UserStatus::PENDING;
            $staff->save();

            $message = $request->is_active
                ? 'تم تفعيل الموظف بنجاح'
                : 'تم إلغاء تفعيل الموظف بنجاح';

            return response()->json([
                'status' => 'success',
                'message' => $message,
                'data' => $staff
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating staff status', [
                'staff_id' => $id,
                'is_active' => $request->is_active,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ أثناء تحديث حالة الموظف'
            ], 500);
        }
    }

    /**
     * Get staff dashboard statistics.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function dashboard()
    {
        try {
            // Get basic statistics for staff dashboard
            $totalStaff = User::whereIn('type', [UserRole::ADMIN, UserRole::MODERATOR])->count();
            $totalAdmins = User::where('type', UserRole::ADMIN)->count();
            $totalModerators = User::where('type', UserRole::MODERATOR)->count();
            $activeStaff = User::whereIn('type', [UserRole::ADMIN, UserRole::MODERATOR])
                ->where('is_active', true)->count();
            $inactiveStaff = $totalStaff - $activeStaff;

            // Recent staff
            $recentStaff = User::whereIn('type', [UserRole::ADMIN, UserRole::MODERATOR])
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get(['id', 'first_name', 'last_name', 'email', 'type', 'is_active', 'created_at']);

            return response()->json([
                'status' => 'success',
                'data' => [
                    'total_staff' => $totalStaff,
                    'total_admins' => $totalAdmins,
                    'total_moderators' => $totalModerators,
                    'active_staff' => $activeStaff,
                    'inactive_staff' => $inactiveStaff,
                    'recent_staff' => $recentStaff
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching staff dashboard', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ أثناء تحميل لوحة المعلومات'
            ], 500);
        }
    }
}

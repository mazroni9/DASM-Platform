<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class ModeratorController extends Controller
{
    /**
     * Display a listing of moderators.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $query = User::where('role', UserRole::MODERATOR);

            // Search functionality
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
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
            Log::error('Error fetching moderators', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'فشل في تحميل بيانات المشرفين'
            ], 500);
        }
    }

    /**
     * Store a newly created moderator.
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
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'بيانات غير صالحة',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $moderator = User::create([
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password_hash' => Hash::make($request->password),
                'role' => UserRole::MODERATOR,
                'is_active' => true,
                'status' => UserStatus::ACTIVE,
                'email_verified_at' => now(), // Auto-verify admin-created moderators
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'تم إنشاء المشرف بنجاح',
                'data' => $moderator
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating moderator', [
                'error' => $e->getMessage(),
                'data' => $request->except(['password', 'password_confirmation']),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ أثناء إنشاء المشرف'
            ], 500);
        }
    }

    /**
     * Display the specified moderator.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $moderator = User::where('role', UserRole::MODERATOR)->findOrFail($id);

            return response()->json([
                'status' => 'success',
                'data' => $moderator
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching moderator details', [
                'moderator_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'لم يتم العثور على المشرف'
            ], 404);
        }
    }

    /**
     * Update the specified moderator.
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            $moderator = User::where('role', UserRole::MODERATOR)->findOrFail($id);

            $validator = Validator::make($request->all(), [
                'first_name' => 'sometimes|required|string|max:255',
                'last_name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|email|unique:users,email,' . $id,
                'phone' => 'sometimes|required|string|max:15|unique:users,phone,' . $id,
                'password' => 'sometimes|nullable|string|min:8|confirmed',
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
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'بيانات غير صالحة',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update basic information
            if ($request->has('first_name')) {
                $moderator->first_name = $request->first_name;
            }
            if ($request->has('last_name')) {
                $moderator->last_name = $request->last_name;
            }
            if ($request->has('email')) {
                $moderator->email = $request->email;
            }
            if ($request->has('phone')) {
                $moderator->phone = $request->phone;
            }

            // Update password only if provided
            if ($request->has('password') && !empty($request->password)) {
                $moderator->password_hash = Hash::make($request->password);
            }

            $moderator->save();

            return response()->json([
                'status' => 'success',
                'message' => 'تم تحديث بيانات المشرف بنجاح',
                'data' => $moderator
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating moderator', [
                'moderator_id' => $id,
                'error' => $e->getMessage(),
                'data' => $request->except(['password', 'password_confirmation']),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ أثناء تحديث بيانات المشرف'
            ], 500);
        }
    }

    /**
     * Remove the specified moderator.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $moderator = User::where('role', UserRole::MODERATOR)->findOrFail($id);

            // Prevent deletion of currently authenticated admin if they're deleting themselves
            $currentUser = Auth::user();
            if ($currentUser && $currentUser->id === $moderator->id) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'لا يمكنك حذف حسابك الشخصي'
                ], 403);
            }

            $moderator->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'تم حذف المشرف بنجاح'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting moderator', [
                'moderator_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ أثناء حذف المشرف'
            ], 500);
        }
    }

    /**
     * Update moderator status (active/inactive).
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
            $moderator = User::where('role', UserRole::MODERATOR)->findOrFail($id);

            // Prevent deactivation of currently authenticated admin if they're deactivating themselves
            $currentUser = Auth::user();
            if ($currentUser && $currentUser->id === $moderator->id && !$request->is_active) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'لا يمكنك إلغاء تفعيل حسابك الشخصي'
                ], 403);
            }

            $moderator->is_active = $request->is_active;
            $moderator->status = $request->is_active ? UserStatus::ACTIVE : UserStatus::PENDING;
            $moderator->save();

            $message = $request->is_active
                ? 'تم تفعيل المشرف بنجاح'
                : 'تم إلغاء تفعيل المشرف بنجاح';

            return response()->json([
                'status' => 'success',
                'message' => $message,
                'data' => $moderator
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating moderator status', [
                'moderator_id' => $id,
                'is_active' => $request->is_active,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ أثناء تحديث حالة المشرف'
            ], 500);
        }
    }

    /**
     * Get moderator dashboard statistics.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function dashboard()
    {
        try {
            // Get basic statistics for moderator dashboard
            $totalModerators = User::where('role', UserRole::MODERATOR)->count();
            $activeModerators = User::where('role', UserRole::MODERATOR)
                ->where('is_active', true)->count();
            $inactiveModerators = $totalModerators - $activeModerators;

            // Recent moderators
            $recentModerators = User::where('role', UserRole::MODERATOR)
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get(['id', 'first_name', 'last_name', 'email', 'is_active', 'created_at']);

            return response()->json([
                'status' => 'success',
                'data' => [
                    'total_moderators' => $totalModerators,
                    'active_moderators' => $activeModerators,
                    'inactive_moderators' => $inactiveModerators,
                    'recent_moderators' => $recentModerators
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching moderator dashboard', [
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

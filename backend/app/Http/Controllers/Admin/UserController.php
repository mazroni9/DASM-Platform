<?php

namespace App\Http\Controllers\Admin;

use App\Models\User;
use App\Models\Dealer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
     /**
     * List all users
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $query = User::query();

        // Filter by role
        if ($request->has('role')) {
            if ($request->role === 'dealer') {
                $query->whereHas('dealer');
            } else if ($request->role === 'user') {
                $query->whereDoesntHave('dealer');
            }
        }

        // Search by name or email
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->with('dealer')->paginate(15);

        return response()->json([
            'status' => 'success',
            'data' => $users
        ]);
    }

       /**
     * Find User details a dealer verification request
     *
     * @param int $userId
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($userId)
    {
        $user = User::findOrFail($userId);
        $dealer = $user->dealer;
        return response()->json([
            'status' => 'success',
            'message' => 'User Details retrieved successfully',
            'data' => [
                'user' => $user,
                'dealer' => $dealer
            ]
        ]);
    }

      /**
     * Update user information (admin only)
     *
     * @param int $userId
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function update($userId, Request $request)
    {
        $currentUser = Auth::user();
        $userToUpdate = User::with('dealer')->findOrFail($userId);

        // Prevent admin from editing other admin accounts
        if ($userToUpdate->role === 'admin' && $currentUser->id !== $userToUpdate->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'لا يمكن تعديل بيانات مدير آخر'
            ], 403);
        }

        // Prevent admin from changing their own role
        if ($currentUser->id === $userToUpdate->id && $request->has('role') && $request->role !== 'admin') {
            return response()->json([
                'status' => 'error',
                'message' => 'لا يمكن تغيير دورك كمدير'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $userId,
            'phone' => 'sometimes|string|max:15|unique:users,phone,' . $userId,
            'role' => 'sometimes|in:user,dealer,moderator,admin',
            'status' => 'sometimes|in:pending,active,rejected',
            'is_active' => 'sometimes|boolean',
            // Dealer specific fields
            'company_name' => 'sometimes|string|max:255',
            'commercial_registry' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
            'dealer_status' => 'sometimes|in:pending,active,rejected',
        ], [
            'first_name.string' => 'الاسم الأول يجب أن يكون نصًا',
            'first_name.max' => 'الاسم الأول يجب ألا يتجاوز 255 حرفًا',
            'last_name.string' => 'الاسم الأخير يجب أن يكون نصًا',
            'last_name.max' => 'الاسم الأخير يجب ألا يتجاوز 255 حرفًا',
            'email.email' => 'يرجى إدخال بريد إلكتروني صالح',
            'email.unique' => 'هذا البريد الإلكتروني مستخدم بالفعل',
            'phone.string' => 'رقم الهاتف يجب أن يكون نصًا',
            'phone.max' => 'رقم الهاتف يجب ألا يتجاوز 15 رقمًا',
            'phone.unique' => 'رقم الهاتف هذا مستخدم بالفعل',
            'role.in' => 'الدور المحدد غير صالح',
            'status.in' => 'الحالة المحددة غير صالحة',
            'company_name.string' => 'اسم الشركة يجب أن يكون نصًا',
            'commercial_registry.string' => 'رقم السجل التجاري يجب أن يكون نصًا',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'بيانات غير صالحة',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Update basic user information
            if ($request->has('first_name')) {
                $userToUpdate->first_name = $request->first_name;
            }
            if ($request->has('last_name')) {
                $userToUpdate->last_name = $request->last_name;
            }
            if ($request->has('email')) {
                $userToUpdate->email = $request->email;
            }
            if ($request->has('phone')) {
                $userToUpdate->phone = $request->phone;
            }
            if ($request->has('status')) {
                $userToUpdate->status = $request->status;
            }
            if ($request->has('is_active')) {
                $userToUpdate->is_active = $request->is_active;
            }

            // Handle role changes
            $oldRole = $userToUpdate->role;
            if ($request->has('role') && $request->role !== $oldRole) {
                $newRole = $request->role;

                // If changing to dealer, create dealer record if it doesn't exist
                if ($newRole === 'dealer' && !$userToUpdate->dealer) {
                    Dealer::create([
                        'user_id' => $userToUpdate->id,
                        'company_name' => $request->company_name ?? 'شركة غير محددة',
                        'commercial_registry' => $request->commercial_registry ?? 'غير محدد',
                        'description' => $request->description,
                        'is_active' => $request->dealer_status === 'active',
                        'status' => $request->dealer_status ?? 'pending',
                        'rating' => 0,
                    ]);
                }

                // If changing from dealer to another role, deactivate dealer record
                if ($oldRole === 'dealer' && $newRole !== 'dealer' && $userToUpdate->dealer) {
                    $userToUpdate->dealer->update([
                        'is_active' => false,
                        'status' => 'inactive'
                    ]);
                }

                $userToUpdate->role = $newRole;
            }

            // Update dealer information if user is/becoming a dealer
            if (($userToUpdate->role === 'dealer' || $request->role === 'dealer') && $userToUpdate->dealer) {
                $dealer = $userToUpdate->dealer;

                if ($request->has('company_name')) {
                    $dealer->company_name = $request->company_name;
                }
                if ($request->has('commercial_registry')) {
                    $dealer->commercial_registry = $request->commercial_registry;
                }
                if ($request->has('description')) {
                    $dealer->description = $request->description;
                }
                if ($request->has('dealer_status')) {
                    $dealer->status = $request->dealer_status;
                    $dealer->is_active = $request->dealer_status === 'active';
                }

                $dealer->save();
            }

            $userToUpdate->save();

            // Return updated user with dealer information
            $userToUpdate->load('dealer');

            return response()->json([
                'status' => 'success',
                'message' => 'تم تحديث بيانات المستخدم بنجاح',
                'data' => [
                    'user' => $userToUpdate,
                    'dealer' => $userToUpdate->dealer
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating user', [
                'user_id' => $userId,
                'admin_id' => $currentUser->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ أثناء تحديث بيانات المستخدم'
            ], 500);
        }
    }


       /**
     * Approve a user account
     *
     * @param int $userId
     * @return \Illuminate\Http\JsonResponse
     */
    public function approveUser($userId)
    {
        $user = User::findOrFail($userId);

        // Update user status to active
        $user->status = 'active';
        $user->is_active = true; // Keep is_active for backward compatibility
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'User approved successfully',
            'data' => $user
        ]);
    }


    /**
     * Reject a user account
     *
     * @param int $userId
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function rejectUser($userId, Request $request)
    {
        $user = User::findOrFail($userId);

        // Optionally, you could add a reason for rejection
        // if ($request->has('reason')) {
        //     $user->rejection_reason = $request->reason;
        // }

        // Update user status to rejected
        $user->status = 'rejected';
        $user->is_active = false; // Keep is_active for backward compatibility
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'User rejection processed successfully',
            'data' => $user
        ]);
    }


    /**
     * Toggle user status
     *
     * @param int $userId
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */

    public function toggleUserStatus($userId, Request $request)
    {
        $user = User::findOrFail($userId);
        $status = $request->is_active ? "active" : "rejected";
        $user->status = $status;
        $user->is_active = $request->is_active;
        $user->save();
        return response()->json([
            'status' => 'success',
            'message' => 'تم تغيير حالة المستخدم بنجاح',
            'data' => $user
        ]);
    }

      /**
     * Get pending verifications
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPendingVerifications()
    {
        $pendingDealers = Dealer::where('status', 'pending')
            ->with('user')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $pendingDealers
        ]);
    }

     /**
     * Approve a dealer verification request
     *
     * @param int $userId
     * @return \Illuminate\Http\JsonResponse
     */
    public function approveVerification($userId)
    {
        $user = User::findOrFail($userId);
        $dealer = $user->dealer;

        if (!$dealer) {
            return response()->json([
                'status' => 'error',
                'message' => 'User is not a dealer'
            ], 400);
        }

        // Update dealer status
        $dealer->is_active = true;
        $dealer->status = 'active';
        $dealer->save();

        // Update user role if needed
        if ($user->role !== 'dealer') {
            $user->role = 'dealer';
            $user->save();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Dealer verification approved successfully',
            'data' => [
                'user' => $user,
                'dealer' => $dealer
            ]
        ]);
    }


    /**
     * Reject a dealer verification request
     *
     * @param int $userId
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function rejectVerification($userId, Request $request)
    {
        $user = User::findOrFail($userId);
        $dealer = $user->dealer;

        if (!$dealer) {
            return response()->json([
                'status' => 'error',
                'message' => 'User is not a dealer'
            ], 400);
        }

        // Set rejection reason if provided
        if ($request->has('reason')) {
            $dealer->rejection_reason = $request->reason;
        }

        // Update dealer status
        $dealer->is_active = false;
        $dealer->status = 'rejected';
        $dealer->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Dealer verification rejected successfully',
            'data' => [
                'user' => $user,
                'dealer' => $dealer
            ]
        ]);
    }



}

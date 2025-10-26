<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log; // Import the Log facade

class UserController extends Controller
{
    /**
     * Register a new user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        try {
            // Validate incoming request
            $data = $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name'  => 'required|string|max:255',
                'email'      => 'required|email|unique:users',
                'phone'      => 'required|string|max:20|unique:users',
                'password'   => 'required|string|min:6'
            ]);

            // Create the user, storing a hashed version of the password
            $user = User::create([
                'first_name'    => $data['first_name'],
                'last_name'     => $data['last_name'],
                'email'         => $data['email'],
                'phone'         => $data['phone'],
                'password_hash' => Hash::make($data['password']),
                // Defaults for role and kyc_status will be set by the model/migration
            ]);

            return response()->json(['user' => $user], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Handle validation errors specifically
            $errors = $e->validator->errors()->getMessages();

            // Create user-friendly messages for common errors
            $userFriendlyMessages = [];
            foreach ($errors as $field => $messages) {
                if ($field === 'email' && strpos(implode(' ', $messages), 'unique') !== false) {
                    $userFriendlyMessages[] = 'البريد الإلكتروني مستخدم بالفعل';
                } else if ($field === 'phone' && strpos(implode(' ', $messages), 'unique') !== false) {
                    $userFriendlyMessages[] = 'رقم الهاتف مستخدم بالفعل';
                } else {
                    $userFriendlyMessages[] = $messages[0]; // Add the first error message
                }
            }

            // Return the user-friendly error message
            return response()->json([
                'message' => count($userFriendlyMessages) > 0 ? implode(', ', $userFriendlyMessages) : 'بيانات التسجيل غير صالحة'
            ], 422);

        } catch (\Exception $e) {
            // Log the detailed error for debugging
            Log::error('Error during user registration: ' . $e->getMessage(), [
                'exception' => $e,
                'request_data' => $request->except(['password', 'password_confirmation']),
            ]);

            // Return a generic message without exposing internal details
            return response()->json([
                'message' => 'فشل التسجيل. يرجى المحاولة مرة أخرى لاحقاً.'
            ], 500);
        }
    }

    /**
     * Login an existing user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        try {
            // Validate incoming request
            $data = $request->validate([
                'email'    => 'required|email',
                'password' => 'required|string'
            ]);

            // Find user by email
            $user = User::where('email', $data['email'])->first();

            // Check if user exists and password is valid
            if (!$user || !Hash::check($data['password'], $user->password_hash)) {
                return response()->json(['message' => 'Invalid credentials'], 401);
            }

            // Using Sanctum, generate an API token:
            $token = $user->createToken('api-token')->plainTextToken;

            return response()->json(['user' => $user, 'token' => $token], 200);
        } catch (\Exception $e) {
            // Log the detailed error for debugging purposes, but don't expose it to users
            Log::error('Error during user login: ' . $e->getMessage(), [
                'exception' => $e,
                'request_data' => ['email' => $request->email], // Only include email for security
            ]);

            // Return a generic error message to the user
            return response()->json([
                'message' => 'Login failed. Please try again later.',
            ], 500);
        }
    }
    /**
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        try {
            // Revoke all tokens...
            $request->user()->tokens()->delete();

            return response()->json([
                'message' => 'Successfully logged out'
            ]);
        } catch (\Exception $e) {
            Log::error('Error during user logout: ' . $e->getMessage(), [
                'exception' => $e,
            ]);

            return response()->json([
                'message' => 'Logout failed. Please try again later.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get the authenticated user's profile.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
public function profile(Request $request)
{
    try {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'message' => 'User not found'
            ], 404);
        }

        // Load relations (dealer + venue_owner)
        $user->load(['dealer', 'venueOwner']);

        // Format the response data
        $responseData = [
            'id'          => $user->id,
            'first_name'  => $user->first_name,
            'last_name'   => $user->last_name,
            'name'        => $user->first_name . ' ' . $user->last_name,
            'email'       => $user->email,
            'phone'       => $user->phone,
            'role'        => $user->role,
            'kyc_status'  => $user->kyc_status,
            'created_at'  => $user->created_at,
            'updated_at'  => $user->updated_at,
            'is_active'   => $user->is_active,
            'status'      => $user->status,
        ];

        // 👉 Add dealer fields if user is a dealer
        if ($user->dealer) {
            $responseData['address']        = $user->dealer->address ?? null;
            $responseData['company_name']   = $user->dealer->company_name ?? null;
            $responseData['trade_license']  = $user->dealer->trade_license ?? null;
        }

        // 👉 Add venue_owner fields if user is a venue_owner
        if ($user->venueOwner) {
            $responseData['venue_name']    = $user->venueOwner->venue_name ?? null;
            $responseData['venue_address'] = $user->venueOwner->address ?? null;
            $responseData['description']   = $user->venueOwner->description ?? null;
            $responseData['rating']        = $user->venueOwner->rating ?? null;
        }

        return response()->json([
            'success' => true,
            'data'    => $responseData
        ]);

    } catch (\Exception $e) {
        Log::error('Error fetching user profile: ' . $e->getMessage(), [
            'exception' => $e,
        ]);

        return response()->json([
            'message' => 'Failed to fetch profile. Please try again later.',
            'error'   => $e->getMessage()
        ], 500);
    }
}


    /**
     * Update the authenticated user's profile.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
 public function updateProfile(Request $request)
{
    try {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'User not found'
            ], 404);
        }

        // Validation rules (مشتركة + حسب الدور)
        $rules = [
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'phone' => 'sometimes|string|max:20|unique:users,phone,' . $user->id,
            'area_id' => 'sometimes|exists:areas,id'
        ];

        if ($user->isDealer()) {
            $rules = array_merge($rules, [
                'address' => 'sometimes|string|nullable',
                'company_name' => 'sometimes|string|nullable',
                'trade_license' => 'sometimes|string|nullable',
            ]);
        }

        if ($user->isVenueOwner()) {
            $rules = array_merge($rules, [
                'venue_name' => 'sometimes|string|nullable',
                'venue_address' => 'sometimes|string|nullable',
                'description' => 'sometimes|string|nullable',
            ]);
        }

        $data = $request->validate($rules);

        // تحديث بيانات المستخدم الأساسية
        $userFields = array_intersect_key($data, array_flip([
            'first_name', 'last_name', 'email', 'phone','area_id'
        ]));

        if (!empty($userFields)) {
            $user->update($userFields);
        }

        // تحديث بيانات التاجر إذا كان تاجر
        if ($user->isDealer()) {
            $dealerData = array_intersect_key($data, array_flip([
                'address', 'company_name', 'trade_license'
            ]));

            if (!empty($dealerData)) {
                $user->dealer()
                    ? $user->dealer->update($dealerData)
                    : $user->dealer()->create($dealerData);
            }
        }

        // تحديث بيانات صاحب المعرض إذا كان صاحب معرض
        if ($user->isVenueOwner()) {
            $venueData = array_intersect_key($data, array_flip([
                'venue_name', 'venue_address', 'description'
            ]));

            if (!empty($venueData)) {
                $user->venueOwner()
                    ? $user->venueOwner->update($venueData)
                    : $user->venueOwner()->create($venueData);
            }
        }

        // إعادة تحميل العلاقات
        $user->refresh()->load(['dealer', 'venueOwner']);

        // بناء الاستجابة
        $responseData = [
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'kyc_status' => $user->kyc_status,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];

        if ($user->dealer) {
            $responseData['address'] = $user->dealer->address ?? null;
            $responseData['company_name'] = $user->dealer->company_name ?? null;
            $responseData['trade_license'] = $user->dealer->trade_license ?? null;
        }

        if ($user->venueOwner) {
            $responseData['venue_name'] = $user->venueOwner->venue_name ?? null;
            $responseData['venue_address'] = $user->venueOwner->address ?? null;
            $responseData['description'] = $user->venueOwner->description ?? null;
            $responseData['rating'] = $user->venueOwner->rating ?? null;
        }

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث الملف الشخصي بنجاح',
            'data' => $responseData
        ]);
    } catch (\Exception $e) {
        \Log::error('Error updating user profile: ' . $e->getMessage(), [
            'exception' => $e,
            'user_id' => $request->user()?->id,
            'request_data' => $request->all(),
        ]);

        return response()->json([
            'message' => 'فشل تحديث الملف الشخصي، حاول مرة أخرى لاحقاً.',
            'error' => $e->getMessage()
        ], 500);
    }
}


    /**
     * Get the current user's permissions
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPermissions()
    {
        $user = auth()->user();
        $permissions = [];

        // Add default permissions for all users
        $permissions[] = 'view_auctions';
        $permissions[] = 'place_bids';

        // Add role-specific permissions
        if ($user->role === 'admin') {
            $permissions = array_merge($permissions, [
                'manage_users',
                'manage_auctions',
                'manage_cars',
                'manage_blog',
                'broadcast',
                'manage_venues',
                'view_analytics',
                'approve_auctions',
                'manage_settings'
            ]);
        } elseif ($user->role === 'dealer') {
            $permissions = array_merge($permissions, [
                'create_auctions',
                'manage_own_auctions',
                'manage_own_cars',
                'broadcast',
                'view_own_analytics'
            ]);
        }

        return response()->json([
            'status' => 'success',
            'permissions' => $permissions
        ]);
    }
}

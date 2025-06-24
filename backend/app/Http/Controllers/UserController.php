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
            
            // Load dealer relation if it exists
            $user->load('dealer');
            
            // Format the response data
            $responseData = [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'name' => $user->first_name . ' ' . $user->last_name, // Add combined name for frontend
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'kyc_status' => $user->kyc_status,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
                'is_active' =>$user->is_active,
                'status' => $user->status
            ];
            
            // Add dealer fields if user is a dealer
            if ($user->dealer) {
                $responseData['address'] = $user->dealer->address ?? null;
                $responseData['company_name'] = $user->dealer->company_name ?? null;
                $responseData['trade_license'] = $user->dealer->trade_license ?? null;
            }
            
            return response()->json([
                'success' => true,
                'data' => $responseData
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching user profile: ' . $e->getMessage(), [
                'exception' => $e,
            ]);

            return response()->json([
                'message' => 'Failed to fetch profile. Please try again later.',
                'error' => $e->getMessage()
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
            
            // Validate incoming request with first_name and last_name instead of name
            $data = $request->validate([
                'first_name' => 'sometimes|string|max:255',
                'last_name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:users,email,'.$user->id,
                'phone' => 'sometimes|string|max:20|unique:users,phone,'.$user->id,
                'address' => 'sometimes|string|nullable',
                'company_name' => 'sometimes|string|nullable',
                'trade_license' => 'sometimes|string|nullable',
            ]);
            
            // Extract user data and dealer data
            $userData = [];
            $dealerData = [];
            
            // Handle first_name and last_name fields directly
            if (isset($data['first_name'])) {
                $userData['first_name'] = $data['first_name'];
            }
            
            if (isset($data['last_name'])) {
                $userData['last_name'] = $data['last_name'];
            }
            
            // Handle standard user fields
            if (isset($data['email'])) {
                $userData['email'] = $data['email'];
            }
            
            if (isset($data['phone'])) {
                $userData['phone'] = $data['phone'];
            }
            
            // Handle dealer-specific fields
            if (isset($data['address'])) {
                $dealerData['address'] = $data['address'];
            }
            
            if (isset($data['company_name'])) {
                $dealerData['company_name'] = $data['company_name'];
            }
            
            if (isset($data['trade_license'])) {
                $dealerData['trade_license'] = $data['trade_license'];
            }
            
            // Update user data if there are changes
            if (!empty($userData)) {
                $user->update($userData);
            }
            
            // Update or create dealer data if there are dealer fields
            if (!empty($dealerData)) {
                // If user has dealer relation, update it; otherwise create it
                if ($user->dealer) {
                    $user->dealer->update($dealerData);
                } else if ($user->role === 'dealer') {
                    // Only create dealer record if user is a dealer
                    $dealerData['user_id'] = $user->id;
                    \App\Models\Dealer::create($dealerData);
                }
            }
            
            // Reload user with dealer relation for response
            $user->refresh();
            $user->load('dealer');
            
            // Format the response with separate first_name and last_name fields
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
            
            // Add dealer fields if user is a dealer
            if ($user->dealer) {
                $responseData['address'] = $user->dealer->address ?? null;
                $responseData['company_name'] = $user->dealer->company_name ?? null;
                $responseData['trade_license'] = $user->dealer->trade_license ?? null;
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => $responseData
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating user profile: ' . $e->getMessage(), [
                'exception' => $e,
                'request_data' => $request->all(),
            ]);

            return response()->json([
                'message' => 'Failed to update profile. Please try again later.',
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

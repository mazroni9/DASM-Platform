<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Dealer;
use App\Models\VenueOwner;
use App\Models\Investor;
use App\Enums\UserStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;
use App\Notifications\VerifyEmailNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AuthController extends Controller
{
    /**
     * Register a new user
     */

public function register(Request $request)
{
    Log::info('Registration process started', ['email' => $request->email]);

    // ✅ التحقق الأساسي
    $validator = Validator::make($request->all(), [
        'first_name'   => 'required|string|max:255',
        'last_name'    => 'required|string|max:255',
        'email'        => 'required|string|email|max:255|unique:users',
        'phone'        => ['required','string','max:15','unique:users','regex:/^[\+]?[0-9\s\-\(\)]{10,15}$/'],
        'password'     => 'required|string|min:8',
        'account_type' => 'nullable|string|in:user,dealer,venue_owner,investor',
        'area_id'      => 'nullable|string|exists:areas,id',
    ], [
        'first_name.required' => 'الاسم الأول مطلوب',
        'first_name.string'   => 'الاسم الأول يجب أن يكون نصًا',
        'first_name.max'      => 'الاسم الأول يجب ألا يتجاوز 255 حرفًا',

        'last_name.required'  => 'الاسم الأخير مطلوب',
        'last_name.string'    => 'الاسم الأخير يجب أن يكون نصًا',
        'last_name.max'       => 'الاسم الأخير يجب ألا يتجاوز 255 حرفًا',

        'email.required'      => 'البريد الإلكتروني مطلوب',
        'email.email'         => 'يرجى إدخال بريد إلكتروني صالح',
        'email.unique'        => 'هذا البريد الإلكتروني مستخدم بالفعل',
        'email.max'           => 'البريد الإلكتروني يجب ألا يتجاوز 255 حرفًا',

        'phone.required'      => 'رقم الهاتف مطلوب',
        'phone.string'        => 'رقم الهاتف يجب أن يكون نصًا',
        'phone.max'           => 'رقم الهاتف يجب ألا يتجاوز 15 رقمًا',
        'phone.unique'        => 'رقم الهاتف هذا مستخدم بالفعل',
        'phone.regex'         => 'رقم الهاتف غير صالح. يجب أن يحتوي على 10-15 رقمًا',

        'password.required'   => 'كلمة المرور مطلوبة',
        'password.string'     => 'كلمة المرور يجب أن تكون نصًا',
        'password.min'        => 'كلمة المرور يجب أن تكون على الأقل 8 أحرف',

        'account_type.in'     => 'نوع الحساب غير صالح',

        'area_id.exists'      => 'المنطقة غير صالحة',
    ]);

    if ($validator->fails()) {
        Log::warning('Registration validation failed', ['errors' => $validator->errors()->toArray()]);
        return response()->json([
            'status'      => 'error',
            'message'     => 'بيانات التسجيل غير صالحة',
            'errors'      => $validator->errors()->toArray(),
            'first_error' => $validator->errors()->first(),
        ], 422);
    }

    // ✅ تحقق إضافي لحسابات الأعمال
    $isBusinessAccount = in_array($request->account_type, ['dealer', 'venue_owner', 'investor']);
    if ($isBusinessAccount) {
        Log::info('Business account registration detected', [
            'email'               => $request->email,
            'type'                => $request->account_type,
            'commercial_registry' => $request->commercial_registry,
            'company_name'        => $request->company_name,
            'description'         => $request->description,
            'address'             => $request->address,
        ]);

        $businessValidator = Validator::make($request->all(), [
            'company_name'        => 'required|string|max:255',
            'commercial_registry' => 'required|string|max:50',
            'description'         => 'nullable|string|max:1000',
            'address'             => 'required_if:account_type,venue_owner|string|min:5|max:255',
        ], [
            'company_name.required'        => 'اسم الشركة/المعرض مطلوب',
            'company_name.string'          => 'اسم الشركة/المعرض يجب أن يكون نصًا',
            'company_name.max'             => 'اسم الشركة/المعرض يجب ألا يتجاوز 255 حرفًا',

            'commercial_registry.required' => 'رقم السجل التجاري مطلوب',
            'commercial_registry.string'   => 'رقم السجل التجاري يجب أن يكون نصًا',
            'commercial_registry.max'      => 'رقم السجل التجاري يجب ألا يتجاوز 50 حرفًا',

            'description.string'           => 'وصف الشركة يجب أن يكون نصاً',
            'description.max'              => 'وصف الشركة يجب ألا يتجاوز 1000 حرفاً',

            'address.required_if'          => 'العنوان مطلوب لمالك المعرض',
            'address.string'               => 'العنوان يجب أن يكون نصًا',
            'address.min'                  => 'العنوان يجب أن يكون 5 أحرف على الأقل',
            'address.max'                  => 'العنوان يجب ألا يتجاوز 255 حرفًا',
        ]);

        if ($businessValidator->fails()) {
            Log::warning('Business account validation failed', ['errors' => $businessValidator->errors()->toArray()]);
            return response()->json([
                'status'      => 'error',
                'message'     => 'بيانات الحساب التجاري غير صالحة',
                'errors'      => $businessValidator->errors()->toArray(),
                'first_error' => $businessValidator->errors()->first(),
            ], 422);
        }
    }

    // ✅ رمز تحقق البريد
    $verificationToken = Str::random(60);
    Log::info('Generated verification token', ['token_length' => strlen($verificationToken)]);

    try {
        $user = null;

        DB::transaction(function () use ($request, $isBusinessAccount, $verificationToken, &$user) {

            $passwordColumn = null;
            if (Schema::hasColumn('users', 'password_hash')) {
                $passwordColumn = 'password_hash';
            } elseif (Schema::hasColumn('users', 'password')) {
                $passwordColumn = 'password';
            } else {
                throw new \RuntimeException('لم يتم العثور على عمود كلمة المرور (password أو password_hash) في جدول users.');
            }

            $userData = [
                'first_name'               => $request->first_name,
                'last_name'                => $request->last_name,
                'email'                    => $request->email,
                'phone'                    => $request->phone,
                $passwordColumn            => Hash::make($request->password),
                'role'                     => $request->account_type ?? 'user',
                'email_verification_token' => $verificationToken,
                'is_active'                => false,
                'area_id'                  => $request->area_id,
            ];

            if (Schema::hasColumn('users', 'status') && empty($userData['status'])) {
                $userData['status'] = 'pending';
            }
            if (Schema::hasColumn('users', 'approval_status') && empty($userData['approval_status'])) {
                $userData['approval_status'] = 'pending';
            }

            $user = User::create($userData);

            Log::info('User created successfully', [
                'user_id' => $user->id,
                'email'   => $user->email,
                'role'    => $user->role,
            ]);

            if ($isBusinessAccount) {
                Log::info('Creating business account record with data', [
                    'user_id'             => $user->id,
                    'account_type'        => $request->account_type,
                    'company_name'        => $request->company_name,
                    'commercial_registry' => $request->commercial_registry,
                    'description'         => $request->description,
                    'address'             => $request->address,
                    'area_id'             => $request->area_id,
                ]);

                switch ($request->account_type) {
                    case 'dealer':
                        Dealer::create([
                            'user_id'             => $user->id,
                            'company_name'        => $request->company_name,
                            'commercial_registry' => $request->commercial_registry,
                            'description'         => $request->description ?? null,
                            'status'              => 'pending',
                            'is_active'           => false,

                        ]);
                        break;

                    case 'venue_owner':
                        VenueOwner::create([
                            'user_id'             => $user->id,
                            'venue_name'          => $request->company_name,
                            'commercial_registry' => $request->commercial_registry,
                            'description'         => null,
                            'address'             => $request->address,
                            'status'              => 'pending',
                            'is_active'           => false,

                        ]);
                        break;

                    case 'investor':
                        Investor::create([
                            'user_id'                => $user->id,
                            'company_name'           => $request->company_name,
                            'commercial_registry'    => $request->commercial_registry,
                            'investment_description' => null,
                            'investment_capacity'    => null,
                            'status'                 => 'pending',
                            'is_active'              => false,
                            
                        ]);
                        break;
                }

                Log::info('Business account record created', [
                    'user_id' => $user->id,
                    'type'    => $request->account_type,
                    'area_id' => $request->area_id,
                ]);
            }
        });

        Log::info('Attempting to send verification email', ['email' => $user->email, 'area_id' => $request->area_id]);
        $this->sendVerificationEmail($user);

        return response()->json([
            'status'  => 'success',
            'message' => $isBusinessAccount
                ? 'تم إنشاء الحساب التجاري بنجاح وهو في انتظار التحقق'
                : 'تم إنشاء الحساب بنجاح',
            'user'    => [
                'id'         => $user->id,
                'first_name' => $user->first_name,
                'last_name'  => $user->last_name,
                'email'      => $user->email,
                'role'       => $user->role,
                'area_id'    => $user->area_id,
            ],
        ], 201);

    } catch (\Illuminate\Database\QueryException $e) {
        $sqlState = $e->getCode();
        $msg      = $e->getMessage();
        $info     = $e->errorInfo ?? [];

        Log::error('Database error during registration', [
            'sqlstate' => $sqlState,
            'message'  => $msg,
            'errorInfo'=> $info,
            'email'    => $request->email,
            'area_id'  => $request->area_id,
        ]);

        if ($sqlState === '23505') {
            if (str_contains($msg, '(email)')) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'البريد الإلكتروني مستخدم بالفعل',
                    'errors'  => ['email' => ['البريد الإلكتروني مستخدم بالفعل']],
                ], 422);
            }
            if (str_contains($msg, '(phone)')) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'رقم الهاتف مستخدم بالفعل',
                    'errors'  => ['phone' => ['رقم الهاتف مستخدم بالفعل']],
                ], 422);
            }

            // ✅ الإضافة هنا
            if (
                str_contains($msg, 'commercial_registry') ||
                str_contains($msg, 'venue_owners_commercial_registry_unique') ||
                str_contains($msg, 'dealers_commercial_registry_unique') ||
                str_contains($msg, 'investors_commercial_registry_unique')
            ) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'رقم السجل التجاري مستخدم بالفعل',
                    'errors'  => ['commercial_registry' => ['رقم السجل التجاري مستخدم بالفعل']],
                ], 422);
            }
        }

        if ($sqlState === '23502') {
            if (str_contains($msg, '"password_hash"')) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'فشل إنشاء المستخدم: عمود password_hash لا يقبل القيم الفارغة.',
                    'details' => config('app.debug') ? $msg : null,
                ], 500);
            }
            if (str_contains($msg, '"password"')) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'فشل إنشاء المستخدم: عمود password لا يقبل القيم الفارغة.',
                    'details' => config('app.debug') ? $msg : null,
                ], 500);
            }
        }

        if ($sqlState === '42703') {
            if (str_contains($msg, 'address')) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'عمود address غير موجود في جدول venue_owners.',
                    'details' => config('app.debug') ? $msg : null,
                ], 500);
            }
        }

        return response()->json([
            'status'  => 'error',
            'message' => 'حدث خطأ في قاعدة البيانات. يرجى المحاولة مرة أخرى.',
            'details' => config('app.debug') ? $msg : null,
        ], 500);

    } catch (\RuntimeException $e) {
        Log::error('Runtime error during registration', [
            'message' => $e->getMessage(),
            'email'   => $request->email,
            'area_id' => $request->area_id,
        ]);
        return response()->json([
            'status'  => 'error',
            'message' => $e->getMessage(),
        ], 500);

    } catch (\Exception $e) {
        Log::error('Error during user registration process', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
            'email' => $request->email,
        ]);

        return response()->json([
            'status'  => 'error',
            'message' => 'حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.',
            'details' => config('app.debug') ? $e->getMessage() : null,
        ], 500);
    }
}

    /**
     * Send verification email to user
     */
    private function sendVerificationEmail(User $user)
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
        $verificationUrl = $frontendUrl . '/verify-email?token=' . $user->email_verification_token;

        Log::info('Preparing verification email', [
            'user_id' => $user->id,
            'email' => $user->email,
            'verification_url' => $verificationUrl,
            'mail_config' => [
                'driver' => config('mail.default'),
                'host' => config('mail.mailers.smtp.host'),
                'port' => config('mail.mailers.smtp.port'),
                'encryption' => config('mail.mailers.smtp.encryption'),
                'from_address' => config('mail.from.address'),
                'from_name' => config('mail.from.name'),
            ]
        ]);

        try {
            $user->notify(new VerifyEmailNotification($verificationUrl));
            Log::info('Verification email sent successfully', ['email' => $user->email]);
        } catch (\Exception $e) {
            Log::error('Failed to send verification email', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'email' => $user->email,
                'user_id' => $user->id
            ]);
        }
    }

    /**
     * Verify email address
     */
    public function verifyEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first()
            ], 422);
        }

        $user = User::where('email_verification_token', $request->token)->first();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid verification token'
            ], 400);
        }

        // Token is valid, mark email as verified
        $user->markEmailAsVerified();

        return response()->json([
            'status' => 'success',
            'message' => 'Email verified successfully'
        ]);
    }

    /**
     * Resend verification email
     */
    public function resendVerification(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not found'
            ], 404);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Email already verified'
            ], 400);
        }

        // Generate new token if necessary
        if (!$user->email_verification_token) {
            $user->email_verification_token = Str::random(60);
            $user->save();
        }

        // Send verification email
        $this->sendVerificationEmail($user);

        return response()->json([
            'status' => 'success',
            'message' => 'Verification email resent successfully'
        ]);
    }

    /**
     * Login user and create sanctum token
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required',
            'remember' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()->toArray()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['البريد الإلكتروني أو كلمة المرور غير صحيحة.'],
            ]);
        }

        if (!Hash::check($request->password, $user->password_hash)) {
            throw ValidationException::withMessages([
                'email' => ['البريد الإلكتروني أو كلمة المرور غير صحيحة.'],
            ]);
        }

        // Check if email is verified
        if (!$user->hasVerifiedEmail()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Email not verified',
                'email' => $user->email
            ], 401);
        }

        // Check if user is approved by admin
        // Using enum comparison for better reliability
        if ($user->status !== UserStatus::ACTIVE) {
            return response()->json([
                'status' => 'error',
                'message' => 'حسابك غير مفعل من قبل الإدارة.',
                'email' => $user->email,
            ], 403);
        }

        // Create a new token for the user
        $token = $user->createToken('auth_token')->plainTextToken;

        // Calculate token expiration time
        $expiresAt = now()->addMinutes(config('sanctum.expiration', 120));

        return response()->json([
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'access_token' => $token,
            'token_type' => 'Bearer',
            'expiresAt' => $expiresAt->toIso8601String(),
        ]);
    }

    /**
     * Refresh the user's token
     */
    public function refresh(Request $request)
    {
        // Get the authenticated user
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated'
            ], 401);
        }

        // Revoke the current token
        $request->user()->currentAccessToken()->delete();

        // Create a new token
        $token = $user->createToken('auth_token')->plainTextToken;

        // Calculate new expiration time
        $expiresAt = now()->addMinutes(config('sanctum.expiration', 120));

        return response()->json([
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'access_token' => $token,
            'token_type' => 'Bearer',
            'expiresAt' => $expiresAt->toIso8601String(),
        ]);
    }

    /**
     * Logout user (revoke token)
     */
    public function logout(Request $request)
    {
        // Invalidate the session
        $request->session()->invalidate();

        // Regenerate the CSRF token
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Send a reset password link to the user's email.
     */
    public function forgotPassword(Request $request)
    {
        Log::info('Password reset process started', ['email' => $request->email]);

        $validator = Validator::make($request->all(), [
            'email' => 'required|email'
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'message' => $validator->errors()->first()], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            // For security, don't reveal that the user doesn't exist
            return response()->json([
                'status' => 'success',
                'message' => 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني إذا كان الحساب موجودًا.'
            ]);
        }

        // Generate a random token
        $token = Str::random(60);

        // Store the token and expiration time in the user record
        $user->update([
            'password_reset_token' => $token,
            'password_reset_expires_at' => now()->addMinutes(60) // Token expires after 60 minutes
        ]);

        // Create the reset URL for the frontend
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
        $resetUrl = $frontendUrl . '/auth/reset-password?token=' . $token;

        try {
            // Send the password reset email
            $user->notify(new \App\Notifications\ResetPasswordNotification($resetUrl));

            Log::info('Password reset email sent', ['email' => $user->email]);

            return response()->json([
                'status' => 'success',
                'message' => 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send password reset email', [
                'error' => $e->getMessage(),
                'email' => $user->email
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ أثناء إرسال بريد إعادة تعيين كلمة المرور. يرجى المحاولة مرة أخرى.'
            ], 500);
        }
    }

    /**
     * Reset the user's password using the token.
     */
    public function resetPassword(Request $request)
    {
        Log::info('Password reset verification started');

        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'password' => 'required|string|min:8',
            'password_confirmation' => 'required|same:password'
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'message' => $validator->errors()->first()], 422);
        }

        // Find the user with this token
        $user = User::where('password_reset_token', $request->token)
                    ->where('password_reset_expires_at', '>', now()) // Token must not be expired
                    ->first();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'رمز إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية.'
            ], 400);
        }

        // Update the password and clear the reset token
        $user->update([
            'password_hash' => Hash::make($request->password),
            'password_reset_token' => null,
            'password_reset_expires_at' => null
        ]);

        Log::info('Password reset successful', ['user_id' => $user->id, 'email' => $user->email]);

        return response()->json([
            'status' => 'success',
            'message' => 'تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.'
        ]);
    }
}


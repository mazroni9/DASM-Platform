<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\User;
use App\Models\Investor;
use App\Models\Organization;
use App\Enums\OrganizationType;
use App\Enums\UserStatus;
use App\Models\VenueOwner;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Laravel\Sanctum\PersonalAccessToken;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;
use App\Notifications\VerifyEmailNotification;
use App\Notifications\BusinessAccountVerifiedNotification;
use App\Enums\UserRole;
use Illuminate\Database\QueryException;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        Log::info('Registration process started', ['email' => $request->email]);

        // ✅ لا نسمح أبداً بتمرير id من الواجهة
        if ($request->has('id')) {
            $request->request->remove('id');
        }

        // ✅ تطبيع/تنظيف مُسبق للمدخلات قبل التحقق
        $email = Str::lower(trim((string) $request->input('email')));
        $phone = preg_replace('/\s+/', '', (string) $request->input('phone')); // إزالة المسافات
        $registry = $request->filled('commercial_registry')
            ? preg_replace('/\s+/', '', (string) $request->input('commercial_registry'))
            : null;

        // ✅ area_id: لو جاية من الواجهة بصيغة country:/region: نخليها null
        $areaId = $request->input('area_id');
        if (is_string($areaId) && str_contains($areaId, ':')) {
            $areaId = null;
        }

        $request->merge([
            'email' => $email,
            'phone' => $phone,
            'commercial_registry' => $registry,
            'area_id' => $areaId,
            'first_name' => trim((string) $request->input('first_name')),
            'last_name'  => trim((string) $request->input('last_name')),
        ]);

        // ✅ التحقق الأساسي
        $validator = Validator::make($request->all(), [
            'first_name'   => 'required|string|max:255',
            'last_name'    => 'required|string|max:255',
            'email'        => 'required|string|email|max:255|unique:users,email',
            'phone'        => ['required', 'string', 'max:15', 'unique:users,phone', 'regex:/^[\+]?[0-9\-\(\)]{10,15}$/'],
            'password'     => 'required|string|min:8',
            'account_type' => 'nullable|string|in:user,dealer,venue_owner,investor',
            'area_id'      => 'nullable|exists:areas,id',
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

        // ✅ تحقق إضافي لحسابات الأعمال + فحص فريد على الجدول الصحيح
        $isBusinessAccount = in_array($request->account_type, ['venue_owner', 'investor']);
        if ($isBusinessAccount) {
            Log::info('Business account registration detected', [
                'email'               => $request->email,
                'type'                => $request->account_type,
                'commercial_registry' => $request->commercial_registry,
                'company_name'        => $request->company_name,
                'description'         => $request->description,
                'address'             => $request->address,
            ]);

            $table = match ($request->account_type) {
                'venue_owner' => 'venue_owners',
                'investor'    => 'investors',
                default       => null,
            };

            $businessValidator = Validator::make($request->all(), [
                'company_name'        => 'required|string|max:255',
                'commercial_registry' => [
                    'required',
                    'string',
                    'max:50',
                    $table ? Rule::unique($table, 'commercial_registry') : 'nullable'
                ],
                'description'         => 'nullable|string|max:1000',
                'address'             => 'required_if:account_type,venue_owner|string|min:5|max:255',
            ], [
                'company_name.required'        => 'اسم الشركة/المعرض مطلوب',
                'company_name.string'          => 'اسم الشركة/المعرض يجب أن يكون نصًا',
                'company_name.max'             => 'اسم الشركة/المعرض يجب ألا يتجاوز 255 حرفًا',

                'commercial_registry.required' => 'رقم السجل التجاري مطلوب',
                'commercial_registry.string'   => 'رقم السجل التجاري يجب أن يكون نصًا',
                'commercial_registry.max'      => 'رقم السجل التجاري يجب ألا يتجاوز 50 حرفًا',
                'commercial_registry.unique'   => 'رقم السجل التجاري مستخدم بالفعل',

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

        $verificationToken = Str::random(60);
        Log::info('Generated verification token', ['token_length' => strlen($verificationToken)]);

        try {
            $user = new User();

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
                    'type'                     => $request->account_type ?? 'user',
                    'email_verification_token' => $verificationToken,
                    'is_active'                => false,
                    'area_id'                  => $request->area_id,
                ];

                unset($userData['id']);

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
                    'type'    => $user->type,
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
                    'type'       => $user->type,
                    'area_id'    => $user->area_id,
                ],
            ], 201);
        } catch (QueryException $e) {
            Log::error($e);
            $out = $this->interpretDbError($e, $request);

            Log::error('Database error during registration', [
                'sqlstate'   => $out['sqlstate'],
                'reason'     => $out['reason'],
                'message'    => $out['details'],
                'email'      => $request->email,
                'area_id'    => $request->area_id,
                'driver'     => DB::getDriverName(),
                'error_info' => $e->errorInfo ?? [],
            ]);

            return response()->json(array_filter([
                'status'  => 'error',
                'message' => $out['message'],
                'reason'  => $out['reason'],
                'errors'  => $out['errors'] ?? null,
                'sqlstate' => $out['sqlstate'],
                'details' => config('app.debug') ? $out['details'] : null,
                'column'  => $out['column'] ?? null,
                'value'   => $out['value'] ?? null,
                'constraint' => $out['constraint'] ?? null,
            ]), $out['http']);
        } catch (\RuntimeException $e) {
            Log::error('Runtime error during registration', [
                'message' => $e->getMessage(),
                'email'   => $request->email,
                'area_id' => $request->area_id,
            ]);
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
                'reason'  => 'خطأ في منطق التطبيق (RuntimeException).',
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
                'reason'  => 'استثناء عام غير متوقّع.',
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

        $user->markEmailAsVerified();
        $user->refresh();

        if (in_array($user->type->value ?? $user->type, ['dealer', 'venue_owner'])) {
            $this->notifyAdminsAboutBusinessAccountVerification($user);
        }

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

        if (!$user->email_verification_token) {
            $user->email_verification_token = Str::random(60);
            $user->save();
        }

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

        $user = User::where('email', Str::lower(trim((string)$request->email)))->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['البريد الإلكتروني أو كلمة المرور غير صحيحة.'],
            ]);
        }

        if (Schema::hasColumn('users', 'password_hash')) {
            if (!Hash::check($request->password, $user->password_hash)) {
                throw ValidationException::withMessages([
                    'email' => ['البريد الإلكتروني أو كلمة المرور غير صحيحة.'],
                ]);
            }
        } elseif (Schema::hasColumn('users', 'password')) {
            if (!Hash::check($request->password, $user->password)) {
                throw ValidationException::withMessages([
                    'email' => ['البريد الإلكتروني أو كلمة المرور غير صحيحة.'],
                ]);
            }
        } else {
            return response()->json([
                'status'  => 'error',
                'message' => 'لا يوجد عمود لكلمة المرور في جدول المستخدمين.',
            ], 500);
        }

        if (!$user->hasVerifiedEmail()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Email not verified',
                'email' => $user->email
            ], 401);
        }

        // ✅ Compare status safely (enum or string)
        $status = $user->status ?? null;
        if ($status instanceof \BackedEnum) {
            $status = $status->value;
        }
        $status = strtolower(trim((string)$status));
        $activeValue = strtolower(UserStatus::ACTIVE->value ?? 'active');

        if ($status !== $activeValue) {
            return response()->json([
                'status' => 'error',
                'message' => 'حسابك غير مفعل من قبل الإدارة.',
                'email' => $user->email,
            ], 403);
        }

        $accessTokenExpiresAt = now()->addMinutes(15);
        $accessToken = $user->createToken('access_token', ['*'], $accessTokenExpiresAt)->plainTextToken;

        $refreshTokenExpiresAt = now()->addDays(7);
        $refreshToken = $user->createToken('refresh_token', ['issue-access-token'], $refreshTokenExpiresAt)->plainTextToken;

        $cookie = cookie(
            'refresh_token',
            $refreshToken,
            60 * 24 * 7,
            '/',
            config('session.domain'),
            true,
            true,
            false,
            'None'
        );

        $permissions = $this->getUserPermissions($user);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'type' => $user->type,
                'permissions' => $permissions,
            ],
            'access_token' => $accessToken,
            'token_type' => 'Bearer',
            'expires_at' => $accessTokenExpiresAt->toIso8601String(),
        ])->withCookie($cookie);
    }

    /**
     * Refresh the user's token
     */
    public function refresh(Request $request)
    {
        $refreshToken = $request->cookie('refresh_token');

        if (!$refreshToken) {
            return response()->json([
                'status' => 'error',
                'message' => 'No refresh token provided',
            ], 401);
        }

        $tokenParts = explode('|', $refreshToken);
        if (count($tokenParts) !== 2) {
            $forget = cookie('refresh_token', '', -1, '/', config('session.domain'), true, true, false, 'None');
            return response()->json(['message' => 'Invalid token format'], 401)->withCookie($forget);
        }

        $tokenId = $tokenParts[0];
        $tokenValue = $tokenParts[1];

        $dbToken = PersonalAccessToken::find($tokenId);

        if (!$dbToken) {
            $forget = cookie('refresh_token', '', -1, '/', config('session.domain'), true, true, false, 'None');
            return response()->json(['message' => 'Invalid refresh token'], 401)->withCookie($forget);
        }

        // ✅ Ensure this is really a refresh token
        if (($dbToken->name ?? null) !== 'refresh_token' || !$dbToken->can('issue-access-token')) {
            $dbToken->delete();
            $forget = cookie('refresh_token', '', -1, '/', config('session.domain'), true, true, false, 'None');
            return response()->json(['message' => 'Invalid refresh token'], 401)->withCookie($forget);
        }

        if (!hash_equals($dbToken->token, hash('sha256', $tokenValue))) {
            $dbToken->delete();
            $forget = cookie('refresh_token', '', -1, '/', config('session.domain'), true, true, false, 'None');
            return response()->json(['message' => 'Invalid refresh token'], 401)->withCookie($forget);
        }

        if ($dbToken->expires_at && Carbon::parse($dbToken->expires_at)->isPast()) {
            $dbToken->delete();
            $forget = cookie('refresh_token', '', -1, '/', config('session.domain'), true, true, false, 'None');
            return response()->json(['message' => 'Refresh token expired'], 401)->withCookie($forget);
        }

        $user = $dbToken->tokenable;

        if (!$user) {
            $dbToken->delete();
            $forget = cookie('refresh_token', '', -1, '/', config('session.domain'), true, true, false, 'None');
            return response()->json(['message' => 'User not found'], 401)->withCookie($forget);
        }

        // ✅ Re-check same access rules as login (security)
        if (!$user->hasVerifiedEmail()) {
            $dbToken->delete();
            $forget = cookie('refresh_token', '', -1, '/', config('session.domain'), true, true, false, 'None');
            return response()->json(['message' => 'Email not verified'], 401)->withCookie($forget);
        }

        $status = $user->status ?? null;
        if ($status instanceof \BackedEnum) {
            $status = $status->value;
        }
        $status = strtolower(trim((string)$status));
        $activeValue = strtolower(UserStatus::ACTIVE->value ?? 'active');

        if ($status !== $activeValue) {
            $dbToken->delete();
            $forget = cookie('refresh_token', '', -1, '/', config('session.domain'), true, true, false, 'None');
            return response()->json(['message' => 'Account not active'], 403)->withCookie($forget);
        }

        // Rotate tokens
        $dbToken->delete();

        $accessTokenExpiresAt = now()->addMinutes(15);
        $newAccessToken = $user->createToken('access_token', ['*'], $accessTokenExpiresAt)->plainTextToken;

        $refreshTokenExpiresAt = now()->addDays(7);
        $newRefreshToken = $user->createToken('refresh_token', ['issue-access-token'], $refreshTokenExpiresAt)->plainTextToken;

        $cookie = cookie(
            'refresh_token',
            $newRefreshToken,
            60 * 24 * 7,
            '/',
            config('session.domain'),
            true,
            true,
            false,
            'None'
        );

        $permissions = $this->getUserPermissions($user);

        return response()->json([
            'access_token' => $newAccessToken,
            'token_type' => 'Bearer',
            'expires_at' => $accessTokenExpiresAt->toIso8601String(),
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'type' => $user->type,
                'permissions' => $permissions,
            ],
        ])->withCookie($cookie);
    }

    /**
     * Logout user (revoke token)
     */
    public function logout(Request $request)
    {
        // Always attempt to delete refresh token if cookie exists (even if user not authenticated)
        $refreshToken = $request->cookie('refresh_token');
        if ($refreshToken) {
            $tokenParts = explode('|', $refreshToken);
            if (count($tokenParts) === 2) {
                $tokenId = $tokenParts[0];
                PersonalAccessToken::where('id', $tokenId)->delete();
            }
        }

        // Revoke current access token if authenticated
        $user = $request->user();
        if ($user) {
            $user->currentAccessToken()?->delete();

            // If you want a "hard logout" everywhere:
            // $user->tokens()->delete();
        }

        // Clear refresh cookie with same attributes
        $forget = cookie('refresh_token', '', -1, '/', config('session.domain'), true, true, false, 'None');

        return response()->json(['message' => 'Logged out successfully'])->withCookie($forget);
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

        $user = User::where('email', Str::lower(trim((string)$request->email)))->first();

        if (!$user) {
            return response()->json([
                'status' => 'success',
                'message' => 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني إذا كان الحساب موجودًا.'
            ]);
        }

        $token = Str::random(60);

        $user->update([
            'password_reset_token' => $token,
            'password_reset_expires_at' => now()->addMinutes(60)
        ]);

        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
        $resetUrl = $frontendUrl . '/auth/reset-password?token=' . $token;

        try {
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

        $user = User::where('password_reset_token', $request->token)
            ->where('password_reset_expires_at', '>', now())
            ->first();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'رمز إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية.'
            ], 400);
        }

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

    // ============================
    // 🔧 دوال مساعدة لتفسير أخطاء DB
    // ============================
    private function interpretDbError(QueryException $e, Request $request): array
    {
        $sqlState = $e->getCode();
        $msg      = $e->getMessage();
        $driver   = DB::getDriverName();
        $reason   = 'خطأ في قاعدة البيانات.';
        $message  = 'حدث خطأ في قاعدة البيانات. يرجى المحاولة مرة أخرى.';
        $http     = 500;
        $errors   = [];
        $details  = $msg;
        $column   = null;
        $value    = null;
        $constraint = null;

        $detail = $e->errorInfo[2] ?? $msg;
        if (preg_match('/Key \(([^)]+)\)=\(([^)]+)\)/', $detail, $m)) {
            $column = $m[1] ?? null;
            $value  = $m[2] ?? null;
        }
        if (preg_match('/unique constraint "([^"]+)"/i', $detail, $m)) {
            $constraint = $m[1] ?? null;
        }

        $contains = fn(string $needle) => $this->str_contains_ci($msg, $needle) || $this->str_contains_ci($detail, $needle);

        if (in_array($sqlState, ['42P01', '42S02'])) {
            $reason  = 'الجدول المطلوب غير موجود. تأكد من تشغيل المايجريشن.';
            $message = 'قاعدة البيانات غير مهيأة: يرجى تشغيل المايجريشن.';
            $http    = 500;
        } elseif (in_array($sqlState, ['42703', '42S22'])) {
            $reason  = 'هناك عمود مفقود في الجدول. تأكد من تحديث بنية قاعدة البيانات.';
            $message = 'عمود مفقود في الجدول. يرجى تشغيل أحدث المايجريشن.';
            $http    = 500;
            if ($contains('address') && $contains('venue_owners')) {
                $reason = 'عمود address غير موجود في جدول venue_owners.';
            }
        } elseif ($sqlState === '23505' || ($sqlState === '23000' && $contains('Duplicate entry'))) {
            $http   = 422;
            $reason = 'تعارض في قيمة فريدة (duplicate).';

            if ($column === 'email' || $contains('(email)') || $contains('users_email_unique') || $contains("for key 'users_email_unique'")) {
                $message = 'البريد الإلكتروني مستخدم بالفعل';
                $errors  = ['email' => ['البريد الإلكتروني مستخدم بالفعل']];
            } elseif ($column === 'phone' || $contains('(phone)') || $contains('users_phone_unique') || $contains("for key 'users_phone_unique'")) {
                $message = 'رقم الهاتف مستخدم بالفعل';
                $errors  = ['phone' => ['رقم الهاتف مستخدم بالفعل']];
            } elseif (
                $column === 'commercial_registry' ||
                $contains('commercial_registry') ||
                $contains('venue_owners_commercial_registry_unique') ||
                $contains('dealers_commercial_registry_unique') ||
                $contains('investors_commercial_registry_unique')
            ) {
                $message = 'رقم السجل التجاري مستخدم بالفعل';
                $errors  = ['commercial_registry' => ['رقم السجل التجاري مستخدم بالفعل']];
            } elseif (($column === 'id' && $constraint === 'users_pkey') || $contains('users_pkey')) {
                $http    = 500;
                $reason  = 'تعارض في المفتاح الأساسي للمستخدم (id). غالباً مشكلة في الترقيم التلقائي.';
                $message = 'حدث خطأ تقني أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى، وإذا استمرت المشكلة تواصل مع الدعم.';
            } else {
                $message = 'تعارض مع قيد فريد في قاعدة البيانات.';
            }
        } elseif ($sqlState === '23502') {
            $http   = 500;
            $reason = 'محاولة إدخال قيمة فارغة في عمود لا يقبل الفراغ.';
            if ($contains('"password_hash"')) {
                $message = 'فشل إنشاء المستخدم: عمود password_hash لا يقبل القيم الفارغة.';
            } elseif ($contains('"password"')) {
                $message = 'فشل إنشاء المستخدم: عمود password لا يقبل القيم الفارغة.';
            } else {
                $message = 'حقل مطلوب مفقود على مستوى قاعدة البيانات.';
            }
        } elseif ($sqlState === '23503') {
            $http    = 422;
            $reason  = 'فشل تكامل المفتاح الأجنبي (قيمة غير موجودة).';
            $message = 'قيمة مرجعية غير صالحة. تحقق من المعرفات المرتبطة.';
            if ($contains('areas') || $contains('area_id')) {
                $errors  = ['area_id' => ['area_id غير صالح أو غير موجود']];
                $message = 'المنطقة غير صالحة أو غير موجودة.';
            }
        } elseif ($sqlState === '22P02') {
            $http    = 422;
            $reason  = 'قيمة ذات صيغة غير صالحة (مثلاً UUID غير صحيح).';
            $message = 'صيغة قيمة غير صالحة. تحقق من الحقول المعرّفة كـ UUID.';
            if ($contains('uuid') || $contains('area_id')) {
                $errors = ['area_id' => ['صيغة area_id غير صالحة (UUID)']];
            }
        } elseif ($sqlState === '42804') {
            $http    = 400;
            $reason  = 'عدم تطابق في نوع البيانات.';
            $message = 'نوع البيانات المُرسل لا يتوافق مع العمود في قاعدة البيانات.';
        } else {
            $http    = 500;
            $reason  = 'خطأ قاعدة بيانات غير معروف.';
            $message = 'حدث خطأ في قاعدة البيانات. يرجى المحاولة مرة أخرى.';
        }

        return [
            'http'       => $http,
            'message'    => $message,
            'reason'     => $reason,
            'errors'     => $errors,
            'sqlstate'   => $sqlState,
            'details'    => $details,
            'column'     => $column,
            'value'      => $value,
            'constraint' => $constraint,
        ];
    }

    private function str_contains_ci(string $haystack, string $needle): bool
    {
        return $needle !== '' && mb_stripos($haystack ?? '', $needle) !== false;
    }

    /** صلاحيات المستخدم مع سياق الفريق الصحيح (organization أو platform) */
    private function getUserPermissions(User $user): array
    {
        try {
            $registrar = app(\Spatie\Permission\PermissionRegistrar::class);
            $teamId = $user->organization_id;
            if (!$teamId) {
                $platformOrg = Organization::where('type', OrganizationType::PLATFORM)->first();
                $teamId = $platformOrg?->id;
            }
            if ($teamId) {
                $registrar->setPermissionsTeamId($teamId);
            }
            if (method_exists($user, 'getAllPermissions')) {
                return $user->getAllPermissions()->pluck('name')->values()->toArray();
            }
        } catch (\Throwable $e) {
            // ignore
        }
        return [];
    }

    /**
     * Notify admins and super_admins about a business account verification
     */
    private function notifyAdminsAboutBusinessAccountVerification(User $user): void
    {
        try {
            $admins = User::whereIn('type', [
                UserRole::ADMIN->value,
                UserRole::SUPER_ADMIN->value,
            ])
                ->where('is_active', true)
                ->get();

            foreach ($admins as $admin) {
                $admin->notify(new BusinessAccountVerifiedNotification($user));
            }

            Log::info('Admins notified about business account verification', [
                'user_id' => $user->id,
                'user_type' => $user->type,
                'admin_count' => $admins->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to notify admins about business account verification', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
            ]);
        }
    }
}

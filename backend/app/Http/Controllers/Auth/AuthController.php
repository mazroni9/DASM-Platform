<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;

use Carbon\Carbon;
use App\Models\User;
use App\Models\Investor;
use App\Models\VenueOwner;
use App\Enums\UserStatus;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;
use Illuminate\Database\QueryException;
use Laravel\Sanctum\PersonalAccessToken;
use Illuminate\Support\Facades\RateLimiter;
use App\Notifications\VerifyEmailNotification;
use App\Notifications\ResetPasswordNotification;

class AuthController extends Controller
{
    // ====== Token settings (keep same behavior) ======
    private int $accessTokenMinutes = 15;
    private int $refreshTokenDays   = 7;

    // ====== simple in-request cache ======
    private ?string $passwordColumnCache = null;

    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        Log::info('Registration process started', [
            'email_sha1' => sha1(Str::lower(trim((string)$request->input('email')))),
            'ip' => (string)$request->ip(),
        ]);

        // ✅ لا نسمح أبداً بتمرير id من الواجهة
        if ($request->has('id')) {
            $request->request->remove('id');
        }

        // ✅ تطبيع/تنظيف مُسبق للمدخلات قبل التحقق
        $email = Str::lower(trim((string) $request->input('email')));
        $phone = preg_replace('/\s+/', '', (string) $request->input('phone'));
        $registry = $request->filled('commercial_registry')
            ? preg_replace('/\s+/', '', (string) $request->input('commercial_registry'))
            : null;

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
            'last_name.required'  => 'الاسم الأخير مطلوب',
            'email.required'      => 'البريد الإلكتروني مطلوب',
            'phone.required'      => 'رقم الهاتف مطلوب',
            'password.required'   => 'كلمة المرور مطلوبة',
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
        $isBusinessAccount = in_array($request->account_type, ['dealer', 'venue_owner', 'investor'], true);
        if ($isBusinessAccount) {
            $table = match ($request->account_type) {
                'dealer'      => 'dealers',
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
                'commercial_registry.required' => 'رقم السجل التجاري مطلوب',
                'commercial_registry.unique'   => 'رقم السجل التجاري مستخدم بالفعل',
                'address.required_if'          => 'العنوان مطلوب لمالك المعرض',
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

        // ✅ توكن تفعيل البريد (نرسل Plain للفرونت / نخزن Hash في DB)
        $verificationTokenPlain = Str::random(60);
        $verificationTokenHash  = $this->hashToken($verificationTokenPlain);

        try {
            $user = new User();

            DB::transaction(function () use ($request, $isBusinessAccount, $verificationTokenHash, &$user) {
                $passwordColumn = $this->resolvePasswordColumn();

                $userData = [
                    'first_name'               => $request->first_name,
                    'last_name'                => $request->last_name,
                    'email'                    => $request->email,
                    'phone'                    => $request->phone,
                    $passwordColumn            => Hash::make($request->password),
                    'type'                     => $request->account_type ?? 'user',
                    'email_verification_token' => $verificationTokenHash,
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

                // optional: expires column (لو موجود)
                if (Schema::hasColumn('users', 'email_verification_expires_at')) {
                    $userData['email_verification_expires_at'] = now()->addHours(24);
                }

                $user = User::create($userData);

                if ($isBusinessAccount) {
                    switch ($request->account_type) {
                        case 'dealer':
                            // Dealer users don't need a separate record, type='dealer' is sufficient
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
                }
            });

            // ✅ Send with plain token (DB stores hash)
            $this->sendVerificationEmail($user, $verificationTokenPlain);

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
            $out = $this->interpretDbError($e, $request);

            Log::error('Database error during registration', [
                'sqlstate'   => $out['sqlstate'],
                'reason'     => $out['reason'],
                'message'    => $out['details'],
                'email_sha1' => sha1((string)$request->email),
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
                'email_sha1' => sha1((string)$request->email),
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
                'email_sha1' => sha1((string)$request->email),
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
     * ✅ Security: لا نطبع URL كامل فيه token داخل اللوج
     * ✅ نخزن Hash في DB ونرسل Plain في الرابط
     */
    private function sendVerificationEmail(User $user, ?string $plainToken = null): void
    {
        $plainToken = $plainToken ?: Str::random(60);
        $tokenHash  = $this->hashToken($plainToken);

        // ensure DB has hash
        $needsSave = false;
        if ($user->email_verification_token !== $tokenHash) {
            $user->email_verification_token = $tokenHash;
            $needsSave = true;
        }
        if (Schema::hasColumn('users', 'email_verification_expires_at')) {
            $user->email_verification_expires_at = now()->addHours(24);
            $needsSave = true;
        }
        if ($needsSave) {
            $user->save();
        }

        $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/');
        $verificationUrl = $frontendUrl . '/verify-email?token=' . urlencode($plainToken);

        try {
            $user->notify(new VerifyEmailNotification($verificationUrl));
        } catch (\Exception $e) {
            Log::error('Failed to send verification email', [
                'error' => $e->getMessage(),
                'user_id' => $user->id
            ]);
        }
    }

    /**
     * Verify email address
     */
    public function verifyEmail(Request $request)
    {
        $key = 'verify_email:' . sha1((string)$request->ip());
        if (RateLimiter::tooManyAttempts($key, 30)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Too many requests. Try again later.',
                'retry_after' => RateLimiter::availableIn($key),
            ], 429);
        }
        RateLimiter::hit($key, 60);

        $validator = Validator::make($request->all(), [
            'token' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first()
            ], 422);
        }

        $tokenPlain = trim((string)$request->token);
        $tokenHash  = $this->hashToken($tokenPlain);

        // ✅ Backward compatible: match hashed OR old-plain token
        $user = User::where('email_verification_token', $tokenHash)
            ->orWhere('email_verification_token', $tokenPlain)
            ->first();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid verification token'
            ], 400);
        }

        // optional: expiry check if column exists
        if (Schema::hasColumn('users', 'email_verification_expires_at')) {
            if ($user->email_verification_expires_at && Carbon::parse($user->email_verification_expires_at)->isPast()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Verification token expired'
                ], 400);
            }
        }

        // ✅ marks verified + clears token
        $user->markEmailAsVerified();

        // clear expiry if exists
        $user->refresh();

        if (Schema::hasColumn('users', 'email_verification_expires_at')) {
            $user->email_verification_expires_at = null;
            $user->save();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Email verified successfully'
        ]);
    }

    /**
     * Resend verification email
     * ✅ rotate token ALWAYS
     * ✅ Security: منع enumeration
     * ✅ Rate limit لمنع email bombing
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

        $email = Str::lower(trim((string)$request->email));

        $key = 'resend_verify:' . sha1($email . '|' . (string)$request->ip());
        if (RateLimiter::tooManyAttempts($key, 5)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Too many requests. Try again later.',
                'retry_after' => RateLimiter::availableIn($key),
            ], 429);
        }
        RateLimiter::hit($key, 15 * 60);

        $user = User::where('email', $email)->first();

        // ✅ نفس الرد حتى لو المستخدم مش موجود / أو Verified
        if (!$user || $user->hasVerifiedEmail()) {
            return response()->json([
                'status' => 'success',
                'message' => 'Verification email resent successfully'
            ]);
        }

        $plain = Str::random(60);
        $this->sendVerificationEmail($user, $plain);

        return response()->json([
            'status' => 'success',
            'message' => 'Verification email resent successfully'
        ]);
    }

    /**
     * Login user and create sanctum token
     * ✅ Security: Rate limit ضد brute force
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

        $email = Str::lower(trim((string)$request->email));

        $rateKey = 'login:' . sha1($email . '|' . (string)$request->ip());
        if (RateLimiter::tooManyAttempts($rateKey, 10)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Too many login attempts. Try again later.',
                'retry_after' => RateLimiter::availableIn($rateKey),
            ], 429);
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            RateLimiter::hit($rateKey, 60);
            throw ValidationException::withMessages([
                'email' => ['البريد الإلكتروني أو كلمة المرور غير صحيحة.'],
            ]);
        }

        $passwordColumn = $this->resolvePasswordColumn();

        $storedHash = (string)($user->{$passwordColumn} ?? '');
        if ($storedHash === '' || !Hash::check((string)$request->password, $storedHash)) {
            RateLimiter::hit($rateKey, 60);
            throw ValidationException::withMessages([
                'email' => ['البريد الإلكتروني أو كلمة المرور غير صحيحة.'],
            ]);
        }

        RateLimiter::clear($rateKey);

        if (!$user->hasVerifiedEmail()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Email not verified',
            ], 401);
        }

        if ($user->status !== UserStatus::ACTIVE) {
            return response()->json([
                'status' => 'error',
                'message' => 'حسابك غير مفعل من قبل الإدارة.',
            ], 403);
        }

        $accessTokenExpiresAt = now()->addMinutes($this->accessTokenMinutes);
        $accessToken = $user->createToken('access_token', ['*'], $accessTokenExpiresAt)->plainTextToken;

        $refreshTokenExpiresAt = now()->addDays($this->refreshTokenDays);
        $refreshToken = $user->createToken('refresh_token', ['issue-access-token'], $refreshTokenExpiresAt)->plainTextToken;

        $cookie = $this->makeRefreshCookie($refreshToken);

        $permissions = [];
        try {
            if (method_exists($user, 'getAllPermissions')) {
                $permissions = $user->getAllPermissions()->pluck('name');
            }
        } catch (\Throwable $e) {
            $permissions = [];
        }

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
        $rl = 'refresh:' . sha1((string)$request->ip());
        if (RateLimiter::tooManyAttempts($rl, 120)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Too many requests. Try again later.',
                'retry_after' => RateLimiter::availableIn($rl),
            ], 429)->withCookie($this->forgetRefreshCookie());
        }
        RateLimiter::hit($rl, 60);

        $refreshToken = $request->cookie('refresh_token');

        if (!$refreshToken) {
            return response()->json([
                'status' => 'error',
                'message' => 'No refresh token provided',
            ], 401);
        }

        $parsed = $this->parseTokenString($refreshToken);
        if (!$parsed) {
            return response()->json(['message' => 'Invalid token format'], 401)
                ->withCookie($this->forgetRefreshCookie());
        }

        [$tokenId, $tokenValue] = $parsed;

        $dbToken = PersonalAccessToken::find($tokenId);
        if (!$dbToken) {
            return response()->json(['message' => 'Invalid refresh token'], 401)
                ->withCookie($this->forgetRefreshCookie());
        }

        if (($dbToken->name ?? null) !== 'refresh_token' || !$dbToken->can('issue-access-token')) {
            return response()->json(['message' => 'Invalid refresh token'], 401)
                ->withCookie($this->forgetRefreshCookie());
        }

        if (!hash_equals((string)$dbToken->token, hash('sha256', $tokenValue))) {
            return response()->json(['message' => 'Invalid refresh token'], 401)
                ->withCookie($this->forgetRefreshCookie());
        }

        if ($dbToken->expires_at && Carbon::parse($dbToken->expires_at)->isPast()) {
            $dbToken->delete();
            return response()->json(['message' => 'Refresh token expired'], 401)
                ->withCookie($this->forgetRefreshCookie());
        }

        $user = $dbToken->tokenable;

        if (!$user || !($user instanceof User)) {
            $dbToken->delete();
            return response()->json(['message' => 'User not found'], 401)
                ->withCookie($this->forgetRefreshCookie());
        }

        if (!$user->hasVerifiedEmail() || $user->status !== UserStatus::ACTIVE) {
            $dbToken->delete();
            return response()->json(['message' => 'Account not active'], 403)
                ->withCookie($this->forgetRefreshCookie());
        }

        // ✅ Rotate refresh token
        $dbToken->delete();

        $accessTokenExpiresAt = now()->addMinutes($this->accessTokenMinutes);
        $newAccessToken = $user->createToken('access_token', ['*'], $accessTokenExpiresAt)->plainTextToken;

        $refreshTokenExpiresAt = now()->addDays($this->refreshTokenDays);
        $newRefreshToken = $user->createToken('refresh_token', ['issue-access-token'], $refreshTokenExpiresAt)->plainTextToken;

        $cookie = $this->makeRefreshCookie($newRefreshToken);

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
            ],
        ])->withCookie($cookie);
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        $user = $request->user();

        if ($user instanceof User) {
            $user->currentAccessToken()?->delete();

            $refreshToken = $request->cookie('refresh_token');
            if ($refreshToken) {
                $parsed = $this->parseTokenString($refreshToken);
                if ($parsed) {
                    [$tokenId, $tokenValue] = $parsed;
                    $dbToken = PersonalAccessToken::find($tokenId);

                    if ($dbToken) {
                        $belongsToUser =
                            ($dbToken->tokenable_type ?? null) === User::class &&
                            (int)($dbToken->tokenable_id ?? 0) === (int)$user->id;

                        $isRefresh =
                            ($dbToken->name ?? null) === 'refresh_token' &&
                            $dbToken->can('issue-access-token');

                        $hashOk = hash_equals((string)$dbToken->token, hash('sha256', $tokenValue));

                        if ($belongsToUser && $isRefresh && $hashOk) {
                            $dbToken->delete();
                        }
                    }
                }
            }
        }

        return response()->json(['message' => 'Logged out successfully'])
            ->withCookie($this->forgetRefreshCookie());
    }

    /**
     * Forgot password
     */
    public function forgotPassword(Request $request)
    {
        Log::info('Password reset process started', [
            'email_sha1' => sha1(Str::lower(trim((string)$request->input('email')))),
            'ip' => (string)$request->ip(),
        ]);

        $validator = Validator::make($request->all(), [
            'email' => 'required|email'
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'message' => $validator->errors()->first()], 422);
        }

        $email = Str::lower(trim((string)$request->email));

        $key = 'forgot_password:' . sha1($email . '|' . (string)$request->ip());
        if (RateLimiter::tooManyAttempts($key, 5)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Too many requests. Try again later.',
                'retry_after' => RateLimiter::availableIn($key),
            ], 429);
        }
        RateLimiter::hit($key, 15 * 60);

        $user = User::where('email', $email)->first();

        // ✅ نفس الرد حتى لو المستخدم مش موجود
        if (!$user) {
            return response()->json([
                'status' => 'success',
                'message' => 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني إذا كان الحساب موجودًا.'
            ]);
        }

        // ✅ Plain للفرونت / Hash للـ DB
        $plain = Str::random(60);
        $hash  = $this->hashToken($plain);

        $user->update([
            'password_reset_token' => $hash,
            'password_reset_expires_at' => now()->addMinutes(60)
        ]);

        $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/');
        $resetUrl = $frontendUrl . '/auth/reset-password?token=' . urlencode($plain);

        try {
            $user->notify(new ResetPasswordNotification($resetUrl));

            return response()->json([
                'status' => 'success',
                'message' => 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send password reset email', [
                'error' => $e->getMessage(),
                'user_id' => $user->id
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ أثناء إرسال بريد إعادة تعيين كلمة المرور. يرجى المحاولة مرة أخرى.'
            ], 500);
        }
    }

    /**
     * Reset password
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'password' => 'required|string|min:8',
            'password_confirmation' => 'required|same:password'
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'message' => $validator->errors()->first()], 422);
        }

        $tokenPlain = trim((string)$request->token);
        $tokenHash  = $this->hashToken($tokenPlain);

        // ✅ Backward compatible: match hashed OR old-plain token
        $user = User::where(function ($q) use ($tokenHash, $tokenPlain) {
            $q->where('password_reset_token', $tokenHash)
                ->orWhere('password_reset_token', $tokenPlain);
        })
            ->where('password_reset_expires_at', '>', now())
            ->first();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'رمز إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية.'
            ], 400);
        }

        $hashed = Hash::make((string)$request->password);

        $update = [
            'password_reset_token' => null,
            'password_reset_expires_at' => null,
        ];

        $hasAny = false;
        if (Schema::hasColumn('users', 'password_hash')) {
            $update['password_hash'] = $hashed;
            $hasAny = true;
        }
        if (Schema::hasColumn('users', 'password')) {
            $update['password'] = $hashed;
            $hasAny = true;
        }

        if (!$hasAny) {
            return response()->json([
                'status' => 'error',
                'message' => 'لا يوجد عمود كلمة مرور في جدول users (password/password_hash).'
            ], 500);
        }

        $user->update($update);

        // ✅ revoke tokens
        try {
            if (method_exists($user, 'tokens')) {
                $user->tokens()->delete();
            }
        } catch (\Throwable $e) {
            // ignore
        }

        return response()->json([
            'status' => 'success',
            'message' => 'تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.'
        ]);
    }

    // ============================================================
    // Helpers
    // ============================================================

    private function hashToken(string $plain): string
    {
        return hash('sha256', $plain);
    }

    private function resolvePasswordColumn(): string
    {
        if ($this->passwordColumnCache) {
            return $this->passwordColumnCache;
        }

        if (Schema::hasColumn('users', 'password_hash')) {
            return $this->passwordColumnCache = 'password_hash';
        }
        if (Schema::hasColumn('users', 'password')) {
            return $this->passwordColumnCache = 'password';
        }
        throw new \RuntimeException('لم يتم العثور على عمود كلمة المرور (password أو password_hash) في جدول users.');
    }

    private function parseTokenString(string $token): ?array
    {
        $token = trim($token);
        $parts = explode('|', $token, 2);
        if (count($parts) !== 2) return null;

        $id = $parts[0];
        $val = $parts[1];

        if (!is_string($id) || !ctype_digit($id)) return null;
        if (!is_string($val) || $val === '') return null;

        return [(int)$id, $val];
    }

    private function makeRefreshCookie(string $refreshToken)
    {
        $secure = (bool) config('session.secure', true);
        $domain = config('session.domain');
        $sameSite = $this->normalizeSameSite((string) config('session.same_site', 'none'));

        return cookie(
            'refresh_token',
            $refreshToken,
            60 * 24 * $this->refreshTokenDays,
            '/',
            $domain,
            $secure,
            true,
            false,
            $sameSite
        );
    }

    private function forgetRefreshCookie()
    {
        $secure = (bool) config('session.secure', true);
        $domain = config('session.domain');
        $sameSite = $this->normalizeSameSite((string) config('session.same_site', 'none'));

        return cookie(
            'refresh_token',
            '',
            -2628000,
            '/',
            $domain,
            $secure,
            true,
            false,
            $sameSite
        );
    }

    private function normalizeSameSite(string $value): string
    {
        $v = strtolower(trim($value));
        return match ($v) {
            'lax' => 'Lax',
            'strict' => 'Strict',
            default => 'None',
        };
    }

    // ============================
    // DB Error Interpreter (كما هو)
    // ============================
    private function interpretDbError(QueryException $e, Request $request): array
    {
        $sqlState = $e->getCode();
        $msg      = $e->getMessage();
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
}

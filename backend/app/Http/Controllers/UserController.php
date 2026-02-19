<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateUserProfileRequest;
use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class UserController extends Controller
{
    /**
     * GET /user  و GET /user/profile
     */
    public function profile(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        // تحميل العلاقات
        $user->load(['venueOwner']);

        $permissions = $this->safePermissions($user);

        $responseData = [
            'id'          => $user->id,
            'first_name'  => $user->first_name,
            'last_name'   => $user->last_name,
            'name'        => trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')),
            'email'       => $user->email,
            'phone'       => $user->phone,
            'type'        => $this->enumValue($user->type),
            'kyc_status'  => $user->kyc_status,
            'is_active'   => (bool) $user->is_active,
            'status'      => $this->enumValue($user->status),
            'area_id'     => $user->area_id,
            'organization_id' => $user->organization_id,
            'avatar_url'  => $user->avatar_url,
            'two_factor_auth' => (bool) ($user->two_factor_auth ?? false),
            'notification_email' => (bool) ($user->notification_email ?? true),
            'notification_sms' => (bool) ($user->notification_sms ?? false),
            'created_at'  => $user->created_at,
            'updated_at'  => $user->updated_at,

            'permissions' => $permissions,
        ];

        if ($user->venueOwner) {
            $responseData['venue_name']    = $user->venueOwner->venue_name ?? null;
            $responseData['venue_address'] = $user->venueOwner->address ?? null;
            $responseData['description']   = $user->venueOwner->description ?? null;
            $responseData['rating']        = $user->venueOwner->rating ?? null;
        }

        return response()->json([
            'success' => true,
            'data'    => $responseData,
        ]);
    }

    /**
     * PUT /user/profile
     */
    public function updateProfile(UpdateUserProfileRequest $request)
    {
        /** @var User|null $user */
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        $data = $request->validated();

        // هل الإيميل اتغير؟
        $emailChanged = array_key_exists('email', $data)
            && Str::lower((string) $data['email']) !== Str::lower((string) $user->email);

        try {
            DB::transaction(function () use ($user, $data, $emailChanged) {

                // تحديث بيانات المستخدم الأساسية فقط
                $userFields = array_intersect_key($data, array_flip([
                    'first_name',
                    'last_name',
                    'email',
                    'phone',
                    'area_id',
                    'avatar_url',
                    'two_factor_auth',
                    'notification_email',
                    'notification_sms',
                ]));

                if ($emailChanged) {
                    // ✅ أمان: لما الإيميل يتغير لازم يتعمل verify من جديد
                    $userFields['email_verified_at'] = null;
                    $userFields['email_verification_token'] = Str::random(60);
                }

                if (!empty($userFields)) {
                    $user->update($userFields);
                }

                // Dealer users don't need a separate record
                // type='dealer' is sufficient for authorization checks

                // Venue Owner
                if (method_exists($user, 'isVenueOwner') && $user->isVenueOwner()) {
                    $venueData = array_intersect_key($data, array_flip([
                        'venue_name',
                        'venue_address',
                        'description'
                    ]));

                    if (!empty($venueData)) {
                        if ($user->venueOwner) {
                            $user->venueOwner->update([
                                'venue_name' => $venueData['venue_name'] ?? $user->venueOwner->venue_name,
                                'address'    => $venueData['venue_address'] ?? $user->venueOwner->address,
                                'description' => $venueData['description'] ?? $user->venueOwner->description,
                            ]);
                        } else {
                            $user->venueOwner()->create([
                                'venue_name' => $venueData['venue_name'] ?? null,
                                'address'    => $venueData['venue_address'] ?? null,
                                'description' => $venueData['description'] ?? null,
                            ]);
                        }
                    }
                }
            });

            // لو الإيميل اتغير: نبعت verify
            if ($emailChanged) {
                $this->sendVerificationEmail($user->refresh());
            }

            $user->refresh()->load(['venueOwner']);

            $responseData = [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'type' => $this->enumValue($user->type),
                'kyc_status' => $user->kyc_status,
                'area_id' => $user->area_id,
                'organization_id' => $user->organization_id,
                'avatar_url' => $user->avatar_url,
                'two_factor_auth' => (bool) ($user->two_factor_auth ?? false),
                'notification_email' => (bool) ($user->notification_email ?? true),
                'notification_sms' => (bool) ($user->notification_sms ?? false),
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ];

            if ($user->venueOwner) {
                $responseData['venue_name'] = $user->venueOwner->venue_name ?? null;
                $responseData['venue_address'] = $user->venueOwner->address ?? null;
                $responseData['description'] = $user->venueOwner->description ?? null;
                $responseData['rating'] = $user->venueOwner->rating ?? null;
            }

            return response()->json([
                'success' => true,
                'message' => $emailChanged
                    ? 'تم تحديث الملف الشخصي. تم إرسال رسالة لتأكيد البريد الجديد.'
                    : 'تم تحديث الملف الشخصي بنجاح',
                'data' => $responseData,
            ]);
        } catch (\Throwable $e) {
            Log::error('Error updating user profile', [
                'message' => $e->getMessage(),
                'user_id' => $user->id,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'فشل تحديث الملف الشخصي، حاول مرة أخرى لاحقاً.',
            ], 500);
        }
    }

    /**
     * PUT /user/password
     */
    public function updatePassword(Request $request)
    {
        /** @var User|null $user */
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'two_factor_auth' => ['sometimes', 'boolean'],
        ]);

        try {
            $passwordColumn = $this->resolvePasswordColumn();
            $storedHash = (string) ($user->{$passwordColumn} ?? '');

            if ($storedHash === '' || !Hash::check((string) $validated['current_password'], $storedHash)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current password is incorrect',
                ], 422);
            }

            $hashed = Hash::make((string) $validated['password']);

            $update = [$passwordColumn => $hashed];
            if ($passwordColumn === 'password_hash' && Schema::hasColumn('users', 'password')) {
                $update['password'] = $hashed;
            }
            if ($passwordColumn === 'password' && Schema::hasColumn('users', 'password_hash')) {
                $update['password_hash'] = $hashed;
            }

            if (array_key_exists('two_factor_auth', $validated)) {
                $update['two_factor_auth'] = (bool) $validated['two_factor_auth'];
            }

            $user->update($update);

            return response()->json([
                'success' => true,
                'message' => 'Password updated successfully',
                'data' => [
                    'two_factor_auth' => (bool) ($user->fresh()->two_factor_auth ?? false),
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Error updating password', [
                'message' => $e->getMessage(),
                'user_id' => $user->id,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update password',
            ], 500);
        }
    }

    /**
     * PUT /user/security-settings
     */
    public function updateSecuritySettings(Request $request)
    {
        /** @var User|null $user */
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        $validated = $request->validate([
            'two_factor_auth' => ['required', 'boolean'],
        ]);

        $user->update([
            'two_factor_auth' => (bool) $validated['two_factor_auth'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Security settings updated successfully',
            'data' => [
                'two_factor_auth' => (bool) $user->fresh()->two_factor_auth,
            ],
        ]);
    }

    /**
     * PUT /user/notification-settings
     */
    public function updateNotificationSettings(Request $request)
    {
        /** @var User|null $user */
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        $validated = $request->validate([
            'notification_email' => ['required', 'boolean'],
            'notification_sms' => ['required', 'boolean'],
        ]);

        $user->update([
            'notification_email' => (bool) $validated['notification_email'],
            'notification_sms' => (bool) $validated['notification_sms'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Notification settings updated successfully',
            'data' => [
                'notification_email' => (bool) $user->fresh()->notification_email,
                'notification_sms' => (bool) $user->notification_sms,
            ],
        ]);
    }

    /**
     * GET /user/permissions
     */
    public function getPermissions()
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 401);
        }

        return response()->json([
            'status' => 'success',
            'permissions' => $this->safePermissions($user),
        ]);
    }

    // =========================
    // Helpers
    // =========================

    private function safePermissions(User $user): array
    {
        try {
            // لو عندك نظام Teams في spatie وبتستخدم organization_id
            if ($user->organization_id) {
                try {
                    app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($user->organization_id);
                } catch (\Throwable $e) {
                    // ignore
                }
            }

            if (method_exists($user, 'getAllPermissions')) {
                return $user->getAllPermissions()->pluck('name')->values()->toArray();
            }
        } catch (\Throwable $e) {
            // ignore
        }

        return [];
    }

    private function enumValue($value)
    {
        if ($value instanceof \BackedEnum) {
            return $value->value;
        }
        return $value;
    }

    private function resolvePasswordColumn(): string
    {
        if (Schema::hasColumn('users', 'password_hash')) {
            return 'password_hash';
        }
        if (Schema::hasColumn('users', 'password')) {
            return 'password';
        }
        throw new \RuntimeException('No password column found on users table.');
    }

    private function sendVerificationEmail(User $user): void
    {
        try {
            if (!$user->email_verification_token) {
                $user->email_verification_token = Str::random(60);
                $user->save();
            }

            $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
            $verificationUrl = $frontendUrl . '/verify-email?token=' . $user->email_verification_token;

            // ✅ ما نطبعش التوكن في اللوج
            Log::info('Preparing verification email (profile update)', [
                'user_id' => $user->id,
                'email' => $user->email,
                'token_len' => strlen((string) $user->email_verification_token),
            ]);

            $user->notify(new VerifyEmailNotification($verificationUrl));
        } catch (\Throwable $e) {
            Log::error('Failed to send verification email (profile update)', [
                'user_id' => $user->id,
                'email' => $user->email,
                'message' => $e->getMessage(),
            ]);
        }
    }
}

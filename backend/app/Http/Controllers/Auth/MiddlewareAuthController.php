<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Carbon\Carbon;
use App\Models\User;
use App\Enums\UserStatus;
use Illuminate\Support\Facades\RateLimiter;

class MiddlewareAuthController extends Controller
{
    public function getUserRole(Request $request)
    {
        // ✅ Rate limit خفيف عشان منع abuse loops
        $rl = 'mw_role:' . sha1((string)$request->ip());
        if (RateLimiter::tooManyAttempts($rl, 240)) {
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
            return response()->json(['message' => 'Refresh token expired'], 401)
                ->withCookie($this->forgetRefreshCookie());
        }

        $user = $dbToken->tokenable;

        if (!$user || !($user instanceof User)) {
            return response()->json(['message' => 'User not found'], 401)
                ->withCookie($this->forgetRefreshCookie());
        }

        if (!$user->hasVerifiedEmail() || $user->status !== UserStatus::ACTIVE) {
            return response()->json(['message' => 'Account not active'], 403)
                ->withCookie($this->forgetRefreshCookie());
        }

        return response()->json([
            'id' => $user->id,
            'type' => $user->type,
        ]);
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
}

<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Carbon\Carbon;
use App\Models\User;

class MiddlewareAuthController extends Controller
{
    /**
     * Get the authenticated user's role using the refresh token.
     * This is used by the Next.js Middleware to determine redirects.
     */
    public function getUserRole(Request $request)
    {
        // 1. Get Refresh Token from Cookie
        $refreshToken = $request->cookie('refresh_token');

        if (!$refreshToken) {
            return response()->json([
                'status' => 'error',
                'message' => 'No refresh token provided',
            ], 401);
        }

        // 2. Find the token in the database
        $tokenParts = explode('|', $refreshToken);
        if (count($tokenParts) !== 2) {
            return response()->json(['message' => 'Invalid token format'], 401);
        }

        $tokenId = $tokenParts[0];
        $tokenValue = $tokenParts[1];

        $dbToken = PersonalAccessToken::find($tokenId);

        if (!$dbToken) {
            return response()->json(['message' => 'Invalid refresh token'], 401);
        }

        // 3. Validate Token (Hash check & Expiry)
        if (!hash_equals($dbToken->token, hash('sha256', $tokenValue))) {
            return response()->json(['message' => 'Invalid refresh token'], 401);
        }

        if ($dbToken->expires_at && Carbon::parse($dbToken->expires_at)->isPast()) {
            // We don't delete it here, let the main refresh flow handle rotation/deletion
            return response()->json(['message' => 'Refresh token expired'], 401);
        }

        // 4. Get User
        $user = $dbToken->tokenable;

        if (!$user) {
            return response()->json(['message' => 'User not found'], 401);
        }

        // 5. Return minimal user info
        return response()->json([
            'id' => $user->id,
            'role' => $user->role,
        ]);
    }
}

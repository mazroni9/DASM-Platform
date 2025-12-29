<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (!Auth::check()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. Authentication required.'
            ], 401);
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user->isAdmin() && !$user->isModerator()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Access denied. Admin privileges required.'
            ], 403);
        }

        return $next($request);
    }
}

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DealerMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. Authentication required.'
            ], 401);
        }

        // Check if the authenticated user is a dealer
        if (!Auth::user()->dealer_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Access denied. Dealer account required.'
            ], 403);
        }

        return $next($request);
    }
}
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SetSpatieTeamContext
{
    public function handle(Request $request, Closure $next)
    {
        if (Auth::check()) {
            $user = Auth::user();

            if (!empty($user->organization_id)) {
                setPermissionsTeamId($user->organization_id);
            }
        }
        
        return $next($request);
    }
}
<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user || ! ($user->type === UserRole::SUPER_ADMIN || $user->type === 'super_admin')) {
            return response()->json([
                'status' => 'error',
                'message' => 'هذا الإجراء متاح لمدير النظام الرئيسي فقط',
            ], 403);
        }

        return $next($request);
    }
}

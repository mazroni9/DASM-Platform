<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureAdminOrSuperAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // 1) Spatie roles لو موجودة
        try {
            if (method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['super_admin', 'admin'])) {
                return $next($request);
            }

            if (method_exists($user, 'getRoleNames')) {
                $roles = $user->getRoleNames()->map(fn ($r) => strtolower(trim((string)$r)))->all();
                if (!empty(array_intersect($roles, ['super_admin', 'admin']))) {
                    return $next($request);
                }
            }
        } catch (\Throwable $e) {
            // ignore
        }

        // 2) type/role fields (string أو Enum)
        $candidates = [
            $user->type ?? null,
            $user->role ?? null,
            $user->user_type ?? null,
            $user->user_role ?? null,
        ];

        foreach ($candidates as $v) {
            $val = '';

            if ($v instanceof \BackedEnum) {
                $val = (string)$v->value;
            } elseif (is_object($v) && property_exists($v, 'value')) {
                $val = (string)$v->value;
            } elseif (is_string($v)) {
                $val = $v;
            }

            $val = strtolower(trim($val));
            $val = str_replace([' ', '-'], '_', $val);

            if (in_array($val, ['super_admin', 'admin'], true)) {
                return $next($request);
            }
        }

        return response()->json(['message' => 'Forbidden.'], 403);
    }
}

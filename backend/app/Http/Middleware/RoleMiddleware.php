<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    /**
     * Usage on routes:
     *   ->middleware('role:venue_owner,dealer')
     *   ->middleware('role:venue_owner|dealer')
     *   ->middleware('role:admin,venue_owner,dealer')
     *
     * - Supports multiple role parameters and comma/pipe separated lists.
     * - Works whether $user->role is a string or a PHP 8.1 BackedEnum.
     * - Admin bypass is enabled (admin always allowed).
     */
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Flatten roles: support "a,b", "a|b", and multiple params
        $flat = [];
        foreach ($roles as $r) {
            if (!is_string($r)) continue;
            foreach (preg_split('/[,\|]/', $r) as $piece) {
                $piece = strtolower(trim($piece));
                if ($piece !== '') $flat[] = $piece;
            }
        }
        $allowed = array_values(array_unique($flat)); // final allowed roles (lowercased)

        // Resolve user's role (string or BackedEnum)
        $userRole = $user->role;
        if ($userRole instanceof \BackedEnum) {
            $userRole = $userRole->value;
        }
        $userRole = strtolower(trim((string) $userRole));

        // Optional: bypass for admin
        if ($userRole === 'admin') {
            return $next($request);
        }

        // If no specific roles passed, allow
        if (empty($allowed)) {
            return $next($request);
        }

        // If role is missing, or not in allowed list -> 403
        if ($userRole === '' || !in_array($userRole, $allowed, true)) {
            return response()->json([
                'message'       => 'Forbidden.',
                'reason'        => $userRole === '' ? 'User has no role assigned.' : 'Role not allowed for this route.',
                'your_role'     => $userRole,
                'allowed_roles' => $allowed,
            ], 403);
        }

        return $next($request);
    }
}

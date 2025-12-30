<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        $type = $user->type ?? null;

        $value = '';
        if ($type instanceof \BackedEnum) {
            $value = (string)$type->value;
        } elseif (is_string($type)) {
            $value = $type;
        } elseif (is_object($type) && property_exists($type, 'value')) {
            $value = (string)$type->value;
        }

        $value = strtolower(trim($value));

        if ($value === 'super_admin') {
            return $next($request);
        }

        abort(403, 'Super Admin only');
    }
}

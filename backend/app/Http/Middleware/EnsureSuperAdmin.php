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

        if ($type instanceof \BackedEnum) {
            $typeValue = (string) $type->value;
        } elseif (is_object($type) && property_exists($type, 'value')) {
            $typeValue = (string) $type->value;
        } elseif (is_string($type)) {
            $typeValue = $type;
        } else {
            $typeValue = '';
        }

        $typeValue = strtolower(trim($typeValue));

        if ($typeValue === 'super_admin') {
            return $next($request);
        }

        abort(403, 'Super Admin only');
    }
}

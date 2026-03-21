<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use App\Models\ApprovalGroupMember;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Allows super_admin OR staff approval-group reviewers (active + can_review_requests).
 * Non-staff users are denied even if wrongly present in approval_group_members.
 */
class ApprovalQueueAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! auth()->check()) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        /** @var User $user */
        $user = auth()->user();

        if ($user->type === UserRole::SUPER_ADMIN || $user->type === 'super_admin') {
            return $next($request);
        }

        if (! UserRole::isApprovalGroupEligibleType($user->type)) {
            return response()->json([
                'status' => 'error',
                'message' => 'غير مصرح بالوصول لطابور الموافقات',
            ], 403);
        }

        $allowed = ApprovalGroupMember::query()
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->where('can_review_requests', true)
            ->exists();

        if ($allowed) {
            return $next($request);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'غير مصرح بالوصول لطابور الموافقات',
        ], 403);
    }
}

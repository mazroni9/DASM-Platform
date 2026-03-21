<?php

namespace App\Http\Middleware;

use App\Models\ApprovalGroupMember;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * الوصول للطابور: فقط admin/super_admin (User::isAdmin) أو عضو نشط في approval_group_members
 * مع can_review_requests. لا يكفي نوع مستخدم (مشرف/مبرمج) دون صف عضوية فعلي.
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

        if ($user->isAdmin()) {
            return $next($request);
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

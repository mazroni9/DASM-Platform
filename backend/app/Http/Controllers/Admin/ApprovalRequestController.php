<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\ApprovalGroupMember;
use App\Models\ApprovalRequest;
use App\Services\ApprovalRequestWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApprovalRequestController extends Controller
{
    public function __construct(
        private readonly ApprovalRequestWorkflowService $workflow
    ) {
    }

    public function capabilities(Request $request): JsonResponse
    {
        $user = $request->user();
        $isSuper = $user->type === UserRole::SUPER_ADMIN || $user->type === 'super_admin';

        $m = ApprovalGroupMember::query()
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        $isStaff = $user->isAdmin() || $user->isModerator() || $user->isProgrammer();

        $canAccessQueue = $isSuper
            || $isStaff
            || ($m && $m->can_review_requests);

        return response()->json([
            'status' => 'success',
            'data' => [
                'can_manage_group' => $isSuper,
                'can_access_queue' => $canAccessQueue,
                'can_approve_business' => $isSuper || ($m && $m->can_approve_business_accounts),
                'can_approve_council' => $isSuper || ($m && $m->can_approve_council_requests),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->authorizeQueueAccess($user);

        $q = ApprovalRequest::query()
            ->with([
                'targetUser:id,first_name,last_name,email,type',
                'submittedBy:id,first_name,last_name,email',
                'reviewedBy:id,first_name,last_name,email',
            ])
            ->orderByDesc('id');

        if ($request->filled('status')) {
            $q->where('status', $request->status);
        }
        if ($request->filled('request_type')) {
            $q->where('request_type', $request->request_type);
        }

        $perPage = min(100, max(5, (int) $request->get('per_page', 25)));

        return response()->json([
            'status' => 'success',
            'data' => $q->paginate($perPage),
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $this->authorizeQueueAccess($user);

        $row = ApprovalRequest::query()
            ->with([
                'targetUser:id,first_name,last_name,email,type,status,is_active',
                'submittedBy:id,first_name,last_name,email',
                'reviewedBy:id,first_name,last_name,email',
            ])
            ->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $row,
        ]);
    }

    public function approve(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $row = ApprovalRequest::findOrFail($id);
        $isSuper = $user->type === UserRole::SUPER_ADMIN || $user->type === 'super_admin';

        try {
            $this->workflow->approve($user, $row, $isSuper);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 403);
        } catch (\Throwable $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'تمت الموافقة',
            'data' => $row->fresh(['targetUser', 'reviewedBy']),
        ]);
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'notes' => 'nullable|string|max:5000',
        ]);

        $user = $request->user();
        $row = ApprovalRequest::findOrFail($id);
        $isSuper = $user->type === UserRole::SUPER_ADMIN || $user->type === 'super_admin';

        try {
            $this->workflow->reject($user, $row, $request->notes, $isSuper);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 403);
        } catch (\Throwable $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'تم الرفض',
            'data' => $row->fresh(['targetUser', 'reviewedBy']),
        ]);
    }

    private function authorizeQueueAccess($user): void
    {
        $isSuper = $user->type === UserRole::SUPER_ADMIN || $user->type === 'super_admin';
        if ($isSuper) {
            return;
        }

        if ($user->isAdmin() || $user->isModerator() || $user->isProgrammer()) {
            return;
        }

        $m = ApprovalGroupMember::query()
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        if (! $m || ! $m->can_review_requests) {
            abort(403, 'غير مصرح بعرض طابور الموافقات');
        }
    }
}

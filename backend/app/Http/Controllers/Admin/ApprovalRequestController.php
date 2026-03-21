<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\ApprovalGroupMember;
use App\Models\ApprovalRequest;
use App\Models\ApprovalRequestLog;
use App\Models\User;
use App\Services\ApprovalRequestAuditService;
use App\Services\ApprovalRequestWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApprovalRequestController extends Controller
{
    public function __construct(
        private readonly ApprovalRequestWorkflowService $workflow,
        private readonly ApprovalRequestAuditService $audit
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

        $staffEligible = UserRole::isApprovalGroupEligibleType($user->type);

        $canAccessQueue = $isSuper || ($staffEligible && $m && $m->can_review_requests);

        return response()->json([
            'status' => 'success',
            'data' => [
                'can_manage_group' => $isSuper,
                'can_access_queue' => $canAccessQueue,
                'can_approve_business' => $isSuper || ($staffEligible && $m && $m->can_approve_business_accounts),
                'can_approve_council' => $isSuper || ($staffEligible && $m && $m->can_approve_council_requests),
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

        $paginator = $q->paginate($perPage)->through(function (ApprovalRequest $row) {
            return array_merge($row->toArray(), $this->resolutionFields($row));
        });

        return response()->json([
            'status' => 'success',
            'data' => $paginator,
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

        $this->audit->logRequestOpenedIfFirst($row, $user->id);
        $this->audit->logRequestViewed($row, $user->id);

        $data = array_merge($row->toArray(), $this->resolutionFields($row));
        $data['logs'] = ApprovalRequestLog::query()
            ->where('approval_request_id', $row->id)
            ->with([
                'actor:id,first_name,last_name,email',
                'recipient:id,first_name,last_name,email',
            ])
            ->orderBy('id')
            ->limit(500)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $data,
        ]);
    }

    public function logs(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $this->authorizeQueueAccess($user);

        ApprovalRequest::query()->findOrFail($id);

        $logs = ApprovalRequestLog::query()
            ->where('approval_request_id', $id)
            ->with([
                'actor:id,first_name,last_name,email',
                'recipient:id,first_name,last_name,email',
            ])
            ->orderBy('id')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $logs,
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

        $fresh = $row->fresh(['targetUser', 'reviewedBy']);

        return response()->json([
            'status' => 'success',
            'message' => 'تمت الموافقة',
            'data' => array_merge($fresh->toArray(), $this->resolutionFields($fresh)),
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

        $fresh = $row->fresh(['targetUser', 'reviewedBy']);

        return response()->json([
            'status' => 'success',
            'message' => 'تم الرفض',
            'data' => array_merge($fresh->toArray(), $this->resolutionFields($fresh)),
        ]);
    }

    private function authorizeQueueAccess(User $user): void
    {
        $isSuper = $user->type === UserRole::SUPER_ADMIN || $user->type === 'super_admin';
        if ($isSuper) {
            return;
        }

        if (! UserRole::isApprovalGroupEligibleType($user->type)) {
            abort(403, 'غير مصرح بعرض طابور الموافقات');
        }

        $m = ApprovalGroupMember::query()
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        if (! $m || ! $m->can_review_requests) {
            abort(403, 'غير مصرح بعرض طابور الموافقات');
        }
    }

    /** @return array{resolution_seconds: int|null, resolution_duration_human: string|null} */
    private function resolutionFields(ApprovalRequest $r): array
    {
        $seconds = null;
        if ($r->reviewed_at && $r->created_at) {
            $seconds = max(0, $r->created_at->diffInSeconds($r->reviewed_at));
        }

        return [
            'resolution_seconds' => $seconds,
            'resolution_duration_human' => $seconds !== null ? $this->formatDurationArabic($seconds) : null,
        ];
    }

    private function formatDurationArabic(int $seconds): string
    {
        if ($seconds < 60) {
            return $seconds . ' ثانية';
        }
        $minutes = intdiv($seconds, 60);
        if ($seconds < 3600) {
            $rem = $seconds % 60;

            return $rem > 0 ? "{$minutes} دقيقة و {$rem} ثانية" : "{$minutes} دقيقة";
        }
        $hours = intdiv($seconds, 3600);
        $rem = $seconds % 3600;
        $mins = intdiv($rem, 60);

        return $mins > 0 ? "{$hours} ساعة و {$mins} دقيقة" : "{$hours} ساعة";
    }
}

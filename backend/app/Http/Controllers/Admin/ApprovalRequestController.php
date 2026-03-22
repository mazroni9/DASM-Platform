<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ApprovalGroupMember;
use App\Models\ApprovalRequest;
use App\Models\ApprovalRequestLog;
use App\Models\User;
use App\Services\ApprovalRequestAuditService;
use App\Services\ApprovalRequestWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

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

        $memberRow = ApprovalGroupMember::query()
            ->where('user_id', $user->id)
            ->first();

        $isApprovalGroupMember = $memberRow !== null;
        $approvalMemberActive = $memberRow !== null
            && $memberRow->is_active
            && $memberRow->can_review_requests;

        $privileged = $user->isAdmin();

        $canAccessQueue = $privileged || $approvalMemberActive;

        $canApproveBusiness = $privileged
            || ($approvalMemberActive && $memberRow->can_approve_business_accounts);
        $canApproveCouncil = $privileged
            || ($approvalMemberActive && $memberRow->can_approve_council_requests);

        return response()->json([
            'status' => 'success',
            'data' => [
                'can_access_queue' => $canAccessQueue,
                'can_manage_group' => $privileged,
                'can_approve_business_accounts' => $canApproveBusiness,
                'can_approve_council_requests' => $canApproveCouncil,
                'is_approval_group_member' => $isApprovalGroupMember,
                'approval_member_active' => $approvalMemberActive,
                'can_approve_business' => $canApproveBusiness,
                'can_approve_council' => $canApproveCouncil,
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
                'submittedBy:id,first_name,last_name,email,type',
                'reviewedBy:id,first_name,last_name,email,type',
            ])
            ->findOrFail($id);

        $this->audit->logRequestOpenedIfFirst($row, $user->id);
        $this->audit->logRequestViewed($row, $user->id);

        $privileged = $user->isAdmin();
        $logCount = ApprovalRequestLog::query()
            ->where('approval_request_id', $row->id)
            ->count();

        $logs = ApprovalRequestLog::query()
            ->where('approval_request_id', $row->id)
            ->with([
                'actor:id,first_name,last_name,email,type',
                'recipient:id,first_name,last_name,email,type',
            ])
            ->orderByDesc('id')
            ->limit(100)
            ->get()
            ->sortBy('id')
            ->values();

        $data = array_merge($row->toArray(), $this->resolutionFields($row));

        $data['audit_summary'] = [
            'log_count' => $logCount,
            'logs_included' => $logs->count(),
            'logs_truncated' => $logCount > $logs->count(),
        ];

        $data['decision'] = $this->workflow->decisionFlagsForViewer($user, $row, $privileged);

        $data['target_user_summary'] = $row->targetUser ? [
            'id' => $row->targetUser->id,
            'name' => trim(($row->targetUser->first_name ?? '') . ' ' . ($row->targetUser->last_name ?? '')),
            'email' => $row->targetUser->email,
            'type' => $row->targetUser->type instanceof \BackedEnum ? $row->targetUser->type->value : (string) $row->targetUser->type,
            'is_active' => (bool) $row->targetUser->is_active,
            'status' => $row->targetUser->status instanceof \BackedEnum ? $row->targetUser->status->value : (string) $row->targetUser->status,
        ] : null;

        $data['logs'] = $logs;

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
                'actor:id,first_name,last_name,email,type',
                'recipient:id,first_name,last_name,email,type',
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
        $privileged = $user->isAdmin();
        $decisionSource = $this->sanitizeDecisionSource($request);

        try {
            $result = $this->workflow->approve($user, $row, $privileged, $decisionSource);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 403);
        } catch (ConflictHttpException $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 409);
        } catch (\Throwable $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }

        /** @var ApprovalRequest $fresh */
        $fresh = $result['request'];
        $idempotent = $result['idempotent'];

        return response()->json([
            'status' => 'success',
            'message' => $idempotent ? 'الطلب معتمد مسبقاً' : 'تمت الموافقة',
            'idempotent' => $idempotent,
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
        $privileged = $user->isAdmin();
        $decisionSource = $this->sanitizeDecisionSource($request);

        try {
            $result = $this->workflow->reject($user, $row, $request->notes, $privileged, $decisionSource);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 403);
        } catch (ConflictHttpException $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 409);
        } catch (\Throwable $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }

        /** @var ApprovalRequest $fresh */
        $fresh = $result['request'];
        $idempotent = $result['idempotent'];

        return response()->json([
            'status' => 'success',
            'message' => $idempotent ? 'الطلب مرفوض مسبقاً' : 'تم الرفض',
            'idempotent' => $idempotent,
            'data' => array_merge($fresh->toArray(), $this->resolutionFields($fresh)),
        ]);
    }

    private function sanitizeDecisionSource(Request $request): string
    {
        $raw = (string) $request->header('X-Decision-Source', 'dasm_api');

        return preg_match('/^[a-z0-9._-]{1,64}$/i', $raw) ? strtolower($raw) : 'dasm_api';
    }

    private function authorizeQueueAccess(User $user): void
    {
        if ($user->isAdmin()) {
            return;
        }

        $allowed = ApprovalGroupMember::query()
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->where('can_review_requests', true)
            ->exists();

        if (! $allowed) {
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

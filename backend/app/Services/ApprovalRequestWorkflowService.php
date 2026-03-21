<?php

namespace App\Services;

use App\Enums\OrganizationType;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ApprovalGroupMember;
use App\Models\ApprovalRequest;
use App\Models\Investor;
use App\Models\Organization;
use App\Models\User;
use App\Models\VenueOwner;
use App\Notifications\ApprovalRequestCreatedNotification;
use App\Notifications\ApprovalRequestResolvedNotification;
use App\Support\CouncilStudioBundle;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class ApprovalRequestWorkflowService
{
    public function __construct(
        private readonly PermissionRegistrar $registrar,
        private readonly ApprovalRequestAuditService $audit
    ) {
    }

    public function notifyActiveGroupMembers(ApprovalRequest $request): void
    {
        $q = ApprovalGroupMember::activeMembersQuery()->with('user');

        if ($request->request_type === ApprovalRequest::TYPE_BUSINESS_ACCOUNT) {
            $q->where('can_approve_business_accounts', true);
        } elseif ($request->request_type === ApprovalRequest::TYPE_COUNCIL_PERMISSION) {
            $q->where('can_approve_council_requests', true);
        }

        $members = $q->get()
            ->pluck('user')
            ->filter(fn (?User $u) => $u && $u->email);

        if ($members->isEmpty()) {
            Log::warning('Approval request created but no active approval-group members to notify', [
                'request_id' => $request->id,
            ]);

            return;
        }

        $notification = new ApprovalRequestCreatedNotification($request);

        foreach ($members as $member) {
            $channels = $notification->via($member);
            $this->audit->logNotificationChannels($request, $member, $channels);
            $member->notify($notification);
        }
    }

    /**
     * After email verification for business accounts: create queue row + notify group (replaces admin-only fan-out).
     */
    public function createBusinessAccountRequestAfterEmailVerification(User $user): ?ApprovalRequest
    {
        $type = $user->type instanceof UserRole ? $user->type->value : (string) $user->type;
        if (! in_array($type, ['dealer', 'venue_owner', 'investor'], true)) {
            return null;
        }

        $exists = ApprovalRequest::query()
            ->where('request_type', ApprovalRequest::TYPE_BUSINESS_ACCOUNT)
            ->where('target_user_id', $user->id)
            ->where('status', ApprovalRequest::STATUS_PENDING)
            ->exists();

        if ($exists) {
            return null;
        }

        $user->loadMissing(['venueOwner', 'investor']);

        $payload = [
            'account_type' => $type,
        ];

        if ($user->venueOwner) {
            $payload['commercial_registry'] = $user->venueOwner->commercial_registry;
            $payload['company_or_venue_name'] = $user->venueOwner->venue_name;
        }
        if ($user->investor) {
            $payload['commercial_registry'] = $user->investor->commercial_registry;
            $payload['company_or_venue_name'] = $user->investor->company_name;
        }

        $request = ApprovalRequest::create([
            'request_type' => ApprovalRequest::TYPE_BUSINESS_ACCOUNT,
            'target_user_id' => $user->id,
            'submitted_by_user_id' => null,
            'status' => ApprovalRequest::STATUS_PENDING,
            'payload' => $payload,
        ]);

        $request->refresh();
        $this->audit->logRequestCreated($request, null, [
            'source' => 'email_verification',
            'target_user_id' => $user->id,
        ]);

        $this->notifyActiveGroupMembers($request->fresh(['targetUser']));

        return $request;
    }

    public function createCouncilPermissionRequest(User $requester, string $bundle): ApprovalRequest
    {
        if (! in_array($bundle, CouncilStudioBundle::validBundles(), true)) {
            throw new \InvalidArgumentException('Invalid council bundle');
        }

        $names = CouncilStudioBundle::permissionNames($bundle);
        if ($names === []) {
            throw new \InvalidArgumentException('Invalid council bundle');
        }

        $dup = ApprovalRequest::query()
            ->where('request_type', ApprovalRequest::TYPE_COUNCIL_PERMISSION)
            ->where('target_user_id', $requester->id)
            ->where('status', ApprovalRequest::STATUS_PENDING)
            ->get()
            ->first(function (ApprovalRequest $r) use ($bundle) {
                return ($r->payload['bundle'] ?? '') === $bundle;
            });

        if ($dup) {
            return $dup;
        }

        $request = ApprovalRequest::create([
            'request_type' => ApprovalRequest::TYPE_COUNCIL_PERMISSION,
            'target_user_id' => $requester->id,
            'submitted_by_user_id' => $requester->id,
            'status' => ApprovalRequest::STATUS_PENDING,
            'payload' => ['bundle' => $bundle, 'permission_names' => $names],
        ]);

        $request->refresh();
        $this->audit->logRequestCreated($request, $requester->id, [
            'bundle' => $bundle,
        ]);

        $this->notifyActiveGroupMembers($request->fresh(['targetUser', 'submittedBy']));

        return $request;
    }

    public function approve(User $reviewer, ApprovalRequest $request, bool $isPrivilegedReviewer): void
    {
        $this->assertCanDecide($reviewer, $request, $isPrivilegedReviewer);

        DB::transaction(function () use ($reviewer, $request) {
            $request->update([
                'status' => ApprovalRequest::STATUS_APPROVED,
                'reviewed_by_user_id' => $reviewer->id,
                'reviewed_at' => now(),
            ]);

            if ($request->request_type === ApprovalRequest::TYPE_BUSINESS_ACCOUNT) {
                $this->applyBusinessAccountApproval($request->targetUser);
            } elseif ($request->request_type === ApprovalRequest::TYPE_COUNCIL_PERMISSION) {
                $this->applyCouncilBundlePermissions($request->targetUser, $request->payload ?? []);
            }

            $this->audit->logApproved($request, $reviewer->id);

            $request->targetUser?->notify(new ApprovalRequestResolvedNotification($request, true));
        });
    }

    public function reject(User $reviewer, ApprovalRequest $request, ?string $notes, bool $isPrivilegedReviewer): void
    {
        $this->assertCanDecide($reviewer, $request, $isPrivilegedReviewer);

        DB::transaction(function () use ($reviewer, $request, $notes) {
            $request->update([
                'status' => ApprovalRequest::STATUS_REJECTED,
                'reviewed_by_user_id' => $reviewer->id,
                'reviewed_at' => now(),
                'notes' => $notes,
            ]);

            if ($request->request_type === ApprovalRequest::TYPE_BUSINESS_ACCOUNT) {
                $this->applyBusinessAccountRejection($request->targetUser);
            }

            $this->audit->logRejected($request, $reviewer->id, $notes);

            $request->targetUser?->notify(new ApprovalRequestResolvedNotification($request, false));
        });
    }

    private function assertCanDecide(User $reviewer, ApprovalRequest $request, bool $isPrivilegedReviewer): void
    {
        if ($request->status !== ApprovalRequest::STATUS_PENDING) {
            throw new \RuntimeException('Request is not pending');
        }

        // super_admin أو admin: قرار كامل دون اشتراط صف عضوية المجموعة
        if ($isPrivilegedReviewer) {
            return;
        }

        if (! UserRole::isApprovalGroupEligibleType($reviewer->type)) {
            throw new \Illuminate\Auth\Access\AuthorizationException('غير مصرح بمراجعة الطلبات');
        }

        $m = ApprovalGroupMember::query()
            ->where('user_id', $reviewer->id)
            ->where('is_active', true)
            ->first();

        if (! $m || ! $m->can_review_requests) {
            throw new \Illuminate\Auth\Access\AuthorizationException('غير مصرح بمراجعة الطلبات');
        }

        if ($request->request_type === ApprovalRequest::TYPE_BUSINESS_ACCOUNT) {
            if (! $m->can_approve_business_accounts) {
                throw new \Illuminate\Auth\Access\AuthorizationException('غير مصرح بإجراءات الحسابات التجارية');
            }

            return;
        }

        if ($request->request_type === ApprovalRequest::TYPE_COUNCIL_PERMISSION) {
            if (! $m->can_approve_council_requests) {
                throw new \Illuminate\Auth\Access\AuthorizationException('غير مصرح بإجراءات طلبات مجلس السوق');
            }

            return;
        }

        throw new \Illuminate\Auth\Access\AuthorizationException('نوع الطلب غير مدعوم لهذه المراجعة');
    }

    private function applyBusinessAccountApproval(User $user): void
    {
        $user->is_active = true;
        $user->status = UserStatus::ACTIVE;
        if (Schema::hasColumn($user->getTable(), 'approval_status')) {
            $user->approval_status = 'approved';
        }
        $user->save();

        $type = $user->type instanceof UserRole ? $user->type->value : (string) $user->type;

        if ($type === 'venue_owner') {
            VenueOwner::query()->where('user_id', $user->id)->update([
                'status' => 'active',
                'is_active' => true,
            ]);
        }

        if ($type === 'investor') {
            Investor::query()->where('user_id', $user->id)->update([
                'status' => 'active',
                'is_active' => true,
            ]);
        }
    }

    private function applyBusinessAccountRejection(User $user): void
    {
        $user->is_active = false;
        $user->status = UserStatus::REJECTED;
        if (Schema::hasColumn($user->getTable(), 'approval_status')) {
            $user->approval_status = 'rejected';
        }
        $user->save();
    }

    private function applyCouncilBundlePermissions(User $user, array $payload): void
    {
        $names = $payload['permission_names'] ?? CouncilStudioBundle::permissionNames($payload['bundle'] ?? '');
        if ($names === []) {
            return;
        }

        $platformOrg = Organization::query()->where('type', OrganizationType::PLATFORM)->first();
        if (! $platformOrg) {
            throw new \RuntimeException('منظمة المنصة غير معرّفة');
        }

        $teamId = $user->organization_id ?? $platformOrg->id;
        $this->registrar->setPermissionsTeamId($teamId);

        $valid = Permission::query()
            ->whereIn('name', $names)
            ->where('name', 'like', 'council.%')
            ->pluck('name')
            ->all();

        foreach ($valid as $name) {
            if (! $user->hasPermissionTo($name)) {
                $user->givePermissionTo($name);
            }
        }
    }
}

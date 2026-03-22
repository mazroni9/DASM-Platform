<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\ApprovalRequest;
use App\Models\ApprovalRequestLog;
use App\Models\User;
use NotificationChannels\Fcm\FcmChannel;

class ApprovalRequestAuditService
{
    public function log(
        ApprovalRequest $request,
        string $eventType,
        ?int $actorUserId = null,
        ?int $recipientUserId = null,
        ?string $channel = null,
        ?string $notes = null,
        ?array $meta = null
    ): ApprovalRequestLog {
        return ApprovalRequestLog::query()->create([
            'approval_request_id' => $request->id,
            'event_type' => $eventType,
            'actor_user_id' => $actorUserId,
            'recipient_user_id' => $recipientUserId,
            'channel' => $channel,
            'notes' => $notes,
            'meta' => $meta,
            'created_at' => now(),
        ]);
    }

    /**
     * @param  array<string, mixed>  $base
     * @return array<string, mixed>
     */
    private function withActorContext(User $actor, array $base, bool $privilegedContext): array
    {
        $type = $actor->type instanceof UserRole ? $actor->type->value : (string) $actor->type;

        return array_merge($base, [
            'actor_id' => $actor->id,
            'actor_type' => $type,
            'actor_role_context' => $privilegedContext ? 'admin_or_super_admin' : 'approval_group_member',
        ]);
    }

    public function logRequestCreated(ApprovalRequest $request, ?int $actorUserId = null, ?array $meta = null): void
    {
        $this->log(
            $request,
            ApprovalRequestLog::EVT_REQUEST_CREATED,
            $actorUserId,
            null,
            null,
            null,
            $meta
        );
    }

    /**
     * @param  list<string|class-string>  $channels
     */
    public function logNotificationChannels(ApprovalRequest $request, User $recipient, array $channels): void
    {
        foreach ($channels as $ch) {
            if ($ch === 'mail') {
                $this->log(
                    $request,
                    ApprovalRequestLog::EVT_NOTIFICATION_EMAIL_SENT,
                    null,
                    $recipient->id,
                    'email',
                    null,
                    null
                );
            } elseif ($ch === 'database') {
                $this->log(
                    $request,
                    ApprovalRequestLog::EVT_NOTIFICATION_DATABASE_SENT,
                    null,
                    $recipient->id,
                    'database',
                    null,
                    null
                );
            } elseif ($ch === FcmChannel::class) {
                $this->log(
                    $request,
                    ApprovalRequestLog::EVT_NOTIFICATION_FCM_SENT,
                    null,
                    $recipient->id,
                    'fcm',
                    null,
                    null
                );
            }
        }
    }

    public function logRequestOpenedIfFirst(ApprovalRequest $request, int $viewerId): void
    {
        $exists = ApprovalRequestLog::query()
            ->where('approval_request_id', $request->id)
            ->where('event_type', ApprovalRequestLog::EVT_REQUEST_OPENED)
            ->where('actor_user_id', $viewerId)
            ->exists();

        if (! $exists) {
            $this->log($request, ApprovalRequestLog::EVT_REQUEST_OPENED, $viewerId);
        }
    }

    public function logRequestViewed(ApprovalRequest $request, int $viewerId): void
    {
        $this->log($request, ApprovalRequestLog::EVT_REQUEST_VIEWED, $viewerId);
    }

    public function logApproved(
        ApprovalRequest $request,
        User $reviewer,
        string $previousStatus,
        string $decisionSource,
        bool $privilegedContext
    ): void {
        $this->log(
            $request,
            ApprovalRequestLog::EVT_REQUEST_APPROVED,
            $reviewer->id,
            null,
            null,
            null,
            $this->withActorContext($reviewer, [
                'previous_status' => $previousStatus,
                'new_status' => ApprovalRequest::STATUS_APPROVED,
                'decision_source' => $decisionSource,
            ], $privilegedContext)
        );
    }

    public function logRejected(
        ApprovalRequest $request,
        User $reviewer,
        ?string $notes,
        string $previousStatus,
        string $decisionSource,
        bool $privilegedContext
    ): void {
        $this->log(
            $request,
            ApprovalRequestLog::EVT_REQUEST_REJECTED,
            $reviewer->id,
            null,
            null,
            $notes,
            $this->withActorContext($reviewer, [
                'previous_status' => $previousStatus,
                'new_status' => ApprovalRequest::STATUS_REJECTED,
                'decision_source' => $decisionSource,
            ], $privilegedContext)
        );
    }

    public function logDecisionIdempotent(
        ApprovalRequest $request,
        User $reviewer,
        string $attemptedAction,
        string $currentStatus,
        string $decisionSource,
        bool $privilegedContext
    ): void {
        $this->log(
            $request,
            ApprovalRequestLog::EVT_DECISION_IDEMPOTENT,
            $reviewer->id,
            null,
            null,
            null,
            $this->withActorContext($reviewer, [
                'attempted_action' => $attemptedAction,
                'current_status' => $currentStatus,
                'decision_source' => $decisionSource,
            ], $privilegedContext)
        );
    }

    public function logInvalidDecisionAttempt(
        ApprovalRequest $request,
        User $reviewer,
        string $attemptedAction,
        string $currentStatus,
        string $decisionSource,
        bool $privilegedContext,
        ?string $notes = null
    ): void {
        $this->log(
            $request,
            ApprovalRequestLog::EVT_INVALID_DECISION_ATTEMPT,
            $reviewer->id,
            null,
            null,
            $notes,
            $this->withActorContext($reviewer, [
                'attempted_action' => $attemptedAction,
                'current_status' => $currentStatus,
                'decision_source' => $decisionSource,
            ], $privilegedContext)
        );
    }
}

<?php

namespace App\Services;

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

    public function logApproved(ApprovalRequest $request, int $reviewerId): void
    {
        $this->log($request, ApprovalRequestLog::EVT_REQUEST_APPROVED, $reviewerId);
    }

    public function logRejected(ApprovalRequest $request, int $reviewerId, ?string $notes = null): void
    {
        $this->log($request, ApprovalRequestLog::EVT_REQUEST_REJECTED, $reviewerId, null, null, $notes);
    }
}

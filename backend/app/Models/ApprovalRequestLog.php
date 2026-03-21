<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalRequestLog extends Model
{
    public const EVT_REQUEST_CREATED = 'request_created';

    public const EVT_NOTIFICATION_EMAIL_SENT = 'notification_email_sent';

    public const EVT_NOTIFICATION_DATABASE_SENT = 'notification_database_sent';

    public const EVT_NOTIFICATION_FCM_SENT = 'notification_fcm_sent';

    public const EVT_REQUEST_OPENED = 'request_opened';

    public const EVT_REQUEST_VIEWED = 'request_viewed';

    public const EVT_REQUEST_APPROVED = 'request_approved';

    public const EVT_REQUEST_REJECTED = 'request_rejected';

    public $timestamps = false;

    protected $fillable = [
        'approval_request_id',
        'event_type',
        'actor_user_id',
        'recipient_user_id',
        'channel',
        'notes',
        'meta',
        'created_at',
    ];

    protected $casts = [
        'meta' => 'array',
        'created_at' => 'datetime',
    ];

    public function approvalRequest(): BelongsTo
    {
        return $this->belongsTo(ApprovalRequest::class, 'approval_request_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_user_id');
    }
}

<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalGroupMember extends Model
{
    protected $fillable = [
        'user_id',
        'is_active',
        'can_review_requests',
        'can_approve_business_accounts',
        'can_approve_council_requests',
        'created_by_user_id',
        'updated_by_user_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'can_review_requests' => 'boolean',
        'can_approve_business_accounts' => 'boolean',
        'can_approve_council_requests' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }

    /**
     * Active reviewers eligible for notifications: staff type + can_review_requests.
     *
     * @return \Illuminate\Database\Eloquent\Builder<static>
     */
    public static function activeMembersQuery()
    {
        $eligible = UserRole::approvalGroupEligibleValues();

        return static::query()
            ->where('is_active', true)
            ->where('can_review_requests', true)
            ->whereHas('user', fn ($q) => $q->whereIn('type', $eligible));
    }
}

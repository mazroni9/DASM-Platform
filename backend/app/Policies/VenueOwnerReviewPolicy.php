<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;
use App\Models\VenueOwnerReview;

class VenueOwnerReviewPolicy
{
    protected function roleOf(User $user): ?string
    {
        return is_string($user->type) ? $user->type : ($user->type?->value ?? null);
    }

    protected function isAdminOrModerator(User $user): bool
    {
        $role = $this->roleOf($user);
        return in_array($role, [UserRole::ADMIN->value, UserRole::MODERATOR->value], true);
    }

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, VenueOwnerReview $review): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, VenueOwnerReview $review): bool
    {
        if ($this->isAdminOrModerator($user)) {
            return true;
        }
        return $review->user_id === $user->id;
    }

    public function delete(User $user, VenueOwnerReview $review): bool
    {
        if ($this->isAdminOrModerator($user)) {
            return true;
        }
        return $review->user_id === $user->id;
    }

    public function verify(User $user, VenueOwnerReview $review): bool
    {
        return $this->isAdminOrModerator($user);
    }

    public function approve(User $user, VenueOwnerReview $review): bool
    {
        return $this->isAdminOrModerator($user);
    }
}

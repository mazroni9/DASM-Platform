<?php

namespace App\Policies;

use App\Models\User;
use App\Models\AuctionSession;
use App\Enums\UserRole;

class AuctionSessionPolicy
{
    private function roleValue(User $user): string
    {
        $t = $user->type ?? null;
        if ($t instanceof \BackedEnum) return (string)$t->value;
        return strtolower(trim((string)$t));
    }

    public function viewAny(User $user): bool
    {
        $role = $this->roleValue($user);
        return in_array($role, [
            UserRole::ADMIN->value,
            UserRole::VENUE_OWNER->value,
            UserRole::DEALER->value,
        ], true);
    }

    public function view(User $user, AuctionSession $session): bool
    {
        $role = $this->roleValue($user);
        return $role === UserRole::ADMIN->value || (int)$session->user_id === (int)$user->id;
    }

    public function create(User $user): bool
    {
        $role = $this->roleValue($user);
        return in_array($role, [
            UserRole::ADMIN->value,
            UserRole::VENUE_OWNER->value,
            UserRole::DEALER->value,
        ], true);
    }

    public function update(User $user, AuctionSession $session): bool
    {
        $role = $this->roleValue($user);
        return $role === UserRole::ADMIN->value || (int)$session->user_id === (int)$user->id;
    }

    public function delete(User $user, AuctionSession $session): bool
    {
        return $this->update($user, $session);
    }

    public function updateStatus(User $user, AuctionSession $session): bool
    {
        return $this->update($user, $session);
    }
}

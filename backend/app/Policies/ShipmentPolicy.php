<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Shipment;
use App\Models\User;

class ShipmentPolicy
{
    protected function roleOf(User $user): ?string
    {
        // يدعم لو role مخزّنة كسلسلة أو Enum
        return is_string($user->type) ? $user->type : ($user->type?->value ?? null);
    }

    public function viewAny(User $user): bool
    {
        return true; // auth كفاية
    }

    public function view(User $user, Shipment $shipment): bool
    {
        $role = $this->roleOf($user);
        if (in_array($role, [UserRole::ADMIN->value, UserRole::MODERATOR->value], true)) {
            return true;
        }
        if ($role === UserRole::VENUE_OWNER->value) {
            // مالك المعرض يرى شحنات معرضه
            return $shipment->venue_owner_id === optional($user->venueOwner)->id;
        }
        // المشتري يرى شحناته
        return $shipment->buyer_id === $user->id;
    }

    public function create(User $user): bool
    {
        $role = $this->roleOf($user);
        return in_array($role, [UserRole::ADMIN->value, UserRole::MODERATOR->value, UserRole::VENUE_OWNER->value], true);
    }

    public function update(User $user, Shipment $shipment): bool
    {
        $role = $this->roleOf($user);
        if (in_array($role, [UserRole::ADMIN->value, UserRole::MODERATOR->value], true)) return true;
        if ($role === UserRole::VENUE_OWNER->value) {
            return $shipment->venue_owner_id === optional($user->venueOwner)->id;
        }
        return false;
    }

    public function delete(User $user, Shipment $shipment): bool
    {
        return $this->update($user, $shipment);
    }
}

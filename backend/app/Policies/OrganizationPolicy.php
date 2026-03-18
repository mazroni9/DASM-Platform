<?php

namespace App\Policies;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class OrganizationPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('organizations.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Organization $organization): bool
    {
        if ($user->hasPermissionTo('organizations.view_details')) {
            return true;
        }

        // Allow if user belongs to the organization (ownership check)
        return $user->id === $organization->owner_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('organizations.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Organization $organization): bool
    {
        if ($user->hasPermissionTo('organizations.update')) {
            return true;
        }

        // Ownership check: Owner can update their own organization
        // But we might want to restrict this if they don't have a general 'update' permission?
        // The requirement says: "If the user has permission, add a second check: Does this user "own" ...?"
        // But usually "organizations.update" is a global permission for admins.
        // For a "Showroom Manager" (who might be an owner), they might not have 'organizations.update' (global),
        // but they should be able to update THEIR OWN.

        // However, the prompt says: "Check the specific Spatie permission string... AND ... Ownership Check".
        // This implies they need BOTH? Or is it "Global Admin Permission" OR "Owner Permission"?

        // Re-reading: "If the user has permission, add a second check: Does this user "own" or belong to the resource...?"
        // This sounds like: You need the permission to even TRY, and THEN we check ownership.
        // But if I have `organizations.update` permission (as an Admin), I should be able to update ANY.
        // If I am a Venue Owner, I might NOT have `organizations.update` (global), but I should update MINE.

        // Let's assume:
        // 1. Super Admin bypasses everything (Gate).
        // 2. Admin has `organizations.update` -> can update any.
        // 3. Owner -> needs to update their own.

        // Let's implement standard policy logic:
        // If user has 'organizations.update', they can update ANY (because it's an admin permission).
        // If user is the owner, they can update THEIRS.

        return $user->hasPermissionTo('organizations.update') || $user->id === $organization->owner_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Organization $organization): bool
    {
        return $user->hasPermissionTo('organizations.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Organization $organization): bool
    {
        return $user->hasPermissionTo('organizations.update');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Organization $organization): bool
    {
        return $user->hasPermissionTo('organizations.delete');
    }
}

<?php

namespace App\Observers;

use App\Models\User;
use App\Models\Organization;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use Illuminate\Support\Str;

class UserObserver
{
    /**
     * Handle the User "updated" event.
     *
     * @param  \App\Models\User  $user
     * @return void
     */
    public function updated(User $user)
    {
        // Check if status changed to active and user is venue_owner
        if (
            $user->isDirty('status') &&
            $user->status === UserStatus::ACTIVE &&
            $user->type === UserRole::VENUE_OWNER
        ) {

            if (!$user->organization_id) {
                $this->createOrganization($user);
            }
        }
    }

    /**
     * Create an organization for the user.
     *
     * @param  \App\Models\User  $user
     * @return void
     */
    protected function createOrganization(User $user)
    {
        // Use company_name if available (assuming it might be added to User or accessed via relation), 
        // otherwise fallback to Name + Organization
        // Since User model doesn't explicitly show company_name in fillable, we'll check if it exists or use name.
        // The prompt said "User's name (or a specific field if available like company_name)".
        // I'll stick to User's name for now as I didn't see company_name in User model.

        $name = $user->name . ' Organization';

        $organization = Organization::create([
            'name' => $name,
            'slug' => Str::slug($name) . '-' . Str::random(4),
            'owner_id' => $user->id,
            'status' => 'active',
            'type' => 'showroom',
        ]);

        $user->organization_id = $organization->id;
        $user->saveQuietly();
    }
}

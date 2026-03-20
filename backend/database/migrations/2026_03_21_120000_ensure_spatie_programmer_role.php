<?php

use App\Services\ProgrammerSpatieRoleProvisioner;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Creates/updates the Spatie `programmer` role to mirror `admin` for the platform org.
     * Runs with `php artisan migrate` — no RolesAndPermissionsSeeder required for this feature.
     */
    public function up(): void
    {
        ProgrammerSpatieRoleProvisioner::ensure();
    }

    public function down(): void
    {
        // Intentionally empty: users may already be assigned the programmer role.
    }
};

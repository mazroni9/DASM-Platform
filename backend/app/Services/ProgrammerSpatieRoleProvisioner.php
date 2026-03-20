<?php

namespace App\Services;

use App\Enums\OrganizationType;
use App\Models\Organization;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Ensures the Spatie `programmer` role exists for the platform organization
 * and mirrors the `admin` role permissions — without relying on RolesAndPermissionsSeeder.
 */
final class ProgrammerSpatieRoleProvisioner
{
    public static function ensure(): void
    {
        if (!Schema::hasTable('roles')) {
            return;
        }

        $platformOrg = Organization::query()
            ->where('slug', 'dasm-e-platform')
            ->where('type', OrganizationType::PLATFORM)
            ->first();

        if (!$platformOrg) {
            Log::info('ProgrammerSpatieRoleProvisioner: platform organization not found, skip');

            return;
        }

        $adminRole = Role::query()
            ->where('name', 'admin')
            ->where('guard_name', 'sanctum')
            ->where('organization_id', $platformOrg->id)
            ->first();

        if (!$adminRole) {
            Log::warning('ProgrammerSpatieRoleProvisioner: admin Spatie role missing for platform org, skip');

            return;
        }

        $programmerRole = Role::updateOrCreate(
            [
                'name' => 'programmer',
                'guard_name' => 'sanctum',
                'organization_id' => $platformOrg->id,
            ],
            [
                'display_name' => 'مبرمج',
                'description' => 'صلاحيات تشغيلية مساوية للمدير العادي دون صلاحيات مدير النظام الرئيسي',
            ]
        );

        $programmerRole->syncPermissions($adminRole->permissions);

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}

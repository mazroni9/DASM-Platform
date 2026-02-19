<?php

namespace Database\Seeders;

use App\Enums\OrganizationType;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Define permissions grouped by modules with Arabic display names
        $permissionsByModule = [
            // ** Core Permissions **
            'permissions' => [
                ['name' => 'permissions.view', 'display_name' => 'ط¹ط±ط¶ ط§ظ„طµظ„ط§ط­ظٹط§طھ'],
                ['name' => 'permissions.create', 'display_name' => 'ط¥ظ†ط´ط§ط، ط§ظ„طµظ„ط§ط­ظٹط§طھ'],
                ['name' => 'permissions.update', 'display_name' => 'طھط­ط¯ظٹط« ط§ظ„طµظ„ط§ط­ظٹط§طھ'],
                ['name' => 'permissions.delete', 'display_name' => 'ط­ط°ظپ ط§ظ„طµظ„ط§ط­ظٹط§طھ'],
            ],

            // ** Users & Roles Management **
            'users' => [
                ['name' => 'users.view', 'display_name' => 'ط¹ط±ط¶ ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†'],
                ['name' => 'users.view_details', 'display_name' => 'ط¹ط±ط¶ طھظپط§طµظٹظ„ ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†'],
                ['name' => 'users.create', 'display_name' => 'ط¥ظ†ط´ط§ط، ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†'],
                ['name' => 'users.update', 'display_name' => 'طھط­ط¯ظٹط« ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†'],
                ['name' => 'users.delete', 'display_name' => 'ط­ط°ظپ ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†'],
                ['name' => 'users.manage_roles', 'display_name' => 'ط¥ط¯ط§ط±ط© ط£ط¯ظˆط§ط± ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†'],
            ],
            'staff' => [
                ['name' => 'staff.view', 'display_name' => 'ط¹ط±ط¶ ط§ظ„ظ…ظˆط¸ظپظٹظ†'],
                ['name' => 'staff.view_details', 'display_name' => 'ط¹ط±ط¶ طھظپط§طµظٹظ„ ط§ظ„ظ…ظˆط¸ظپظٹظ†'],
                ['name' => 'staff.create', 'display_name' => 'ط¥ظ†ط´ط§ط، ط§ظ„ظ…ظˆط¸ظپظٹظ†'],
                ['name' => 'staff.update', 'display_name' => 'طھط­ط¯ظٹط« ط§ظ„ظ…ظˆط¸ظپظٹظ†'],
                ['name' => 'staff.delete', 'display_name' => 'ط­ط°ظپ ط§ظ„ظ…ظˆط¸ظپظٹظ†'],
                ['name' => 'staff.assign_roles', 'display_name' => 'طھط¹ظٹظٹظ† ط£ط¯ظˆط§ط± ط§ظ„ظ…ظˆط¸ظپظٹظ†'],
            ],
            'exhibitors' => [
                ['name' => 'exhibitors.view', 'display_name' => 'ط¹ط±ط¶ ط§ظ„ط¹ط§ط±ط¶ظٹظ†'],
                ['name' => 'exhibitors.view_details', 'display_name' => 'ط¹ط±ط¶ طھظپط§طµظٹظ„ ط§ظ„ط¹ط§ط±ط¶ظٹظ†'],
                ['name' => 'exhibitors.approve', 'display_name' => 'ط§ظ„ظ…ظˆط§ظپظ‚ط© ط¹ظ„ظ‰ ط§ظ„ط¹ط§ط±ط¶ظٹظ†'],
                ['name' => 'exhibitors.update', 'display_name' => 'طھط­ط¯ظٹط« ط§ظ„ط¹ط§ط±ط¶ظٹظ†'],
                ['name' => 'exhibitors.delete', 'display_name' => 'ط­ط°ظپ ط§ظ„ط¹ط§ط±ط¶ظٹظ†'],
            ],
            'roles' => [
                ['name' => 'roles.view', 'display_name' => 'ط¹ط±ط¶ ط§ظ„ط£ط¯ظˆط§ط±'],
                ['name' => 'roles.create', 'display_name' => 'ط¥ظ†ط´ط§ط، ط§ظ„ط£ط¯ظˆط§ط±'],
                ['name' => 'roles.update', 'display_name' => 'طھط­ط¯ظٹط« ط§ظ„ط£ط¯ظˆط§ط±'],
                ['name' => 'roles.delete', 'display_name' => 'ط­ط°ظپ ط§ظ„ط£ط¯ظˆط§ط±'],
            ],
            'groups' => [
                ['name' => 'groups.view', 'display_name' => 'ط¹ط±ط¶ ط§ظ„ظ…ط¬ظ…ظˆط¹ط§طھ'],
                ['name' => 'groups.create', 'display_name' => 'ط¥ظ†ط´ط§ط، ط§ظ„ظ…ط¬ظ…ظˆط¹ط§طھ'],
                ['name' => 'groups.update', 'display_name' => 'طھط­ط¯ظٹط« ط§ظ„ظ…ط¬ظ…ظˆط¹ط§طھ'],
                ['name' => 'groups.delete', 'display_name' => 'ط­ط°ظپ ط§ظ„ظ…ط¬ظ…ظˆط¹ط§طھ'],
                ['name' => 'groups.assign_users', 'display_name' => 'طھط¹ظٹظٹظ† ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ† ظ„ظ„ظ…ط¬ظ…ظˆط¹ط§طھ'],
            ],
            'organizations' => [
                ['name' => 'organizations.view', 'display_name' => 'ط¹ط±ط¶ ط§ظ„ظ…ظ†ط¸ظ…ط§طھ'],
                ['name' => 'organizations.view_details', 'display_name' => 'ط¹ط±ط¶ طھظپط§طµظٹظ„ ط§ظ„ظ…ظ†ط¸ظ…ط§طھ'],
                ['name' => 'organizations.create', 'display_name' => 'ط¥ظ†ط´ط§ط، ط§ظ„ظ…ظ†ط¸ظ…ط§طھ'],
                ['name' => 'organizations.update', 'display_name' => 'طھط­ط¯ظٹط« ط§ظ„ظ…ظ†ط¸ظ…ط§طھ'],
                ['name' => 'organizations.delete', 'display_name' => 'ط­ط°ظپ ط§ظ„ظ…ظ†ط¸ظ…ط§طھ'],
            ],

            // ** Cars & Auctions Management **
            'cars' => [
                ['name' => 'cars.view', 'display_name' => 'ط¹ط±ط¶ ط§ظ„ط³ظٹط§ط±ط§طھ'],
                ['name' => 'cars.view_details', 'display_name' => 'ط¹ط±ط¶ طھظپط§طµظٹظ„ ط§ظ„ط³ظٹط§ط±ط§طھ'],
                ['name' => 'cars.create', 'display_name' => 'ط¥ظ†ط´ط§ط، ط§ظ„ط³ظٹط§ط±ط§طھ'],
                ['name' => 'cars.update', 'display_name' => 'طھط­ط¯ظٹط« ط§ظ„ط³ظٹط§ط±ط§طھ'],
                ['name' => 'cars.delete', 'display_name' => 'ط­ط°ظپ ط§ظ„ط³ظٹط§ط±ط§طھ'],
            ],
            'auctions' => [
                ['name' => 'auctions.view', 'display_name' => 'ط¹ط±ط¶ ط§ظ„ظ…ط²ط§ط¯ط§طھ'],
                ['name' => 'auctions.view_details', 'display_name' => 'ط¹ط±ط¶ طھظپط§طµظٹظ„ ط§ظ„ظ…ط²ط§ط¯ط§طھ'],
                ['name' => 'auctions.create', 'display_name' => 'ط¥ظ†ط´ط§ط، ط§ظ„ظ…ط²ط§ط¯ط§طھ'],
                ['name' => 'auctions.update', 'display_name' => 'طھط­ط¯ظٹط« ط§ظ„ظ…ط²ط§ط¯ط§طھ'],
                ['name' => 'auctions.delete', 'display_name' => 'ط­ط°ظپ ط§ظ„ظ…ط²ط§ط¯ط§طھ'],
                ['name' => 'auctions.approve', 'display_name' => 'ط§ظ„ظ…ظˆط§ظپظ‚ط© ط¹ظ„ظ‰ ط§ظ„ظ…ط²ط§ط¯ط§طھ'],
                ['name' => 'auctions.reject', 'display_name' => 'ط±ظپط¶ ط§ظ„ظ…ط²ط§ط¯ط§طھ'],
                ['name' => 'auctions.archive', 'display_name' => 'ط£ط±ط´ظپط© ط§ظ„ظ…ط²ط§ط¯ط§طھ'],
                ['name' => 'auctions.manage_status', 'display_name' => 'ط¥ط¯ط§ط±ط© ط­ط§ظ„ط© ط§ظ„ظ…ط²ط§ط¯ط§طھ'],
            ],
            // ** Sessions & Live Streaming **
            'sessions' => [
                ['name' => 'sessions.view', 'display_name' => 'ط¹ط±ط¶ ط§ظ„ط¬ظ„ط³ط§طھ'],
                ['name' => 'sessions.view_details', 'display_name' => 'ط¹ط±ط¶ طھظپط§طµظٹظ„ ط§ظ„ط¬ظ„ط³ط§طھ'],
                ['name' => 'sessions.create', 'display_name' => 'ط¥ظ†ط´ط§ط، ط§ظ„ط¬ظ„ط³ط§طھ'],
                ['name' => 'sessions.update', 'display_name' => 'طھط­ط¯ظٹط« ط§ظ„ط¬ظ„ط³ط§طھ'],
                ['name' => 'sessions.delete', 'display_name' => 'ط­ط°ظپ ط§ظ„ط¬ظ„ط³ط§طھ'],
                ['name' => 'sessions.start_live', 'display_name' => 'ط¨ط¯ط، ط§ظ„ط¨ط« ط§ظ„ظ…ط¨ط§ط´ط± ظ„ظ„ط¬ظ„ط³ط§طھ'],
                ['name' => 'sessions.end_live', 'display_name' => 'ط¥ظ†ظ‡ط§ط، ط§ظ„ط¨ط« ط§ظ„ظ…ط¨ط§ط´ط± ظ„ظ„ط¬ظ„ط³ط§طھ'],
                ['name' => 'sessions.cancel', 'display_name' => 'ط¥ظ„ط؛ط§ط، ط§ظ„ط¬ظ„ط³ط§طھ'],
                ['name' => 'sessions.end', 'display_name' => 'ط¥ظ†ظ‡ط§ط، ط§ظ„ط¬ظ„ط³ط§طھ'],
            ],
            'live_streams' => [
                ['name' => 'live_streams.view', 'display_name' => 'ط¹ط±ط¶ ط§ظ„ط¨ط« ط§ظ„ظ…ط¨ط§ط´ط±'],
                ['name' => 'live_streams.manage', 'display_name' => 'ط¥ط¯ط§ط±ط© ط§ظ„ط¨ط« ط§ظ„ظ…ط¨ط§ط´ط±'],
            ],
            'youtube_channels' => [
                ['name' => 'youtube_channels.view', 'display_name' => 'ط¹ط±ط¶ ظ‚ظ†ظˆط§طھ ظٹظˆطھظٹظˆط¨'],
                ['name' => 'youtube_channels.manage', 'display_name' => 'ط¥ط¯ط§ط±ط© ظ‚ظ†ظˆط§طھ ظٹظˆطھظٹظˆط¨'],
            ],

            // ** Logs & Reports **
            'auction_logs' => [
                ['name' => 'auction_logs.view', 'display_name' => 'ط¹ط±ط¶ ط³ط¬ظ„ط§طھ ط§ظ„ظ…ط²ط§ط¯ط§طھ'],
                ['name' => 'auction_logs.delete', 'display_name' => 'ط­ط°ظپ ط³ط¬ظ„ط§طھ ط§ظ„ظ…ط²ط§ط¯ط§طھ'],
            ],
            'activity_logs' => [
                ['name' => 'activity_logs.view', 'display_name' => 'ط¹ط±ط¶ ط³ط¬ظ„ط§طھ ط§ظ„ظ†ط´ط§ط·'],
                ['name' => 'activity_logs.delete', 'display_name' => 'ط­ط°ظپ ط³ط¬ظ„ط§طھ ط§ظ„ظ†ط´ط§ط·'],
            ],

            // ** Commissions & Plans **
            'commissions' => [
                ['name' => 'commissions.view', 'display_name' => 'ط¹ط±ط¶ ط§ظ„ط¹ظ…ظˆظ„ط§طھ'],
                ['name' => 'commissions.manage', 'display_name' => 'ط¥ط¯ط§ط±ط© ط§ظ„ط¹ظ…ظˆظ„ط§طھ'],
            ],
            'subscription_plans' => [
                ['name' => 'subscription_plans.view', 'display_name' => 'ط¹ط±ط¶ ط®ط·ط· ط§ظ„ط§ط´طھط±ط§ظƒ'],
                ['name' => 'subscription_plans.manage', 'display_name' => 'ط¥ط¯ط§ط±ط© ط®ط·ط· ط§ظ„ط§ط´طھط±ط§ظƒ'],
            ],
        ];

        // Create permissions
        // Check which column exists (type or role) and find or create super_admin
        $columnName = Schema::hasColumn('users', 'type') ? 'type' : 'role';

        $super_admin = User::where($columnName, 'super_admin')->first();

        // Create super_admin user if doesn't exist
        if (!$super_admin) {
            $userData = [
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'email' => 'superadmin@dasm.platform',
                'phone' => '0000000000',
                'password_hash' => $this->seedPasswordHash('SEED_SUPER_ADMIN_PASSWORD'),
                $columnName => 'super_admin',
            ];

            // Add optional fields if they exist
            if (Schema::hasColumn('users', 'email_verified_at')) {
                $userData['email_verified_at'] = now();
            }
            if (Schema::hasColumn('users', 'is_active')) {
                $userData['is_active'] = true;
            }
            if (Schema::hasColumn('users', 'status')) {
                $userData['status'] = 'active';
            }

            $super_admin = User::create($userData);
            echo "Created super_admin user with ID: {$super_admin->id}\n";
        }

        // Create platform organization
        $platform_org = Organization::firstOrCreate([
            'name' => 'DASMe Platform',
            'slug' => 'dasm-e-platform',
            'type' => OrganizationType::PLATFORM,
            'status' => 'active',
        ], [
            'owner_id' => $super_admin->id,
        ]);

        // Ensure super_admin belongs to platform org (required for model_has_roles.organization_id)
        if (Schema::hasColumn('users', 'organization_id')) {
            $super_admin->update(['organization_id' => $platform_org->id]);
        }

        foreach ($permissionsByModule as $module => $permissions) {
            foreach ($permissions as $permission) {
                Permission::firstOrCreate(
                    ['name' => $permission['name'], 'guard_name' => 'sanctum'],
                    [
                        'display_name' => $permission['display_name'],
                        'module' => $module
                    ]
                );
            }
        }

        // Create super_admin role
        // Check which column exists and find super_admin user
        if (!$super_admin) {
            if (Schema::hasColumn('users', 'type')) {
                $super_admin = User::where('type', 'super_admin')->first();
            } elseif (Schema::hasColumn('users', 'role')) {
                $super_admin = User::where('role', 'super_admin')->first();
            }
        }

        $superAdminRole = Role::updateOrCreate(
            ['name' => 'super_admin', 'guard_name' => 'sanctum'],
            [
                'display_name' => 'ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ… ط§ظ„ط±ط¦ظٹط³ظٹ',
                'description' => 'ظ„ط¯ظٹظ‡ طµظ„ط§ط­ظٹط§طھ ظƒط§ظ…ظ„ط© ط¹ظ„ظ‰ ط¬ظ…ظٹط¹ ط£ط¬ط²ط§ط، ط§ظ„ظ†ط¸ط§ظ…'
            ]
        );
        // No need to assign permissions, handled by Gate::before in AppServiceProvider


        // Create additional roles with Arabic display names and descriptions
        $adminRole = Role::updateOrCreate(
            ['name' => 'admin', 'guard_name' => 'sanctum', 'organization_id' => $platform_org->id],
            [
                'display_name' => 'ظ…ط¯ظٹط±',
                'description' => 'ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ… ظ…ط¹ طµظ„ط§ط­ظٹط§طھ ظ…ط­ط¯ظˆط¯ط©'
            ]
        );
        $adminRole->givePermissionTo([
            'auctions.view',
            'auctions.view_details',
            'users.view',
            'users.view_details',
            'staff.view',
            'staff.view_details',
            'cars.view',
            'cars.view_details',
            'sessions.view',
            'sessions.view_details',
            'organizations.view',
            'organizations.view_details',
        ]);

        // Create admin user for testing
        $adminUser = User::where('email', 'admin@dasm.platform')->first();
        if (!$adminUser) {
            $adminUserData = [
                'first_name' => 'Admin',
                'last_name' => 'User',
                'email' => 'admin@dasm.platform',
                'phone' => '0000000001',
                'password_hash' => $this->seedPasswordHash('SEED_ADMIN_PASSWORD'),
                $columnName => 'admin',
            ];

            if (Schema::hasColumn('users', 'organization_id')) {
                $adminUserData['organization_id'] = $platform_org->id;
            }
            if (Schema::hasColumn('users', 'email_verified_at')) {
                $adminUserData['email_verified_at'] = now();
            }
            if (Schema::hasColumn('users', 'is_active')) {
                $adminUserData['is_active'] = true;
            }
            if (Schema::hasColumn('users', 'status')) {
                $adminUserData['status'] = 'active';
            }

            $adminUser = User::create($adminUserData);
            app()[PermissionRegistrar::class]->setPermissionsTeamId($platform_org->id);
            $adminUser->assignRole($adminRole);
            echo "Created admin user with ID: {$adminUser->id}\n";
        } else {
            // Ensure admin user has the role (with team context for model_has_roles.organization_id)
            if (!$adminUser->hasRole('admin')) {
                $teamId = $adminUser->organization_id ?? $platform_org->id;
                app()[PermissionRegistrar::class]->setPermissionsTeamId($teamId);
                $adminUser->assignRole($adminRole);
            }
        }

        $moderatorRole = Role::updateOrCreate(
            ['name' => 'moderator', 'guard_name' => 'sanctum', 'organization_id' => $platform_org->id],
            [
                'display_name' => 'ظ…ط´ط±ظپ',
                'description' => 'ظ…ط´ط±ظپ ط¹ظ„ظ‰ ط§ظ„ظ…ط²ط§ط¯ط§طھ ظˆط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†'
            ]
        );
        $moderatorRole->givePermissionTo([
            'auctions.view',
            'auctions.view_details',
            'auctions.approve',
            'auctions.reject',
            'users.view',
            'users.view_details',
            'cars.view',
            'cars.view_details',
        ]);

        $userRole = Role::updateOrCreate(
            ['name' => 'user', 'guard_name' => 'sanctum'],
            [
                'display_name' => 'ظ…ط³طھط®ط¯ظ…',
                'description' => 'ظ…ط³طھط®ط¯ظ… ط¹ط§ط¯ظٹ ظ„ظ„ظ†ط¸ط§ظ…'
            ]
        );
        $userRole->givePermissionTo([
            'auctions.view',
            'auctions.view_details',
            'cars.view',
            'cars.view_details',
        ]);
    }

    private function seedPasswordHash(string $envKey): string
    {
        $configuredPassword = trim((string) env($envKey, ''));

        if ($configuredPassword !== '') {
            return Hash::make($configuredPassword);
        }

        if (app()->environment('production')) {
            throw new \RuntimeException("Missing {$envKey} in production environment.");
        }

        // Avoid predictable seeded passwords in non-production environments.
        return Hash::make(Str::random(32));
    }
}


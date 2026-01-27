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
                ['name' => 'permissions.view', 'display_name' => 'عرض الصلاحيات'],
                ['name' => 'permissions.create', 'display_name' => 'إنشاء الصلاحيات'],
                ['name' => 'permissions.update', 'display_name' => 'تحديث الصلاحيات'],
                ['name' => 'permissions.delete', 'display_name' => 'حذف الصلاحيات'],
            ],

            // ** Users & Roles Management **
            'users' => [
                ['name' => 'users.view', 'display_name' => 'عرض المستخدمين'],
                ['name' => 'users.view_details', 'display_name' => 'عرض تفاصيل المستخدمين'],
                ['name' => 'users.create', 'display_name' => 'إنشاء المستخدمين'],
                ['name' => 'users.update', 'display_name' => 'تحديث المستخدمين'],
                ['name' => 'users.delete', 'display_name' => 'حذف المستخدمين'],
                ['name' => 'users.manage_roles', 'display_name' => 'إدارة أدوار المستخدمين'],
            ],
            'staff' => [
                ['name' => 'staff.view', 'display_name' => 'عرض الموظفين'],
                ['name' => 'staff.view_details', 'display_name' => 'عرض تفاصيل الموظفين'],
                ['name' => 'staff.create', 'display_name' => 'إنشاء الموظفين'],
                ['name' => 'staff.update', 'display_name' => 'تحديث الموظفين'],
                ['name' => 'staff.delete', 'display_name' => 'حذف الموظفين'],
                ['name' => 'staff.assign_roles', 'display_name' => 'تعيين أدوار الموظفين'],
            ],
            'exhibitors' => [
                ['name' => 'exhibitors.view', 'display_name' => 'عرض العارضين'],
                ['name' => 'exhibitors.view_details', 'display_name' => 'عرض تفاصيل العارضين'],
                ['name' => 'exhibitors.approve', 'display_name' => 'الموافقة على العارضين'],
                ['name' => 'exhibitors.update', 'display_name' => 'تحديث العارضين'],
                ['name' => 'exhibitors.delete', 'display_name' => 'حذف العارضين'],
            ],
            'roles' => [
                ['name' => 'roles.view', 'display_name' => 'عرض الأدوار'],
                ['name' => 'roles.create', 'display_name' => 'إنشاء الأدوار'],
                ['name' => 'roles.update', 'display_name' => 'تحديث الأدوار'],
                ['name' => 'roles.delete', 'display_name' => 'حذف الأدوار'],
            ],
            'groups' => [
                ['name' => 'groups.view', 'display_name' => 'عرض المجموعات'],
                ['name' => 'groups.create', 'display_name' => 'إنشاء المجموعات'],
                ['name' => 'groups.update', 'display_name' => 'تحديث المجموعات'],
                ['name' => 'groups.delete', 'display_name' => 'حذف المجموعات'],
                ['name' => 'groups.assign_users', 'display_name' => 'تعيين المستخدمين للمجموعات'],
            ],
            'organizations' => [
                ['name' => 'organizations.view', 'display_name' => 'عرض المنظمات'],
                ['name' => 'organizations.view_details', 'display_name' => 'عرض تفاصيل المنظمات'],
                ['name' => 'organizations.create', 'display_name' => 'إنشاء المنظمات'],
                ['name' => 'organizations.update', 'display_name' => 'تحديث المنظمات'],
                ['name' => 'organizations.delete', 'display_name' => 'حذف المنظمات'],
            ],

            // ** Cars & Auctions Management **
            'cars' => [
                ['name' => 'cars.view', 'display_name' => 'عرض السيارات'],
                ['name' => 'cars.view_details', 'display_name' => 'عرض تفاصيل السيارات'],
                ['name' => 'cars.create', 'display_name' => 'إنشاء السيارات'],
                ['name' => 'cars.update', 'display_name' => 'تحديث السيارات'],
                ['name' => 'cars.delete', 'display_name' => 'حذف السيارات'],
            ],
            'auctions' => [
                ['name' => 'auctions.view', 'display_name' => 'عرض المزادات'],
                ['name' => 'auctions.view_details', 'display_name' => 'عرض تفاصيل المزادات'],
                ['name' => 'auctions.create', 'display_name' => 'إنشاء المزادات'],
                ['name' => 'auctions.update', 'display_name' => 'تحديث المزادات'],
                ['name' => 'auctions.delete', 'display_name' => 'حذف المزادات'],
                ['name' => 'auctions.approve', 'display_name' => 'الموافقة على المزادات'],
                ['name' => 'auctions.reject', 'display_name' => 'رفض المزادات'],
                ['name' => 'auctions.archive', 'display_name' => 'أرشفة المزادات'],
                ['name' => 'auctions.manage_status', 'display_name' => 'إدارة حالة المزادات'],
            ],
            'auction_tests' => [
                ['name' => 'auction_tests.view', 'display_name' => 'عرض اختبارات المزادات'],
                ['name' => 'auction_tests.view_details', 'display_name' => 'عرض تفاصيل اختبارات المزادات'],
                ['name' => 'auction_tests.run', 'display_name' => 'تشغيل اختبارات المزادات'],
                ['name' => 'auction_tests.run_all', 'display_name' => 'تشغيل جميع اختبارات المزادات'],
                ['name' => 'auction_tests.delete', 'display_name' => 'حذف نتائج اختبارات المزادات'],
            ],

            // ** Sessions & Live Streaming **
            'sessions' => [
                ['name' => 'sessions.view', 'display_name' => 'عرض الجلسات'],
                ['name' => 'sessions.view_details', 'display_name' => 'عرض تفاصيل الجلسات'],
                ['name' => 'sessions.create', 'display_name' => 'إنشاء الجلسات'],
                ['name' => 'sessions.update', 'display_name' => 'تحديث الجلسات'],
                ['name' => 'sessions.delete', 'display_name' => 'حذف الجلسات'],
                ['name' => 'sessions.start_live', 'display_name' => 'بدء البث المباشر للجلسات'],
                ['name' => 'sessions.end_live', 'display_name' => 'إنهاء البث المباشر للجلسات'],
                ['name' => 'sessions.cancel', 'display_name' => 'إلغاء الجلسات'],
                ['name' => 'sessions.end', 'display_name' => 'إنهاء الجلسات'],
            ],
            'live_streams' => [
                ['name' => 'live_streams.view', 'display_name' => 'عرض البث المباشر'],
                ['name' => 'live_streams.manage', 'display_name' => 'إدارة البث المباشر'],
            ],
            'youtube_channels' => [
                ['name' => 'youtube_channels.view', 'display_name' => 'عرض قنوات يوتيوب'],
                ['name' => 'youtube_channels.manage', 'display_name' => 'إدارة قنوات يوتيوب'],
            ],

            // ** Logs & Reports **
            'auction_logs' => [
                ['name' => 'auction_logs.view', 'display_name' => 'عرض سجلات المزادات'],
                ['name' => 'auction_logs.delete', 'display_name' => 'حذف سجلات المزادات'],
            ],
            'activity_logs' => [
                ['name' => 'activity_logs.view', 'display_name' => 'عرض سجلات النشاط'],
                ['name' => 'activity_logs.delete', 'display_name' => 'حذف سجلات النشاط'],
            ],

            // ** Commissions & Plans **
            'commissions' => [
                ['name' => 'commissions.view', 'display_name' => 'عرض العمولات'],
                ['name' => 'commissions.manage', 'display_name' => 'إدارة العمولات'],
            ],
            'subscription_plans' => [
                ['name' => 'subscription_plans.view', 'display_name' => 'عرض خطط الاشتراك'],
                ['name' => 'subscription_plans.manage', 'display_name' => 'إدارة خطط الاشتراك'],
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
                'password_hash' => Hash::make('superadmin123'), // Temporary password - should be changed
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
                'display_name' => 'مدير النظام الرئيسي',
                'description' => 'لديه صلاحيات كاملة على جميع أجزاء النظام'
            ]
        );
        // No need to assign permissions, handled by Gate::before in AppServiceProvider


        // Create additional roles with Arabic display names and descriptions
        $adminRole = Role::updateOrCreate(
            ['name' => 'admin', 'guard_name' => 'sanctum', 'organization_id' => $platform_org->id],
            [
                'display_name' => 'مدير',
                'description' => 'مدير النظام مع صلاحيات محدودة'
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
            // Auction tests permissions
            'auction_tests.view',
            'auction_tests.view_details',
            'auction_tests.run',
            'auction_tests.run_all',
            'auction_tests.delete',
        ]);

        // Create admin user for testing
        $adminUser = User::where('email', 'admin@dasm.platform')->first();
        if (!$adminUser) {
            $adminUserData = [
                'first_name' => 'Admin',
                'last_name' => 'User',
                'email' => 'admin@dasm.platform',
                'phone' => '0000000001',
                'password_hash' => Hash::make('admin123'),
                $columnName => 'admin',
            ];

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
            $adminUser->assignRole($adminRole);
            echo "Created admin user with ID: {$adminUser->id}\n";
        } else {
            // Ensure admin user has the role
            if (!$adminUser->hasRole('admin')) {
                $adminUser->assignRole($adminRole);
            }
        }

        $moderatorRole = Role::updateOrCreate(
            ['name' => 'moderator', 'guard_name' => 'sanctum', 'organization_id' => $platform_org->id],
            [
                'display_name' => 'مشرف',
                'description' => 'مشرف على المزادات والمستخدمين'
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
                'display_name' => 'مستخدم',
                'description' => 'مستخدم عادي للنظام'
            ]
        );
        $userRole->givePermissionTo([
            'auctions.view',
            'auctions.view_details',
            'cars.view',
            'cars.view_details',
        ]);


    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Enums\OrganizationType;
use App\Models\User;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class CouncilPermissionsController extends Controller
{
    private const COUNCIL_PREFIX = 'council.';

    /**
     * List council permissions only.
     * GET /api/admin/market-council/permissions/list
     */
    public function list(): JsonResponse
    {
        $permissions = Permission::where('name', 'like', self::COUNCIL_PREFIX . '%')
            ->orderBy('name')
            ->get(['id', 'name', 'display_name']);

        return response()->json([
            'status' => 'success',
            'data'   => $permissions,
        ]);
    }

    /**
     * List users with their council permissions.
     * GET /api/admin/market-council/permissions/users
     */
    public function users(Request $request): JsonResponse
    {
        $query = User::query()->with(['roles:id,name,display_name']);

        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($qb) use ($q) {
                $qb->where('first_name', 'like', "%{$q}%")
                    ->orWhere('last_name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }

        $perPage = min(50, max(1, (int) $request->get('per_page', 20)));
        $users = $query->orderBy('id')->paginate($perPage);

        $platformOrg = Organization::where('type', OrganizationType::PLATFORM)->first();
        $registrar = app(PermissionRegistrar::class);

        $items = $users->getCollection()->map(function (User $user) use ($platformOrg, $registrar) {
            $teamId = $user->organization_id ?? ($platformOrg?->id ?? null);
            if ($teamId) {
                $registrar->setPermissionsTeamId($teamId);
            }

            $allPermissions = $user->getAllPermissions()->pluck('name')->toArray();
            $councilPermissions = array_values(array_filter($allPermissions, fn($n) => str_starts_with($n, self::COUNCIL_PREFIX)));

            return [
                'id'                 => $user->id,
                'first_name'         => $user->first_name,
                'last_name'          => $user->last_name,
                'email'              => $user->email,
                'type'               => $user->type?->value ?? $user->type,
                'council_permissions' => $councilPermissions,
            ];
        });

        $users->setCollection($items);

        return response()->json([
            'status' => 'success',
            'data'   => $users,
        ]);
    }

    /**
     * Update council permissions for a user.
     * PUT /api/admin/market-council/permissions/users/{userId}
     * Body: { permission_ids: number[] }
     */
    public function updateUser(Request $request, int $userId): JsonResponse
    {
        $request->validate([
            'permission_ids'   => 'required|array',
            'permission_ids.*' => 'integer|exists:permissions,id',
        ]);

        $user = User::findOrFail($userId);
        $platformOrg = Organization::where('type', OrganizationType::PLATFORM)->first();

        if (!$platformOrg) {
            return response()->json([
                'status'  => 'error',
                'message' => 'منظمة المنصة غير معرّفة. لا يمكن تعيين صلاحيات المجلس.',
            ], 500);
        }

        $teamId = $user->organization_id ?? $platformOrg->id;

        $permissionIds = $request->permission_ids;
        $councilPermissionIds = Permission::where('name', 'like', self::COUNCIL_PREFIX . '%')
            ->pluck('id')
            ->toArray();

        $validIds = array_intersect($permissionIds, $councilPermissionIds);
        if (count($validIds) !== count($permissionIds)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'يسمح فقط بصلاحيات مجلس السوق.',
            ], 422);
        }

        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId($teamId);

        $existingDirect = $user->getDirectPermissions()->pluck('name')->toArray();
        $existingNonCouncil = array_filter($existingDirect, fn($n) => !str_starts_with($n, self::COUNCIL_PREFIX));
        $nonCouncilPermIds = Permission::whereIn('name', $existingNonCouncil)->pluck('id')->toArray();

        $allIds = array_unique(array_merge($nonCouncilPermIds, $validIds));
        $user->syncPermissions($allIds);

        $user->load('roles:id,name,display_name');
        $registrar->setPermissionsTeamId($teamId);
        $councilPerms = $user->getAllPermissions()
            ->pluck('name')
            ->filter(fn($n) => str_starts_with($n, self::COUNCIL_PREFIX))
            ->values()
            ->toArray();

        return response()->json([
            'status'  => 'success',
            'message' => 'تم تحديث صلاحيات مجلس السوق بنجاح',
            'data'    => [
                'id'                 => $user->id,
                'council_permissions' => $councilPerms,
            ],
        ]);
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreRoleRequest;
use App\Http\Requests\Admin\UpdateRoleRequest;
use App\Enums\UserRole;
use Illuminate\Http\JsonResponse;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /**
     * Protected role names that cannot be deleted or renamed
     */
    private const PROTECTED_ROLES = [
        'platform_super_admin',
        'super_admin',
    ];

    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $roles = Role::withCount(['permissions', 'users'])
            ->with('permissions:id,name,module')
            ->get();

        return response()->json([
            'data' => $roles,
        ]);
    }

    /**
     * Get a list of roles for selection (id, display_name).
     */
    public function list(): JsonResponse
    {
        $query = Role::select('id', 'display_name', 'name');

        /** @var \App\Models\User $user */
        $user = auth()->user();

        // ✅ Security: Non-super admins cannot see super admin role
        if ($user->type !== UserRole::SUPER_ADMIN) {
            $query->whereNotIn('name', self::PROTECTED_ROLES);
        }

        $roles = $query->orderBy('display_name')->get();

        return response()->json([
            'status' => 'success',
            'data'   => $roles,
        ]);
    }

    /**
     * Get all permissions grouped by module.
     */
    public function permissionsTree(): JsonResponse
    {
        $permissions = Permission::select('id', 'name', 'display_name', 'module')
            ->orderBy('module')
            ->orderBy('name')
            ->get()
            ->groupBy('module');

        return response()->json([
            'data' => $permissions,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreRoleRequest $request): JsonResponse
    {
        // ✅ Security: Prevent creating protected role names
        if (in_array(strtolower($request->name), self::PROTECTED_ROLES)) {
            return response()->json([
                'message' => 'لا يمكن إنشاء دور بهذا الاسم.',
            ], 403);
        }

        $role = Role::create([
            'name'         => $request->name,
            'display_name' => $request->display_name,
            'description'  => $request->description,
            'guard_name'   => 'web',
        ]);

        if ($request->has('permission_ids') && is_array($request->permission_ids)) {
            $role->syncPermissions($request->permission_ids);
        }

        return response()->json([
            'message' => 'Role created successfully.',
            'data'    => $role->load('permissions:id,name'),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $role = Role::with('permissions:id,name,display_name,module')->findOrFail($id);

        return response()->json([
            'data' => $role,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateRoleRequest $request, string $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        // ✅ Security: Protected roles cannot be renamed
        if (in_array($role->name, self::PROTECTED_ROLES)) {
            if ($request->name !== $role->name) {
                return response()->json([
                    'message' => 'لا يمكن تغيير اسم هذا الدور.',
                ], 403);
            }
        }

        // ✅ Security: Cannot rename to a protected name
        if (!in_array($role->name, self::PROTECTED_ROLES) && in_array(strtolower($request->name), self::PROTECTED_ROLES)) {
            return response()->json([
                'message' => 'لا يمكن استخدام هذا الاسم.',
            ], 403);
        }

        $role->update([
            'name'         => $request->name,
            'display_name' => $request->display_name,
            'description'  => $request->description,
        ]);

        if ($request->has('permission_ids')) {
            $role->syncPermissions($request->permission_ids ?? []);
        }

        return response()->json([
            'message' => 'Role updated successfully.',
            'data'    => $role->load('permissions:id,name'),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        // ✅ Security: Protected roles cannot be deleted
        if (in_array($role->name, self::PROTECTED_ROLES)) {
            return response()->json([
                'message' => 'لا يمكن حذف هذا الدور.',
            ], 403);
        }

        // ✅ Security: Cannot delete role with active users
        $usersCount = $role->users()->count();
        if ($usersCount > 0) {
            return response()->json([
                'message' => "لا يمكن حذف الدور، يوجد {$usersCount} مستخدم مرتبط به.",
            ], 422);
        }

        $role->delete();

        return response()->json([
            'message' => 'Role deleted successfully.',
        ]);
    }
}

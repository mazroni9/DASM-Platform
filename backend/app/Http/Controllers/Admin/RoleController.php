<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreRoleRequest;
use App\Http\Requests\Admin\UpdateRoleRequest;
use Illuminate\Http\JsonResponse;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $roles = Role::withCount(['permissions', 'users'])
            ->with('permissions')
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

        // If current user is not super admin, hide super_admin role
        /** @var \App\Models\User $user */
        /** @phpstan-ignore-next-line */
        $user = auth()->user();
        // Check if user has SUPER_ADMIN role in the role column (enum)
        // OR if they have the Spatie role 'super_admin' (if that's how it's used).
        // Given User model overrides hasRole, we check the enum directly or use isAdmin() helper if available.
        // User model has isAdmin() which checks ADMIN or SUPER_ADMIN.
        // Let's check specifically for SUPER_ADMIN enum.

        if ($user->role !== \App\Enums\UserRole::SUPER_ADMIN) {
            $query->where('name', '!=', 'super_admin');
        }

        $roles = $query->get();

        return response()->json([
            'status' => 'success',
            'data' => $roles,
        ]);
    }

    /**
     * Get all permissions grouped by module.
     */
    public function permissionsTree(): JsonResponse
    {

        $permissions = Permission::all()->groupBy('module');

        return response()->json([
            'data' => $permissions,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreRoleRequest $request): JsonResponse
    {
        $role = Role::create([
            'name' => $request->name,
            'display_name' => $request->display_name,
            'description' => $request->description,
            'guard_name' => 'web',
        ]);

        if ($request->has('permission_ids')) {
            $role->syncPermissions($request->permission_ids);
        }

        return response()->json([
            'message' => 'Role created successfully.',
            'data' => $role->load('permissions'),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $role = Role::with('permissions')->findOrFail($id);

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

        // Prevent updating super admin name if needed, but usually just protecting the ID is enough.
        // Ideally, we shouldn't allow editing the super admin role at all via API if it's critical.
        if ($role->name === 'platform_super_admin' && $request->name !== 'platform_super_admin') {
            return response()->json(['message' => 'Cannot rename the super admin role.'], 403);
        }

        $role->update([
            'name' => $request->name,
            'display_name' => $request->display_name,
            'description' => $request->description,
        ]);

        if ($request->has('permission_ids')) {
            $role->syncPermissions($request->permission_ids);
        }

        return response()->json([
            'message' => 'Role updated successfully.',
            'data' => $role->load('permissions'),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        if ($role->name === 'platform_super_admin') {
            return response()->json([
                'message' => 'Cannot delete the platform super admin role.',
            ], 403);
        }

        $role->delete();

        return response()->json([
            'message' => 'Role deleted successfully.',
        ]);
    }
}

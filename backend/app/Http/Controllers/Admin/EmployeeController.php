<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class EmployeeController extends Controller
{
    private function roleColumn(): string
    {
        if (Schema::hasColumn('users', 'role')) return 'role';
        if (Schema::hasColumn('users', 'type')) return 'type';
        return 'type';
    }

    private function setUserRole(User $u, string $roleValue): void
    {
        if (Schema::hasColumn('users', 'role')) $u->role = $roleValue;
        if (Schema::hasColumn('users', 'type')) $u->type = $roleValue;
    }

    private function setUserPassword(User $u, string $plainPassword): void
    {
        $hash = Hash::make($plainPassword);

        if (Schema::hasColumn('users', 'password_hash')) {
            $u->password_hash = $hash;
        }
        if (Schema::hasColumn('users', 'password')) {
            $u->password = $hash;
        }
    }

    public function index(Request $request)
    {
        $perPage = (int) $request->query('per_page', 15);
        $perPage = max(1, min($perPage, 100));
        $q = trim((string) $request->query('q', ''));

        $roleCol = $this->roleColumn();

        $query = User::query()
            ->where($roleCol, UserRole::EMPLOYEE->value)
            ->orderByDesc('id');

        if ($q !== '') {
            $query->where(function ($qq) use ($q) {
                $qq->where('email', 'like', "%{$q}%")
                    ->orWhere('phone', 'like', "%{$q}%")
                    ->orWhere('first_name', 'like', "%{$q}%")
                    ->orWhere('last_name', 'like', "%{$q}%")
                    ->orWhereRaw('CAST(id AS TEXT) LIKE ?', ["%{$q}%"]);
            });
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->paginate($perPage),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => ['nullable', 'string', 'max:255'],
            'last_name'  => ['nullable', 'string', 'max:255'],
            'name'       => ['nullable', 'string', 'max:255'],
            'email'      => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone'      => ['nullable', 'string', 'max:50'],
            'password'   => ['nullable', 'string', 'min:6'],
            'is_active'  => ['nullable', 'boolean'],
        ]);

        $firstName = trim((string)($validated['first_name'] ?? ''));
        $lastName  = trim((string)($validated['last_name'] ?? ''));
        $name      = trim((string)($validated['name'] ?? ''));

        if ($firstName === '' && $name !== '') {
            $parts = preg_split('/\s+/', $name, -1, PREG_SPLIT_NO_EMPTY) ?: [];
            $firstName = $parts[0] ?? '';
            $lastName = implode(' ', array_slice($parts, 1));
        }

        if ($firstName === '') $firstName = 'Employee';
        if ($lastName === '') $lastName = '-';

        $plainPassword = $validated['password'] ?: Str::random(10);
        $isActive = array_key_exists('is_active', $validated) ? (bool) $validated['is_active'] : true;

        $user = DB::transaction(function () use ($validated, $firstName, $lastName, $plainPassword, $isActive) {
            $u = new User();

            if (Schema::hasColumn('users', 'first_name')) $u->first_name = $firstName;
            if (Schema::hasColumn('users', 'last_name'))  $u->last_name  = $lastName;

            $u->email = $validated['email'];
            if (Schema::hasColumn('users', 'phone')) $u->phone = $validated['phone'] ?? null;

            // ✅ role/type = employee
            $this->setUserRole($u, UserRole::EMPLOYEE->value);

            if (Schema::hasColumn('users', 'is_active')) $u->is_active = $isActive;
            if (Schema::hasColumn('users', 'status')) $u->status = $isActive ? 'active' : 'inactive';

            if (Schema::hasColumn('users', 'email_verified_at')) {
                $u->email_verified_at = now();
            }

            // ✅ password_hash/password
            $this->setUserPassword($u, $plainPassword);

            $u->save();
            return $u;
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Employee created successfully',
            'data' => $user,
            'plain_password' => $plainPassword,
        ], 201);
    }

    public function show(int $id)
    {
        $roleCol = $this->roleColumn();

        $employee = User::query()
            ->where($roleCol, UserRole::EMPLOYEE->value)
            ->findOrFail($id);

        return response()->json(['status' => 'success', 'data' => $employee]);
    }

    public function update(Request $request, int $id)
    {
        $roleCol = $this->roleColumn();

        $employee = User::query()
            ->where($roleCol, UserRole::EMPLOYEE->value)
            ->findOrFail($id);

        $validated = $request->validate([
            'first_name' => ['nullable', 'string', 'max:255'],
            'last_name'  => ['nullable', 'string', 'max:255'],
            'name'       => ['nullable', 'string', 'max:255'],
            'email'      => ['nullable', 'email', 'max:255', 'unique:users,email,' . $employee->id],
            'phone'      => ['nullable', 'string', 'max:50'],
            'password'   => ['nullable', 'string', 'min:6'],
            'is_active'  => ['nullable', 'boolean'],
        ]);

        $firstName = trim((string)($validated['first_name'] ?? ''));
        $lastName  = trim((string)($validated['last_name'] ?? ''));
        $name      = trim((string)($validated['name'] ?? ''));

        if ($firstName === '' && $name !== '') {
            $parts = preg_split('/\s+/', $name, -1, PREG_SPLIT_NO_EMPTY) ?: [];
            $firstName = $parts[0] ?? '';
            $lastName = implode(' ', array_slice($parts, 1));
        }

        DB::transaction(function () use ($employee, $validated, $firstName, $lastName) {
            if (Schema::hasColumn('users', 'first_name') && $firstName !== '') $employee->first_name = $firstName;
            if (Schema::hasColumn('users', 'last_name') && $lastName !== '')  $employee->last_name  = $lastName;

            if (!empty($validated['email'])) $employee->email = $validated['email'];

            if (Schema::hasColumn('users', 'phone') && array_key_exists('phone', $validated)) {
                $employee->phone = $validated['phone'];
            }

            if (!empty($validated['password'])) {
                $this->setUserPassword($employee, $validated['password']);
            }

            if (Schema::hasColumn('users', 'is_active') && array_key_exists('is_active', $validated)) {
                $employee->is_active = (bool) $validated['is_active'];
            }
            if (Schema::hasColumn('users', 'status') && array_key_exists('is_active', $validated)) {
                $employee->status = ((bool) $validated['is_active']) ? 'active' : 'inactive';
            }

            $employee->save();
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Employee updated successfully',
            'data' => $employee,
        ]);
    }

    public function updateStatus(Request $request, int $id)
    {
        $roleCol = $this->roleColumn();

        $employee = User::query()
            ->where($roleCol, UserRole::EMPLOYEE->value)
            ->findOrFail($id);

        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        DB::transaction(function () use ($employee, $validated) {
            if (Schema::hasColumn('users', 'is_active')) {
                $employee->is_active = (bool) $validated['is_active'];
            }
            if (Schema::hasColumn('users', 'status')) {
                $employee->status = ((bool) $validated['is_active']) ? 'active' : 'inactive';
            }
            $employee->save();
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Employee status updated successfully',
            'data' => $employee,
        ]);
    }

    public function destroy(int $id)
    {
        $roleCol = $this->roleColumn();

        $employee = User::query()
            ->where($roleCol, UserRole::EMPLOYEE->value)
            ->findOrFail($id);

        $employee->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Employee deleted successfully',
        ]);
    }
}

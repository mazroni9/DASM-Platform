<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;

class AdminUsersController extends Controller
{
    private function ensureSuperAdmin(): void
    {
        $user = auth()->user();
        abort_unless($user && (($user->type ?? null) === 'super_admin'), 403, 'Forbidden');
    }

    public function index()
    {
        $this->ensureSuperAdmin();

        $users = User::query()
            ->orderByDesc('id')
            ->limit(500)
            ->get();

        $stats = [
            'total' => User::count(),
            'active' => User::where('is_active', true)->count(),
            'pending' => User::where('status', 'pending')->count(),
            'new_this_week' => User::where('created_at', '>=', now()->subDays(7))->count(),
            'dealers_count' => User::where('type', 'dealer')->count(),
            'regular_users_count' => User::where('type', 'regular')->count(),
            'super_admins_count' => User::where('type', 'super_admin')->count(),
        ];

        return response()->json([
            'status' => 'success',
            'data' => [
                'users' => $users,
                'stats' => $stats,
            ],
        ]);
    }

    public function show($id)
    {
        $this->ensureSuperAdmin();

        $user = User::findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $user,
        ]);
    }
}

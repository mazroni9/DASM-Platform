<?php

namespace App\Http\Controllers\AdminPanel;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $q = User::query();

        if ($search = trim((string) $request->query('q', ''))) {
            $q->where(function ($qq) use ($search) {
                $qq->where('first_name', 'like', "%{$search}%")
                   ->orWhere('last_name', 'like', "%{$search}%")
                   ->orWhere('email', 'like', "%{$search}%")
                   ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $perPage = max(5, min((int) $request->query('per_page', 20), 100));

        return response()->json([
            'ok' => true,
            'data' => $q->orderByDesc('id')->paginate($perPage),
        ]);
    }

    public function show(int $userId)
    {
        $user = User::query()->findOrFail($userId);

        return response()->json([
            'ok' => true,
            'data' => $user,
        ]);
    }

    public function update(Request $request, int $userId)
    {
        $user = User::query()->findOrFail($userId);

        // ✅ تحديث جزئي (ما يطلبش first_name إلزامي)
        $data = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name'  => ['sometimes', 'string', 'max:255'],
            'name'       => ['sometimes', 'string', 'max:255'], // لو عندك name legacy
            'email'      => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone'      => ['sometimes', 'nullable', 'string', 'max:50'],

            // دور/نوع المستخدم (لو عندك type في DB)
            'type'       => ['sometimes', 'string', 'max:50'],

            // حالة المستخدم (أمثلة شائعة)
            'status'     => ['sometimes', 'nullable', 'string', 'max:50'],
            'is_active'  => ['sometimes', 'boolean'],
            'active'     => ['sometimes', 'boolean'],
        ]);

        // ✅ اسمح فقط بالحقول الموجودة فعلًا
        $allowed = [
            'first_name', 'last_name', 'name', 'email', 'phone',
            'type', 'status', 'is_active', 'active'
        ];

        $user->fill(array_intersect_key($data, array_flip($allowed)));
        $user->save();

        return response()->json([
            'ok' => true,
            'message' => 'User updated',
            'data' => $user->fresh(),
        ]);
    }
}

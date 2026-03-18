<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserModerationController extends Controller
{
    private function typeToString(mixed $type): string
    {
        if ($type instanceof \BackedEnum) return (string) $type->value;
        if ($type instanceof \UnitEnum)   return (string) $type->name;
        return is_string($type) ? $type : (string) ($type ?? '');
    }

    private function isSuperAdmin(User $user): bool
    {
        $type = strtolower(trim($this->typeToString($user->type)));
        $type = str_replace(['-', ' '], '_', $type);
        return $type === 'super_admin';
    }

    /**
     * PATCH /api/admin/users/{userId}/active
     * body: { "is_active": true/false }
     */
    public function setActive(Request $request, int $userId)
    {
        $authUser = $request->user();
        if (!$authUser || !$this->isSuperAdmin($authUser)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $user = User::query()->findOrFail($userId);

        $user->is_active = (bool) $data['is_active'];
        $user->status = $user->is_active ? 'active' : 'inactive';
        $user->save();

        return response()->json([
            'status' => 'success',
            'message'=> 'تم تحديث حالة المستخدم',
            'data' => [
                'id' => $user->id,
                'is_active' => $user->is_active,
                'status' => $user->status,
            ]
        ]);
    }

    /**
     * PATCH /api/admin/users/{userId}/kyc
     * body: { "kyc_status": "pending|verified|rejected" }
     */
    public function setKycStatus(Request $request, int $userId)
    {
        $authUser = $request->user();
        if (!$authUser || !$this->isSuperAdmin($authUser)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'kyc_status' => ['required', 'in:pending,verified,rejected'],
        ]);

        $user = User::query()->findOrFail($userId);

        // لو عندك عمود kyc_status ده الطبيعي:
        $user->kyc_status = $data['kyc_status'];
        $user->save();

        return response()->json([
            'status' => 'success',
            'message'=> 'تم تحديث حالة التوثيق (KYC)',
            'data' => [
                'id' => $user->id,
                'kyc_status' => $user->kyc_status,
            ]
        ]);
    }

    /**
     * DELETE /api/admin/users/{userId}
     */
    public function destroy(Request $request, int $userId)
    {
        $authUser = $request->user();
        if (!$authUser || !$this->isSuperAdmin($authUser)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $user = User::query()->findOrFail($userId);

        // لو عندك SoftDeletes هيتعمل soft delete تلقائي
        $user->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'تم حذف المستخدم بنجاح',
        ]);
    }
}

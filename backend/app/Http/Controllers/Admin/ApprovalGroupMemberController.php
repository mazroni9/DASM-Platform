<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\ApprovalGroupMember;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApprovalGroupMemberController extends Controller
{
    public function index(): JsonResponse
    {
        $rows = ApprovalGroupMember::query()
            ->with(['user:id,first_name,last_name,email,type,is_active,status'])
            ->orderBy('id')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $rows,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|integer|exists:users,id',
        ]);

        if (ApprovalGroupMember::query()->where('user_id', $request->user_id)->exists()) {
            return response()->json([
                'status' => 'error',
                'message' => 'المستخدم مضاف مسبقاً لمجموعة الموافقات',
            ], 422);
        }

        $targetUser = User::query()->findOrFail((int) $request->user_id);
        if (! UserRole::isApprovalGroupEligibleType($targetUser->type)) {
            return response()->json([
                'status' => 'error',
                'message' => 'يُسمح فقط بإضافة موظفي الإدارة (المدير الأعلى، مدير النظام، المشرف، أو المبرمج) إلى مجموعة الموافقات',
            ], 422);
        }

        $actor = $request->user();
        $row = ApprovalGroupMember::create([
            'user_id' => (int) $request->user_id,
            'is_active' => true,
            'can_review_requests' => true,
            'can_approve_business_accounts' => false,
            'can_approve_council_requests' => false,
            'created_by_user_id' => $actor->id,
            'updated_by_user_id' => $actor->id,
        ]);

        $row->load('user:id,first_name,last_name,email,type,is_active,status');

        return response()->json([
            'status' => 'success',
            'message' => 'تمت إضافة العضو',
            'data' => $row,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'is_active' => 'sometimes|boolean',
            'can_review_requests' => 'sometimes|boolean',
            'can_approve_business_accounts' => 'sometimes|boolean',
            'can_approve_council_requests' => 'sometimes|boolean',
        ]);

        $row = ApprovalGroupMember::query()->with('user:id,type')->findOrFail($id);
        if ($row->user && ! UserRole::isApprovalGroupEligibleType($row->user->type)) {
            return response()->json([
                'status' => 'error',
                'message' => 'هذه العضوية مرتبطة بمستخدم غير إداري. أزل العضو من المجموعة ثم أضف مستخدماً إدارياً إن لزم.',
            ], 422);
        }

        $actor = $request->user();

        $row->fill($request->only([
            'is_active',
            'can_review_requests',
            'can_approve_business_accounts',
            'can_approve_council_requests',
        ]));
        $row->updated_by_user_id = $actor->id;
        $row->save();

        $row->load('user:id,first_name,last_name,email,type,is_active,status');

        return response()->json([
            'status' => 'success',
            'message' => 'تم التحديث',
            'data' => $row,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $row = ApprovalGroupMember::findOrFail($id);
        $row->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'تمت إزالة العضو من المجموعة',
        ]);
    }
}

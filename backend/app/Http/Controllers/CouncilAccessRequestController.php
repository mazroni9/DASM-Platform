<?php

namespace App\Http\Controllers;

use App\Services\ApprovalRequestWorkflowService;
use App\Support\CouncilStudioBundle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouncilAccessRequestController extends Controller
{
    public function __construct(
        private readonly ApprovalRequestWorkflowService $workflow
    ) {
    }

    /**
     * Authenticated user requests a council studio permission bundle for themselves.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'bundle' => 'required|string|in:' . implode(',', CouncilStudioBundle::validBundles()),
        ]);

        $user = $request->user();

        try {
            $row = $this->workflow->createCouncilPermissionRequest($user, $request->bundle);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }

        $created = $row->wasRecentlyCreated;
        $message = $created
            ? 'تم إرسال طلبك وسيتم إشعار فريق الموافقات'
            : 'لديك طلب معلّق من نفس النوع مسبقاً';

        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $row,
        ], $created ? 201 : 200);
    }
}

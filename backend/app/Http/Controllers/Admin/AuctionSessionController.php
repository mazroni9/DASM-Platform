<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\Request;
use App\Models\AuctionSession;
use Illuminate\Validation\Rule;
use Illuminate\Http\JsonResponse;
use App\Events\UpdateSessionEvent;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class AuctionSessionController extends Controller
{
    /**
     * Display a listing of auction sessions.
     */
    public function index(): JsonResponse
    {
        $sessions = AuctionSession::with(['auctions' => function ($query) {
            $query->select('id', 'session_id');
        }])
            ->withCount('auctions')
            ->orderBy('session_date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $sessions
        ]);
    }

    /**
     * Store a newly created auction session.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'session_date' => 'required|date',
            'status' => ['required', Rule::in(['scheduled', 'active', 'completed', 'cancelled'])],
            'type' => ['required', Rule::in(['live', 'instant', 'silent'])],
        ]);

        $session = AuctionSession::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء جلسة المزاد بنجاح',
            'data' => $session
        ], 201);
    }

    /**
     * Display the specified auction session.
     */
    public function show(string $id): JsonResponse
    {
        $session = AuctionSession::with(['auctions.car' => function ($query) {
            $query->select('id', 'make', 'model', 'year');
        }])
            ->with(['auctions' => function ($query) {
                $query->orderBy('approved_for_live', 'desc');
            }])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $session
        ]);
    }

    /**
     * Update the specified auction session.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $session = AuctionSession::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'session_date' => 'sometimes|required|date',
            'status' => ['sometimes', 'required', Rule::in(['scheduled', 'active', 'completed', 'cancelled'])],
            'type' => ['sometimes', 'required', Rule::in(['live', 'instant', 'silent'])],
        ]);

        if ($request->type === 'live' && $request->status === 'active') {
            $liveSessionsCount = AuctionSession::where('type', 'live')
            ->where('status', 'active')
            ->where('id', '!=', $id)
            ->count();

            if ($liveSessionsCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'فقط جلسة واحدة يمكن التنشيط في وقت واحد للمزاد المباشر',
                ], 422);
            }
        }
        
        $session->update($validated);
        $session->auctions()->update(['approved_for_live' => false]);
        if ($request->type === 'live' && $request->status === 'active') {
            broadcast(new UpdateSessionEvent($session));
        }
        return response()->json([
            'success' => true,
            'message' => 'تم تحديث جلسة المزاد بنجاح',
            'data' => $session
        ]);
    }

    /**
     * Remove the specified auction session.
     */
    public function destroy(string $id): JsonResponse
    {
        $session = AuctionSession::findOrFail($id);

        // Check if session has any auctions
        if ($session->auctions()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن حذف جلسة تحتوي على مزادات'
            ], 422);
        }

        $session->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف جلسة المزاد بنجاح'
        ]);
    }

    /**
     * Update the status of the specified auction session.
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['active', 'completed', 'cancelled'])],
        ]);
        $session = AuctionSession::findOrFail($id);
        if ($session->session_date > now()) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن تحديث حالة الجلسة قبل تاريخ الجلسة',
            ], 422);
        }

        if ($request->status === 'active' && $session->type === 'live') {
            $liveSessionsCount = AuctionSession::where('type', 'live')
            ->where('status', 'active')
            ->where('id', '!=', $id)
            ->count();

            if ($liveSessionsCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'فقط جلسة واحدة يمكن التنشيط في وقت واحد للمزاد المباشر',
                ], 422);
            }
        }


        DB::beginTransaction();
        try {
            $session = AuctionSession::findOrFail($id);
            $session->status = $validated['status'];
            $session->save();

            $session->auctions()->update(['approved_for_live' => false]);
            DB::commit();
            broadcast(new UpdateSessionEvent($session));
            return response()->json([
                'success' => true,
                'message' => 'تم تحديث حالة الجلسة بنجاح',
                'data' => $session
            ]);
        } catch (\Throwable $th) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تحديث حالة الجلسة',
                'errors' => $th->getMessage()
            ], 500);
        }
    }

    /**
     * Get active and scheduled auction sessions.
     */
    public function getActiveAndScheduledSessions(): JsonResponse
    {
        $sessions = AuctionSession::whereIn('status', ['scheduled', 'active'])
            ->where('type', 'live') // Only live sessions can have live auctions
            ->orderBy('session_date', 'asc')
            ->get(['id', 'name', 'session_date', 'status']);

        return response()->json([
            'success' => true,
            'data' => $sessions
        ]);
    }
}

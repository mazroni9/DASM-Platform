<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuctionSession;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

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

        $session->update($validated);

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
}

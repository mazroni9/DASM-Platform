<?php

namespace App\Http\Controllers\Exhibitor;

use App\Http\Controllers\Controller;
use App\Models\AuctionSession;
use App\Models\User;
use App\Enums\UserRole;
use App\Enums\AuctionStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class AuctionSessionController extends Controller
{
    /**
     * Session statuses
     */
    private const STATUSES = ['scheduled', 'active', 'completed', 'cancelled'];
    
    /**
     * Session types
     */
    private const TYPES = ['live', 'instant', 'silent'];

    /**
     * Get sessions for the current venue owner.
     * GET /api/exhibitor/sessions
     */
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $query = AuctionSession::query()
            ->where('user_id', $user->id)
            ->withCount('auctions')
            ->orderByDesc('session_date');

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        // Date range
        if ($request->filled('date_from')) {
            $query->whereDate('session_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('session_date', '<=', $request->date_to);
        }

        $sessions = $query->get([
            'id', 'user_id', 'name', 'description', 'session_date', 
            'status', 'type', 'created_at', 'updated_at'
        ]);

        return response()->json([
            'success' => true,
            'data'    => $sessions,
        ]);
    }

    /**
     * Create a new session.
     * POST /api/exhibitor/sessions
     */
    public function store(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'name'         => ['required', 'string', 'max:255'],
            'description'  => ['nullable', 'string', 'max:1000'],
            'session_date' => ['required', 'date', 'after_or_equal:today'],
            'status'       => ['required', Rule::in(self::STATUSES)],
            'type'         => ['required', Rule::in(self::TYPES)],
        ]);

        // ✅ Security: Exhibitors cannot create 'active' sessions directly
        if ($validated['status'] === 'active') {
            $validated['status'] = 'scheduled';
        }

        // ✅ Security: Check for active live sessions (global)
        if ($validated['type'] === 'live' && $validated['status'] === 'active') {
            $hasActive = AuctionSession::where('type', 'live')
                ->where('status', 'active')
                ->exists();

            if ($hasActive) {
                return response()->json([
                    'success' => false,
                    'message' => 'يوجد جلسة مباشرة نشطة بالفعل'
                ], 422);
            }
        }

        try {
            $session = AuctionSession::create([
                'user_id'      => $user->id,
                'name'         => $validated['name'],
                'description'  => $validated['description'] ?? null,
                'session_date' => $validated['session_date'],
                'status'       => $validated['status'],
                'type'         => $validated['type'],
            ]);

            $session->loadCount('auctions');

            Log::info('Exhibitor created session', [
                'session_id' => $session->id,
                'user_id'    => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء الجلسة بنجاح',
                'data'    => $session,
            ], 201);

        } catch (\Exception $e) {
            Log::error('Session creation failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء إنشاء الجلسة'
            ], 500);
        }
    }

    /**
     * Show a specific session.
     * GET /api/exhibitor/sessions/{id}
     */
    public function show(Request $request, $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $session = AuctionSession::with([
            'auctions' => fn($q) => $q->orderBy('created_at', 'desc'),
            'auctions.car:id,make,model,year,evaluation_price,auction_status',
        ])
        ->withCount('auctions')
        ->findOrFail($id);

        // ✅ Security: Check ownership (using Policy pattern)
        if (!$this->canAccessSession($user, $session)) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بالوصول لهذه الجلسة'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data'    => $session,
        ]);
    }

    /**
     * Update a session.
     * PUT /api/exhibitor/sessions/{id}
     */
    public function update(Request $request, $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $session = AuctionSession::findOrFail($id);

        // ✅ Security: Check ownership
        if (!$this->canAccessSession($user, $session)) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بتعديل هذه الجلسة'
            ], 403);
        }

        // ✅ Security: Cannot edit active/completed sessions
        if (in_array($session->status, ['active', 'completed'])) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن تعديل جلسة نشطة أو مكتملة'
            ], 422);
        }

        $validated = $request->validate([
            'name'         => ['sometimes', 'required', 'string', 'max:255'],
            'description'  => ['nullable', 'string', 'max:1000'],
            'session_date' => ['sometimes', 'required', 'date'],
            'type'         => ['sometimes', 'required', Rule::in(self::TYPES)],
        ]);

        // ✅ Security: Exhibitors cannot change status via update
        // They must use updateStatus endpoint

        try {
            $session->fill($validated);
            $session->save();
            $session->loadCount('auctions');

            Log::info('Exhibitor updated session', [
                'session_id' => $id,
                'user_id'    => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم تحديث الجلسة بنجاح',
                'data'    => $session,
            ]);

        } catch (\Exception $e) {
            Log::error('Session update failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تحديث الجلسة'
            ], 500);
        }
    }

    /**
     * Update session status.
     * PATCH /api/exhibitor/sessions/{id}/status
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $session = AuctionSession::findOrFail($id);

        // ✅ Security: Check ownership
        if (!$this->canAccessSession($user, $session)) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بتعديل هذه الجلسة'
            ], 403);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['cancelled'])], // ✅ Exhibitors can only cancel
        ]);

        // ✅ Security: Cannot cancel completed session
        if ($session->status === 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن إلغاء جلسة مكتملة'
            ], 422);
        }

        try {
            DB::beginTransaction();

            $session->status = $validated['status'];
            $session->save();

            // End all active auctions in this session
            if ($validated['status'] === 'cancelled') {
                $session->auctions()
                    ->whereIn('status', AuctionStatus::activeValues())
                    ->update(['status' => AuctionStatus::CANCELED->value]);
            }

            DB::commit();

            Log::info('Exhibitor cancelled session', [
                'session_id' => $id,
                'user_id'    => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم تحديث حالة الجلسة',
                'data'    => $session,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Status update failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تحديث الحالة'
            ], 500);
        }
    }

    /**
     * Delete a session.
     * DELETE /api/exhibitor/sessions/{id}
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $session = AuctionSession::withCount('auctions')->findOrFail($id);

        // ✅ Security: Check ownership
        if (!$this->canAccessSession($user, $session)) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بحذف هذه الجلسة'
            ], 403);
        }

        // ✅ Validation: Cannot delete session with auctions
        if ($session->auctions_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن حذف جلسة تحتوي على مزادات'
            ], 422);
        }

        // ✅ Security: Cannot delete active session
        if ($session->status === 'active') {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن حذف جلسة نشطة. قم بإلغائها أولاً.'
            ], 422);
        }

        try {
            $session->delete();

            Log::info('Exhibitor deleted session', [
                'session_id' => $id,
                'user_id'    => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم حذف الجلسة بنجاح',
            ]);

        } catch (\Exception $e) {
            Log::error('Session deletion failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء حذف الجلسة'
            ], 500);
        }
    }

    /**
     * Get session statistics for exhibitor dashboard.
     * GET /api/exhibitor/sessions/stats
     */
    public function stats(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $stats = [
            'total'     => AuctionSession::where('user_id', $user->id)->count(),
            'scheduled' => AuctionSession::where('user_id', $user->id)->where('status', 'scheduled')->count(),
            'active'    => AuctionSession::where('user_id', $user->id)->where('status', 'active')->count(),
            'completed' => AuctionSession::where('user_id', $user->id)->where('status', 'completed')->count(),
            'cancelled' => AuctionSession::where('user_id', $user->id)->where('status', 'cancelled')->count(),
        ];

        return response()->json([
            'success' => true,
            'data'    => $stats,
        ]);
    }

    /**
     * Check if user can access this session.
     * ✅ Security: Proper authorization check
     */
    private function canAccessSession(User $user, AuctionSession $session): bool
    {
        // Admin/Super Admin can access all
        if ($user->isAdmin()) {
            return true;
        }

        // Owner can access their own sessions
        return $session->user_id === $user->id;
    }
}

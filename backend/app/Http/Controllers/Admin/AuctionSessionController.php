<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuctionSession;
use App\Models\Auction;
use App\Enums\AuctionStatus;
use App\Events\UpdateSessionEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
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
     * Display a listing of auction sessions.
     * GET /api/admin/sessions
     * 
     * ✅ Performance: Added pagination instead of get()
     */
    public function index(Request $request): JsonResponse
    {
        $query = AuctionSession::query()
            ->withCount('auctions')
            ->with(['owner:id,first_name,last_name']);

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

        // Sorting
        $sortBy = $request->get('sort_by', 'session_date');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['session_date', 'name', 'status', 'type', 'created_at'];
        
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');
        }

        // ✅ Pagination instead of get() for performance
        $perPage = min(50, max(1, (int) $request->get('per_page', 15)));
        $sessions = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data'    => $sessions
        ]);
    }

    /**
     * Store a newly created auction session.
     * POST /api/admin/sessions
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'description'  => 'nullable|string|max:1000',
            'session_date' => 'required|date|after_or_equal:today',
            'status'       => ['required', Rule::in(self::STATUSES)],
            'type'         => ['required', Rule::in(self::TYPES)],
            'user_id'      => 'nullable|exists:users,id',
        ]);

        // ✅ Security: Check for active live sessions
        if ($validated['type'] === 'live' && $validated['status'] === 'active') {
            if ($this->hasActiveLiveSession()) {
                return response()->json([
                    'success' => false,
                    'message' => 'يوجد جلسة مباشرة نشطة بالفعل. يمكن تفعيل جلسة واحدة فقط.'
                ], 422);
            }
        }

        try {
            $session = AuctionSession::create([
                'name'         => $validated['name'],
                'description'  => $validated['description'] ?? null,
                'session_date' => $validated['session_date'],
                'status'       => $validated['status'],
                'type'         => $validated['type'],
                'user_id'      => $validated['user_id'] ?? auth()->id(),
            ]);

            $this->clearSessionCache();

            Log::info('Auction session created', [
                'session_id' => $session->id,
                'admin_id'   => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء جلسة المزاد بنجاح',
                'data'    => $session
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
     * Display the specified auction session.
     * GET /api/admin/sessions/{id}
     */
    public function show(string $id): JsonResponse
    {
        $session = AuctionSession::with([
            'auctions' => function ($query) {
                $query->orderByDesc('approved_for_live')
                      ->orderBy('created_at', 'desc');
            },
            'auctions.car:id,make,model,year,vin,evaluation_price,auction_status',
            'auctions.bids' => fn($q) => $q->orderBy('created_at', 'desc')->limit(5),
            'owner:id,first_name,last_name,email',
        ])
        ->withCount('auctions')
        ->findOrFail($id);

        // Stats
        $stats = [
            'total_auctions'     => $session->auctions_count,
            'approved_for_live'  => $session->auctions()->where('approved_for_live', true)->count(),
            'active_auctions'    => $session->auctions()->whereIn('status', AuctionStatus::activeValues())->count(),
            'total_bids'         => DB::table('bids')
                ->whereIn('auction_id', $session->auctions()->pluck('id'))
                ->count(),
        ];

        return response()->json([
            'success' => true,
            'data'    => $session,
            'stats'   => $stats,
        ]);
    }

    /**
     * Update the specified auction session.
     * PUT /api/admin/sessions/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $session = AuctionSession::findOrFail($id);

        $validated = $request->validate([
            'name'         => 'sometimes|required|string|max:255',
            'description'  => 'nullable|string|max:1000',
            'session_date' => 'sometimes|required|date',
            'status'       => ['sometimes', 'required', Rule::in(self::STATUSES)],
            'type'         => ['sometimes', 'required', Rule::in(self::TYPES)],
        ]);

        // ✅ Security: Check for active live sessions (exclude current)
        $newType = $validated['type'] ?? $session->type;
        $newStatus = $validated['status'] ?? $session->status;

        if ($newType === 'live' && $newStatus === 'active') {
            if ($this->hasActiveLiveSession($id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'يوجد جلسة مباشرة نشطة بالفعل. يمكن تفعيل جلسة واحدة فقط.'
                ], 422);
            }
        }

        try {
            DB::beginTransaction();

            $oldStatus = $session->status;
            $session->fill($validated);
            $session->save();

            // Reset approved_for_live when session becomes active
            if ($newStatus === 'active' && $oldStatus !== 'active') {
                $session->auctions()->update(['approved_for_live' => false]);
            }

            DB::commit();

            $this->clearSessionCache($id);

            // Broadcast update for live sessions
            if ($newType === 'live') {
                try {
                    broadcast(new UpdateSessionEvent($session))->toOthers();
                } catch (\Exception $e) {
                    Log::warning('Session broadcast failed', ['error' => $e->getMessage()]);
                }
            }

            Log::info('Auction session updated', [
                'session_id' => $id,
                'admin_id'   => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم تحديث جلسة المزاد بنجاح',
                'data'    => $session->fresh()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Session update failed', ['error' => $e->getMessage(), 'id' => $id]);

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تحديث الجلسة'
            ], 500);
        }
    }

    /**
     * Remove the specified auction session.
     * DELETE /api/admin/sessions/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        $session = AuctionSession::withCount('auctions')->findOrFail($id);

        // ✅ Security: Cannot delete session with auctions
        if ($session->auctions_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن حذف جلسة تحتوي على مزادات. قم بنقل أو حذف المزادات أولاً.'
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

            $this->clearSessionCache($id);

            Log::info('Auction session deleted', [
                'session_id' => $id,
                'admin_id'   => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم حذف جلسة المزاد بنجاح'
            ]);

        } catch (\Exception $e) {
            Log::error('Session deletion failed', ['error' => $e->getMessage(), 'id' => $id]);

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء حذف الجلسة'
            ], 500);
        }
    }

    /**
     * Update the status of the specified auction session.
     * PATCH /api/admin/sessions/{id}/status
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['active', 'completed', 'cancelled'])],
        ]);

        $session = AuctionSession::findOrFail($id);

        // ✅ Validation: Cannot activate before session date
        if ($validated['status'] === 'active' && $session->session_date > now()) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن تفعيل الجلسة قبل تاريخها المحدد'
            ], 422);
        }

        // ✅ Security: Check for active live sessions
        if ($validated['status'] === 'active' && $session->type === 'live') {
            if ($this->hasActiveLiveSession($id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'يوجد جلسة مباشرة نشطة بالفعل'
                ], 422);
            }
        }

        try {
            DB::beginTransaction();

            $oldStatus = $session->status;
            $session->status = $validated['status'];
            $session->save();

            // Reset approved_for_live when activating
            if ($validated['status'] === 'active' && $oldStatus !== 'active') {
                $session->auctions()->update(['approved_for_live' => false]);
            }

            // End all auctions when completing/cancelling session
            if (in_array($validated['status'], ['completed', 'cancelled'])) {
                $session->auctions()
                    ->whereIn('status', AuctionStatus::activeValues())
                    ->update(['status' => AuctionStatus::ENDED->value]);
            }

            DB::commit();

            $this->clearSessionCache($id);

            // Broadcast
            try {
                broadcast(new UpdateSessionEvent($session))->toOthers();
            } catch (\Exception $e) {
                Log::warning('Status broadcast failed', ['error' => $e->getMessage()]);
            }

            Log::info('Session status updated', [
                'session_id' => $id,
                'old_status' => $oldStatus,
                'new_status' => $validated['status'],
                'admin_id'   => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم تحديث حالة الجلسة بنجاح',
                'data'    => $session
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Status update failed', ['error' => $e->getMessage(), 'id' => $id]);

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء تحديث الحالة'
            ], 500);
        }
    }

    /**
     * Get active and scheduled live sessions for dropdown.
     * GET /api/admin/sessions/active-scheduled
     */
    public function getActiveAndScheduledSessions(): JsonResponse
    {
        $sessions = AuctionSession::query()
            ->whereIn('status', ['scheduled', 'active'])
            ->where('type', 'live')
            ->orderBy('session_date', 'asc')
            ->get(['id', 'name', 'session_date', 'status', 'type']);

        return response()->json([
            'success' => true,
            'data'    => $sessions
        ]);
    }

    /**
     * Get session statistics.
     * GET /api/admin/sessions/stats
     */
    public function stats(): JsonResponse
    {
        $stats = Cache::remember('admin_session_stats', 300, function () {
            return [
                'total'      => AuctionSession::count(),
                'scheduled'  => AuctionSession::where('status', 'scheduled')->count(),
                'active'     => AuctionSession::where('status', 'active')->count(),
                'completed'  => AuctionSession::where('status', 'completed')->count(),
                'cancelled'  => AuctionSession::where('status', 'cancelled')->count(),
                'by_type'    => AuctionSession::select('type', DB::raw('COUNT(*) as count'))
                    ->groupBy('type')
                    ->pluck('count', 'type'),
                'upcoming'   => AuctionSession::where('status', 'scheduled')
                    ->where('session_date', '>=', now())
                    ->count(),
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $stats,
        ]);
    }

    /**
     * Check if there's an active live session.
     */
    private function hasActiveLiveSession(?string $excludeId = null): bool
    {
        $query = AuctionSession::where('type', 'live')
            ->where('status', 'active');

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    /**
     * Clear session-related cache.
     */
    private function clearSessionCache(?string $sessionId = null): void
    {
        Cache::forget('active_live_sessions_page_1');
        Cache::forget('active_scheduled_sessions');
        Cache::forget('admin_session_stats');

        if ($sessionId) {
            Cache::forget("live_session_{$sessionId}");
        }
    }
}

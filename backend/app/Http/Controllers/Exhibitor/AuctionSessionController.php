<?php

namespace App\Http\Controllers\Exhibitor;

use App\Http\Controllers\Controller;
use App\Models\AuctionSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class AuctionSessionController extends Controller
{
    /**
     * رجّع كل جلسات صاحب المعرض الحالي (أو الأدمن يشوف كل جلساته الخاصّة به أيضًا عبر نفس الإندبوينت)
     * GET /api/exhibitor/sessions
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = AuctionSession::query()
            ->withCount('auctions')
            ->orderByDesc('session_date');

        // الأدمن مسموح له بكل شيء، لكن هذا إندبوينت المعرض → رجّع جلساته هو فقط أيضًا
        // ولو عاوز الأدمن يشوف "كل" الجلسات من هنا، شيل where دي.
        $query->where('user_id', $user->id);

        // فلترة اختيارية بالـ status/type/name
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }
        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }
        if ($request->filled('search')) {
            $s = $request->string('search');
            $query->where('name', 'like', "%{$s}%");
        }

        $sessions = $query->get([
            'id', 'user_id', 'name', 'description', 'session_date', 'status', 'type', 'created_at', 'updated_at'
        ]);

        return response()->json([
            'success' => true,
            'data'    => $sessions,
        ]);
    }

    /**
     * إنشاء جلسة جديدة
     * POST /api/exhibitor/sessions
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'         => ['required', 'string', 'max:255'],
            'description'  => ['nullable', 'string'],
            'session_date' => ['required', 'date'],
            'status'       => ['required', Rule::in(['scheduled', 'active', 'completed', 'cancelled'])],
            'type'         => ['required', Rule::in(['live', 'instant', 'silent'])],
        ]);

        $session = AuctionSession::create([
            'user_id'      => $user->id,
            'name'         => $validated['name'],
            'description'  => $validated['description'] ?? null,
            'session_date' => $validated['session_date'],
            'status'       => $validated['status'],
            'type'         => $validated['type'],
        ]);

        // أعدّه بنفس تنسيق الـ Admin
        $session->loadCount('auctions');

        return response()->json([
            'success' => true,
            'data'    => $session,
            'message' => 'تم إنشاء الجلسة بنجاح.',
        ], 201);
    }

    /**
     * عرض جلسة واحدة (لازم تكون ملك المستخدم أو هو أدمن)
     * GET /api/exhibitor/sessions/{id}
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();

        $session = AuctionSession::with(['auctions.car'])
            ->withCount('auctions')
            ->findOrFail($id);

        // تحقّق الملكية (الأدمن يمر)
        if ($session->user_id !== $user->id && strtolower((string)$user->role) !== 'admin') {
            return response()->json(['message' => 'Forbidden. You do not own this session.'], 403);
        }

        return response()->json([
            'success' => true,
            'data'    => $session,
        ]);
    }

    /**
     * تعديل الجلسة (مالكها فقط أو أدمن)
     * PUT /api/exhibitor/sessions/{id}
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();

        $session = AuctionSession::findOrFail($id);

        if ($session->user_id !== $user->id && strtolower((string)$user->role) !== 'admin') {
            return response()->json(['message' => 'Forbidden. You do not own this session.'], 403);
        }

        $validated = $request->validate([
            'name'         => ['sometimes', 'required', 'string', 'max:255'],
            'description'  => ['nullable', 'string'],
            'session_date' => ['sometimes', 'required', 'date'],
            'status'       => ['sometimes', 'required', Rule::in(['scheduled', 'active', 'completed', 'cancelled'])],
            'type'         => ['sometimes', 'required', Rule::in(['live', 'instant', 'silent'])],
        ]);

        $session->fill($validated);
        $session->save();

        $session->loadCount('auctions');

        return response()->json([
            'success' => true,
            'data'    => $session,
            'message' => 'تم تحديث الجلسة بنجاح.',
        ]);
    }

    /**
     * تحديث حالة الجلسة فقط
     * POST /api/exhibitor/sessions/{id}/status  { status: 'active'|'completed'|'cancelled' }
     */
    public function updateStatus(Request $request, $id)
    {
        $user = $request->user();

        $session = AuctionSession::findOrFail($id);

        if ($session->user_id !== $user->id && strtolower((string)$user->role) !== 'admin') {
            return response()->json(['message' => 'Forbidden. You do not own this session.'], 403);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['active', 'completed', 'cancelled'])],
        ]);

        $session->status = $validated['status'];
        $session->save();

        return response()->json([
            'success' => true,
            'data'    => $session,
            'message' => 'تم تحديث حالة الجلسة.',
        ]);
    }

    /**
     * حذف الجلسة (مالكها فقط أو أدمن) بشرط ألا تحتوي مزادات
     * DELETE /api/exhibitor/sessions/{id}
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        $session = AuctionSession::withCount('auctions')->findOrFail($id);

        if ($session->user_id !== $user->id && strtolower((string)$user->role) !== 'admin') {
            return response()->json(['message' => 'Forbidden. You do not own this session.'], 403);
        }

        if ($session->auctions_count > 0) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن حذف جلسة تحتوي على مزادات.',
            ], 422);
        }

        $session->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الجلسة بنجاح.',
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\MarketArticle;
use App\Models\MarketComment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MarketCommentController extends Controller
{
    /**
     * GET /api/market-council/articles/{id}/comments
     * Public: list approved comments only, oldest first.
     * Returns safe public fields: id, content, created_at, user display name.
     */
    public function index(int $id): JsonResponse
    {
        $article = MarketArticle::query()->published()->find($id);
        if (!$article) {
            return response()->json([
                'success' => false,
                'message' => 'المقال غير موجود',
            ], 404);
        }

        $comments = MarketComment::query()
            ->where('article_id', $id)
            ->whereNull('parent_id')
            ->approved()
            ->with(['user:id,first_name,last_name'])
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function (MarketComment $c) {
                $user = $c->user;
                $displayName = $user
                    ? trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''))
                    : 'مستخدم';
                if (empty(trim($displayName))) {
                    $displayName = 'مستخدم';
                }
                return [
                    'id'         => $c->id,
                    'content'    => $c->content,
                    'created_at' => $c->created_at?->toIso8601String(),
                    'user_name'  => $displayName,
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $comments,
        ]);
    }

    /**
     * POST /api/market-council/articles/{id}/comments
     * Authenticated only. Creates top-level comment with status=pending.
     * Does not increment comments_count (only approved comments count).
     */
    public function store(Request $request, int $id): JsonResponse
    {
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'يجب تسجيل الدخول لإضافة تعليق',
            ], 401);
        }

        $article = MarketArticle::query()->published()->find($id);
        if (!$article) {
            return response()->json([
                'success' => false,
                'message' => 'المقال غير موجود',
            ], 404);
        }

        $validated = $request->validate([
            'content' => 'required|string|min:3|max:2000',
        ]);

        $content = trim(strip_tags($validated['content']));
        if ($content === '' || strlen($content) < 3) {
            return response()->json([
                'success' => false,
                'message' => 'المحتوى مطلوب (3 أحرف على الأقل)',
            ], 422);
        }

        $comment = MarketComment::create([
            'article_id' => $id,
            'user_id'    => Auth::id(),
            'parent_id'  => null,
            'content'    => $content,
            'status'     => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم استلام تعليقك وسيظهر بعد المراجعة',
            'data'    => [
                'id' => $comment->id,
            ],
        ]);
    }
}

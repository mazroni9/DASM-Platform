<?php

namespace App\Http\Controllers;

use App\Models\MarketComment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CouncilCommentStudioController extends Controller
{
    /**
     * GET /api/council-studio/comments
     */
    public function index(Request $request): JsonResponse
    {
        if (!Auth::user()?->can('council.comment.review')) {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 403);
        }

        $query = MarketComment::query()
            ->with([
                'user:id,first_name,last_name,email',
                'article:id,title_ar,slug',
                'parent:id,content',
            ])
            ->orderByDesc('updated_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('type')) {
            if ($request->type === 'comment') {
                $query->whereNull('parent_id');
            } elseif ($request->type === 'reply') {
                $query->whereNotNull('parent_id');
            }
        }
        if ($request->filled('article_id')) {
            $query->where('article_id', (int) $request->article_id);
        }

        if ($request->filled('count_only') && $request->count_only === '1') {
            return response()->json([
                'success' => true,
                'count'   => $query->count(),
            ]);
        }

        $perPage = min(50, max(1, (int) $request->get('per_page', 15)));

        return response()->json([
            'success' => true,
            'data'    => $query->paginate($perPage),
        ]);
    }

    /**
     * GET /api/council-studio/comments/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        if (!Auth::user()?->can('council.comment.review')) {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 403);
        }

        $comment = MarketComment::with([
            'user:id,first_name,last_name,email',
            'article:id,title_ar,slug',
            'parent:id,content',
        ])->find($id);

        if (!$comment) {
            return response()->json(['success' => false, 'message' => 'التعليق غير موجود'], 404);
        }

        return response()->json(['success' => true, 'data' => $comment]);
    }

    /**
     * PATCH /api/council-studio/comments/{id}
     * Only allows status change.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        if (!Auth::user()?->can('council.comment.review')) {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 403);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,approved,rejected,hidden',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $comment = MarketComment::find($id);
        if (!$comment) {
            return response()->json(['success' => false, 'message' => 'التعليق غير موجود'], 404);
        }

        $from = $comment->status;
        $to = $request->status;

        $transition = $this->validateStatusTransition($from, $to);
        if (!$transition['allowed']) {
            return response()->json([
                'success' => false,
                'message' => $transition['message'] ?? 'انتقال الحالة غير مسموح',
            ], 422);
        }

        $previousStatus = $comment->status;

        DB::transaction(function () use ($comment, $to, $previousStatus) {
            $comment->status = $to;
            $comment->save();

            $article = $comment->article;
            if ($article) {
                if ($previousStatus !== 'approved' && $to === 'approved') {
                    $article->increment('comments_count');
                } elseif ($previousStatus === 'approved' && $to !== 'approved') {
                    DB::table('market_articles')
                        ->where('id', $article->id)
                        ->where('comments_count', '>', 0)
                        ->decrement('comments_count');
                }
            }
        });

        $comment->refresh();

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث حالة التعليق',
            'data'    => $comment->load(['user:id,first_name,last_name,email', 'article:id,title_ar,slug']),
        ]);
    }

    /**
     * Validate status transition. Returns ['allowed' => bool, 'message' => ?string].
     * pending -> approved
     * pending -> rejected
     * approved -> hidden
     * hidden -> approved
     * rejected -> pending
     */
    private function validateStatusTransition(string $from, string $to): array
    {
        if ($from === $to) {
            return ['allowed' => true];
        }

        $allowed = [
            'pending'  => ['approved', 'rejected'],
            'approved' => ['hidden'],
            'hidden'   => ['approved'],
            'rejected' => ['pending'],
        ];

        if (!isset($allowed[$from]) || !in_array($to, $allowed[$from], true)) {
            return ['allowed' => false, 'message' => 'انتقال غير مسموح من ' . $from . ' إلى ' . $to];
        }

        return ['allowed' => true];
    }
}

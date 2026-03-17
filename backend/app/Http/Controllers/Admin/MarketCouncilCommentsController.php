<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MarketComment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class MarketCouncilCommentsController extends Controller
{
    /**
     * GET /api/admin/market-council/comments
     */
    public function index(Request $request): JsonResponse
    {
        $query = MarketComment::query()
            ->with(['article:id,title_ar,slug', 'user:id,first_name,last_name,email']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('article_id')) {
            $query->where('article_id', (int) $request->article_id);
        }

        $query->orderByDesc('created_at');

        $perPage = min(50, max(1, (int) $request->get('per_page', 15)));

        return response()->json([
            'success' => true,
            'data'    => $query->paginate($perPage),
        ]);
    }

    /**
     * PUT /api/admin/market-council/comments/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,approved,hidden',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $comment = MarketComment::find($id);
        if (!$comment) {
            return response()->json([
                'success' => false,
                'message' => 'التعليق غير موجود',
            ], 404);
        }

        $previousStatus = $comment->status;
        $newStatus = $request->status;

        DB::transaction(function () use ($comment, $previousStatus, $newStatus) {
            $comment->status = $newStatus;
            $comment->save();

            $article = $comment->article;
            if ($article) {
                if ($previousStatus !== 'approved' && $newStatus === 'approved') {
                    $article->increment('comments_count');
                } elseif ($previousStatus === 'approved' && $newStatus !== 'approved') {
                    DB::table('market_articles')
                        ->where('id', $article->id)
                        ->where('comments_count', '>', 0)
                        ->decrement('comments_count');
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث حالة التعليق',
            'data'    => $comment,
        ]);
    }

    /**
     * DELETE /api/admin/market-council/comments/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $comment = MarketComment::find($id);
        if (!$comment) {
            return response()->json([
                'success' => false,
                'message' => 'التعليق غير موجود',
            ], 404);
        }
        $article = $comment->article;
        $wasApproved = $comment->status === 'approved';

        DB::transaction(function () use ($comment, $article, $wasApproved) {
            $comment->delete();
            if ($article && $wasApproved) {
                DB::table('market_articles')
                    ->where('id', $article->id)
                    ->where('comments_count', '>', 0)
                    ->decrement('comments_count');
            }
        });
        return response()->json(['success' => true, 'message' => 'تم حذف التعليق']);
    }
}

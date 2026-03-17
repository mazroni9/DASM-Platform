<?php

namespace App\Http\Controllers;

use App\Models\MarketArticle;
use App\Models\MarketReaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class MarketReactionController extends Controller
{
    /**
     * POST /api/market-council/articles/{id}/react
     * Add a reaction for the authenticated user.
     * Body: { type: 'like'|'save'|'helpful' }
     * Idempotent: if already reacted, returns success.
     */
    public function store(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:' . implode(',', MarketReaction::TYPES)],
        ]);
        $type = (string) $validated['type'];

        $article = MarketArticle::query()->published()->find($id);
        if (!$article) {
            return response()->json([
                'success' => false,
                'message' => 'المقال غير موجود',
            ], 404);
        }

        $userId = Auth::id();
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'يجب تسجيل الدخول',
            ], 401);
        }

        $existing = MarketReaction::query()
            ->where('article_id', $id)
            ->where('user_id', $userId)
            ->where('type', $type)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => true,
                'message' => 'لديك رد فعل بالفعل',
                'data' => [
                    'reaction' => $type,
                    'active' => true,
                    'counts' => $this->getCounts($article),
                ],
            ]);
        }

        DB::transaction(function () use ($article, $userId, $type) {
            MarketReaction::create([
                'article_id' => $article->id,
                'user_id' => $userId,
                'type' => $type,
            ]);
            $this->incrementCount($article, $type);
        });

        $article->refresh();

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل رد فعلك',
            'data' => [
                'reaction' => $type,
                'active' => true,
                'counts' => $this->getCounts($article),
            ],
        ]);
    }

    /**
     * DELETE /api/market-council/articles/{id}/react
     * Remove a reaction for the authenticated user.
     * Query: ?type=like|save|helpful
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $type = $request->query('type', '');
        if (!in_array($type, MarketReaction::TYPES, true)) {
            return response()->json([
                'success' => false,
                'message' => 'نوع غير صالح',
            ], 422);
        }

        $article = MarketArticle::query()->published()->find($id);
        if (!$article) {
            return response()->json([
                'success' => false,
                'message' => 'المقال غير موجود',
            ], 404);
        }

        $userId = Auth::id();
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'يجب تسجيل الدخول',
            ], 401);
        }

        $existing = MarketReaction::query()
            ->where('article_id', $id)
            ->where('user_id', $userId)
            ->where('type', $type)
            ->first();

        if (!$existing) {
            return response()->json([
                'success' => true,
                'message' => 'لم تكن لديك رد فعل',
                'data' => [
                    'reaction' => $type,
                    'active' => false,
                    'counts' => $this->getCounts($article),
                ],
            ]);
        }

        DB::transaction(function () use ($article, $existing, $type) {
            $existing->delete();
            $this->decrementCount($article, $type);
        });

        $article->refresh();

        return response()->json([
            'success' => true,
            'message' => 'تم إلغاء رد فعلك',
            'data' => [
                'reaction' => $type,
                'active' => false,
                'counts' => $this->getCounts($article),
            ],
        ]);
    }

    private function getCounts(MarketArticle $article): array
    {
        return [
            'likes_count' => (int) $article->likes_count,
            'saves_count' => (int) $article->saves_count,
            'helpful_count' => (int) $article->helpful_count,
        ];
    }

    private function incrementCount(MarketArticle $article, string $type): void
    {
        $column = $type . '_count';
        if (in_array($column, ['likes_count', 'saves_count', 'helpful_count'], true)) {
            $article->increment($column);
        }
    }

    private function decrementCount(MarketArticle $article, string $type): void
    {
        $column = $type . '_count';
        if (in_array($column, ['likes_count', 'saves_count', 'helpful_count'], true)) {
            \Illuminate\Support\Facades\DB::table('market_articles')
                ->where('id', $article->id)
                ->where($column, '>', 0)
                ->decrement($column);
        }
    }
}

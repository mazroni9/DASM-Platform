<?php

namespace App\Http\Controllers;

use App\Models\MarketCategory;
use App\Models\MarketArticle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MarketCouncilController extends Controller
{
    private const ALLOWED_CONTEXT_TYPES = [
        'car_detail',
        'auction_live',
        'auction_instant',
        'auction_delayed',
        'finance',
        'seller',
        'buyer',
        'trader',
    ];

    /**
     * GET /api/market-council/recommended
     * Public: context-based article recommendations.
     * Params: context_type (required), limit (optional), exclude_article_id (optional), featured (optional), category (optional)
     * Returns published articles matching context_type, ordered by featured first, then published_at desc.
     * Fallback: if fewer than limit context-matching articles, fill remaining slots with recent published (excluding current).
     */
    public function recommended(Request $request): JsonResponse
    {
        $contextType = $request->query('context_type', '');
        if (!in_array($contextType, self::ALLOWED_CONTEXT_TYPES, true)) {
            return response()->json([
                'success' => false,
                'message' => 'نوع السياق غير صالح',
            ], 422);
        }

        $limit = min(10, max(1, (int) $request->query('limit', 3)));
        $excludeId = $request->filled('exclude_article_id') ? (int) $request->exclude_article_id : null;
        $featured = $request->boolean('featured');
        $categorySlug = $request->query('category', '');

        $query = MarketArticle::query()
            ->with(['category:id,name_ar,name_en,slug'])
            ->published()
            ->whereHas('contexts', fn ($q) => $q->where('context_type', $contextType));

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        if ($featured) {
            $query->featured();
        }
        if ($categorySlug !== '') {
            $query->whereHas('category', function ($q) use ($categorySlug) {
                if (is_numeric($categorySlug)) {
                    $q->where('id', (int) $categorySlug);
                } else {
                    $q->where('slug', $categorySlug);
                }
            });
        }

        $query->orderByRaw('is_featured DESC')
            ->orderByDesc('published_at')
            ->orderByDesc('id');

        $articles = $query->limit($limit)->get();

        $strictContext = $request->boolean('strict_context');
        if (!$strictContext && $articles->count() < $limit) {
            $excludeIds = $articles->pluck('id')->all();
            if ($excludeId) {
                $excludeIds[] = $excludeId;
            }
            $excludeIds = array_values(array_unique(array_filter($excludeIds)));
            $fallbackQuery = MarketArticle::query()
                ->with(['category:id,name_ar,name_en,slug'])
                ->published();
            if (!empty($excludeIds)) {
                $fallbackQuery->whereNotIn('id', $excludeIds);
            }
            $fallbackQuery->orderByRaw('is_featured DESC')
                ->orderByDesc('published_at')
                ->orderByDesc('id')
                ->limit($limit - $articles->count());
            $fallback = $fallbackQuery->get();
            $articles = $articles->merge($fallback)->take($limit)->values();
        }

        return response()->json([
            'success' => true,
            'data'    => $articles->toArray(),
        ]);
    }

    /**
     * GET /api/market-council/categories
     * Public: list active categories (id, name_ar, name_en, slug, description, sort_order)
     * Order: sort_order asc, id asc
     */
    public function categories(): JsonResponse
    {
        $categories = MarketCategory::query()
            ->active()
            ->ordered()
            ->withCount(['articles' => fn ($q) => $q->published()])
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $categories,
        ]);
    }

    /**
     * GET /api/market-council/articles
     * Public: list published articles with pagination
     * Filters: category (slug), featured (bool), per_page
     * Order: featured first, then published_at desc, then id desc
     */
    public function articles(Request $request): JsonResponse
    {
        $query = MarketArticle::query()
            ->with(['category:id,name_ar,name_en,slug'])
            ->published();

        if ($request->filled('category')) {
            $cat = $request->category;
            $query->whereHas('category', function ($q) use ($cat) {
                if (is_numeric($cat)) {
                    $q->where('id', (int) $cat);
                } else {
                    $q->where('slug', $cat);
                }
            });
        }

        if ($request->boolean('featured')) {
            $query->featured();
        }

        if ($request->filled('context_type')) {
            $ctx = $request->context_type;
            $query->whereHas('contexts', fn ($q) => $q->where('context_type', $ctx));
        }

        $query->orderByRaw('is_featured DESC')
            ->orderByDesc('published_at')
            ->orderByDesc('id');

        $perPage = min(50, max(1, (int) $request->get('per_page', 10)));

        return response()->json([
            'success' => true,
            'data'    => $query->paginate($perPage),
        ]);
    }

    /**
     * GET /api/market-council/articles/{slug}
     * Public: show published article by slug
     * Includes: full article, category, contexts, comments_count (stored)
     * Increments views_count on view
     */
    public function showArticle(string $slug): JsonResponse
    {
        $article = MarketArticle::query()
            ->with([
                'category:id,name_ar,name_en,slug',
                'contexts',
            ])
            ->where('slug', $slug)
            ->published()
            ->first();

        if (!$article) {
            return response()->json([
                'success' => false,
                'message' => 'المقال غير موجود',
            ], 404);
        }

        $article->increment('views_count');

        $data = $article->toArray();
        // Ensure comments_count reflects approved comments only (handles any historical drift)
        $data['comments_count'] = $article->comments()->approved()->whereNull('parent_id')->count();

        if (Auth::check()) {
            $userReactions = $article->reactions()
                ->where('user_id', Auth::id())
                ->pluck('type')
                ->toArray();
            $data['user_reactions'] = $userReactions;
        } else {
            $data['user_reactions'] = [];
        }

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MarketArticle;
use App\Models\MarketArticleContext;
use App\Models\MarketCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;

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

    // =========================================================
    // Articles
    // =========================================================

    /**
     * GET /api/admin/market-council/articles
     */
    public function articlesIndex(Request $request): JsonResponse
    {
        $query = MarketArticle::query()->with(['category:id,name_ar,name_en,slug']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('category_id')) {
            $query->where('category_id', (int) $request->category_id);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title_ar', 'like', "%{$search}%")
                    ->orWhere('excerpt_ar', 'like', "%{$search}%")
                    ->orWhere('content_ar', 'like', "%{$search}%");
            });
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['created_at', 'published_at', 'title_ar', 'views_count'];
        if (!in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'created_at';
        }
        $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');

        $perPage = min(50, max(1, (int) $request->get('per_page', 15)));

        return response()->json([
            'success' => true,
            'data'    => $query->paginate($perPage),
        ]);
    }

    /**
     * GET /api/admin/market-council/articles/{id}
     */
    public function articlesShow(int $id): JsonResponse
    {
        $article = MarketArticle::with(['category', 'contexts'])
            ->find($id);

        if (!$article) {
            return response()->json([
                'success' => false,
                'message' => 'المقال غير موجود',
            ], 404);
        }

        return response()->json(['success' => true, 'data' => $article]);
    }

    /**
     * Sanitize slug to ASCII-only (a-z, 0-9, hyphen). Fallback when empty.
     */
    private function sanitizeSlug(string $input, string $titleAr, ?string $titleEn = null): string
    {
        $s = preg_replace('/[^a-z0-9-]/', '-', strtolower(trim($input)));
        $s = preg_replace('/-+/', '-', trim($s, '-'));
        if ($s !== '') {
            return $s;
        }
        $fromEn = preg_replace('/[^a-z0-9-]/', '-', strtolower(trim($titleEn ?? '')));
        $fromEn = preg_replace('/-+/', '-', trim($fromEn, '-'));
        $fromAr = preg_replace('/[^a-z0-9-]/', '-', strtolower(Str::slug($titleAr)));
        $fromAr = preg_replace('/-+/', '-', trim($fromAr, '-'));
        $candidate = $fromEn ?: $fromAr;
        return $candidate !== '' ? $candidate : 'article-' . uniqid('', false);
    }

    /**
     * POST /api/admin/market-council/articles
     */
    public function storeArticle(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title_ar'     => 'required|string|max:255',
            'title_en'     => 'nullable|string|max:255',
            'slug'         => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'],
            'category_id'  => 'required|integer|exists:market_categories,id',
            'excerpt_ar'   => 'nullable|string|max:1000',
            'excerpt_en'   => 'nullable|string|max:1000',
            'content_ar'   => 'required|string',
            'content_en'   => 'nullable|string',
            'cover_image'  => 'nullable|string|max:2048',
            'author_name'  => 'nullable|string|max:255',
            'read_time'    => 'nullable|integer|min:0|max:999',
            'status'       => 'required|in:draft,pending_review,published,rejected,archived',
            'published_at' => 'nullable|date',
            'is_featured'  => 'nullable|boolean',
            'contexts'     => 'nullable|array',
            'contexts.*'   => 'array',
            'contexts.*.context_type' => 'required|string|in:' . implode(',', self::ALLOWED_CONTEXT_TYPES),
            'contexts.*.context_key'  => 'nullable|string|max:255',
        ], [
            'slug.regex' => 'الرابط يجب أن يحتوي على حروف إنجليزية صغيرة وأرقام وشرطات فقط (مثال: my-article-title)',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $slugBase = $this->sanitizeSlug(
            $request->filled('slug') ? $request->slug : '',
            $request->title_ar,
            $request->title_en
        );
        $slug = $slugBase;
        $i = 1;
        while (MarketArticle::where('slug', $slug)->exists()) {
            $slug = $slugBase . '-' . ($i++);
        }

        $article = new MarketArticle();
        $article->category_id  = $request->category_id;
        $article->title_ar    = $request->title_ar;
        $article->title_en    = $request->title_en;
        $article->slug        = $slug;
        $article->excerpt_ar  = $request->excerpt_ar;
        $article->excerpt_en  = $request->excerpt_en;
        $article->content_ar  = $request->content_ar;
        $article->content_en  = $request->content_en;
        $article->cover_image = $request->cover_image;
        $article->author_name = $request->author_name;
        $article->read_time   = (int) ($request->read_time ?? 1);
        $article->status      = $request->status;
        $article->is_featured = (bool) ($request->is_featured ?? false);

        if ($request->status === 'published') {
            $article->published_at = $request->published_at ?: now();
        } elseif ($request->filled('published_at')) {
            $article->published_at = $request->published_at;
        }

        $article->save();

        $this->syncArticleContexts($article, $request->input('contexts', []));

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء المقال',
            'data'    => $article->load(['category', 'contexts']),
        ], 201);
    }

    /**
     * PUT /api/admin/market-council/articles/{id}
     */
    public function updateArticle(Request $request, int $id): JsonResponse
    {
        $article = MarketArticle::find($id);
        if (!$article) {
            return response()->json([
                'success' => false,
                'message' => 'المقال غير موجود',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'title_ar'     => 'sometimes|required|string|max:255',
            'title_en'     => 'nullable|string|max:255',
            'slug'         => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'],
            'category_id'  => 'sometimes|required|integer|exists:market_categories,id',
            'excerpt_ar'   => 'nullable|string|max:1000',
            'excerpt_en'   => 'nullable|string|max:1000',
            'content_ar'   => 'sometimes|required|string',
            'content_en'   => 'nullable|string',
            'cover_image'  => 'nullable|string|max:2048',
            'author_name'  => 'nullable|string|max:255',
            'read_time'    => 'nullable|integer|min:0|max:999',
            'status'       => 'sometimes|required|in:draft,pending_review,published,rejected,archived',
            'published_at' => 'nullable|date',
            'is_featured'  => 'nullable|boolean',
            'contexts'     => 'nullable|array',
            'contexts.*'   => 'array',
            'contexts.*.context_type' => 'required|string|in:' . implode(',', self::ALLOWED_CONTEXT_TYPES),
            'contexts.*.context_key'  => 'nullable|string|max:255',
        ], [
            'slug.regex' => 'الرابط يجب أن يحتوي على حروف إنجليزية صغيرة وأرقام وشرطات فقط (مثال: my-article-title)',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        if ($request->has('contexts')) {
            $this->syncArticleContexts($article, $request->input('contexts', []));
        }

        if ($request->has('title_ar')) {
            $article->title_ar = $request->title_ar;
        }
        if ($request->has('title_en')) {
            $article->title_en = $request->title_en;
        }
        if ($request->has('category_id')) {
            $article->category_id = $request->category_id;
        }
        if ($request->has('excerpt_ar')) {
            $article->excerpt_ar = $request->excerpt_ar;
        }
        if ($request->has('excerpt_en')) {
            $article->excerpt_en = $request->excerpt_en;
        }
        if ($request->has('content_ar')) {
            $article->content_ar = $request->content_ar;
        }
        if ($request->has('content_en')) {
            $article->content_en = $request->content_en;
        }
        if ($request->has('cover_image')) {
            $article->cover_image = $request->cover_image;
        }
        if ($request->has('author_name')) {
            $article->author_name = $request->author_name;
        }
        if ($request->has('read_time')) {
            $article->read_time = (int) $request->read_time;
        }
        if ($request->has('is_featured')) {
            $article->is_featured = (bool) $request->is_featured;
        }
        if ($request->has('status')) {
            $article->status = $request->status;
            if ($request->status === 'published' && !$article->published_at) {
                $article->published_at = now();
            } elseif ($request->status !== 'published') {
                $article->published_at = null;
            }
        }
        if ($request->has('published_at')) {
            $article->published_at = $request->published_at ?: null;
        }

        if ($request->filled('slug')) {
            $slugBase = $this->sanitizeSlug($request->slug, $article->title_ar, $article->title_en);
            $slug = $slugBase;
            $i = 1;
            while (MarketArticle::where('slug', $slug)->where('id', '!=', $id)->exists()) {
                $slug = $slugBase . '-' . ($i++);
            }
            $article->slug = $slug;
        }

        $article->save();

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث المقال',
            'data'    => $article->load(['category', 'contexts']),
        ]);
    }

    /**
     * Replace article contexts with the given list. Validates context_type against allowed values.
     */
    private function syncArticleContexts(MarketArticle $article, array $contexts): void
    {
        $article->contexts()->delete();

        $valid = [];
        foreach ($contexts as $ctx) {
            $type = is_array($ctx) ? ($ctx['context_type'] ?? '') : '';
            if (!in_array($type, self::ALLOWED_CONTEXT_TYPES, true)) {
                continue;
            }
            $key = is_array($ctx) && isset($ctx['context_key']) ? (string) $ctx['context_key'] : null;
            $key = $key !== '' ? $key : null;
            $valid[] = ['context_type' => $type, 'context_key' => $key];
        }

        foreach ($valid as $v) {
            MarketArticleContext::create([
                'article_id'   => $article->id,
                'context_type' => $v['context_type'],
                'context_key'  => $v['context_key'],
            ]);
        }
    }

    /**
     * POST /api/admin/market-council/articles/{id}/status
     */
    public function articlesToggleStatus(Request $request, int $id): JsonResponse
    {
        $article = MarketArticle::find($id);
        if (!$article) {
            return response()->json([
                'success' => false,
                'message' => 'المقال غير موجود',
            ], 404);
        }

        $status = $request->input('status', $article->status === 'published' ? 'draft' : 'published');
        if (!in_array($status, ['draft', 'published', 'archived'], true)) {
            return response()->json(['success' => false, 'message' => 'حالة غير صالحة'], 422);
        }

        $article->status = $status;
        if ($status === 'published' && !$article->published_at) {
            $article->published_at = now();
        } elseif ($status !== 'published') {
            $article->published_at = null;
        }
        $article->save();

        return response()->json([
            'success' => true,
            'message' => $status === 'published' ? 'تم نشر المقال' : 'تم تغيير الحالة',
            'data'    => $article,
        ]);
    }

    /**
     * DELETE /api/admin/market-council/articles/{id}
     */
    public function destroyArticle(int $id): JsonResponse
    {
        $article = MarketArticle::find($id);
        if (!$article) {
            return response()->json([
                'success' => false,
                'message' => 'المقال غير موجود',
            ], 404);
        }
        $article->delete();
        return response()->json(['success' => true, 'message' => 'تم حذف المقال']);
    }

    // =========================================================
    // Categories
    // =========================================================

    /**
     * GET /api/admin/market-council/categories/{id}
     */
    public function categoriesShow(int $id): JsonResponse
    {
        $cat = MarketCategory::withCount('articles')->find($id);

        if (!$cat) {
            return response()->json([
                'success' => false,
                'message' => 'التصنيف غير موجود',
            ], 404);
        }

        return response()->json(['success' => true, 'data' => $cat]);
    }

    /**
     * GET /api/admin/market-council/categories
     */
    public function categoriesIndex(): JsonResponse
    {
        $cats = MarketCategory::query()
            ->withCount('articles')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json(['success' => true, 'data' => $cats]);
    }

    /**
     * POST /api/admin/market-council/categories
     */
    public function categoriesStore(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name_ar'     => 'required|string|max:255',
            'name_en'     => 'nullable|string|max:255',
            'slug'        => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'sort_order'  => 'nullable|integer|min:0',
            'is_active'   => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $slugBase = $request->filled('slug') ? Str::slug($request->slug) : Str::slug($request->name_ar);
        $slug = $slugBase;
        $i = 1;
        while (MarketCategory::where('slug', $slug)->exists()) {
            $slug = $slugBase . '-' . ($i++);
        }

        $cat = MarketCategory::create([
            'name_ar'     => $request->name_ar,
            'name_en'     => $request->name_en,
            'slug'        => $slug,
            'description' => $request->description,
            'sort_order'  => (int) ($request->sort_order ?? 0),
            'is_active'   => (bool) ($request->is_active ?? true),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء التصنيف',
            'data'    => $cat,
        ], 201);
    }

    /**
     * PUT /api/admin/market-council/categories/{id}
     */
    public function categoriesUpdate(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name_ar'     => 'sometimes|required|string|max:255',
            'name_en'     => 'nullable|string|max:255',
            'slug'        => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'sort_order'  => 'nullable|integer|min:0',
            'is_active'   => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $cat = MarketCategory::findOrFail($id);

        if ($request->has('name_ar')) {
            $cat->name_ar = $request->name_ar;
        }
        if ($request->has('name_en')) {
            $cat->name_en = $request->name_en;
        }
        if ($request->has('description')) {
            $cat->description = $request->description;
        }
        if ($request->has('sort_order')) {
            $cat->sort_order = (int) $request->sort_order;
        }
        if ($request->has('is_active')) {
            $cat->is_active = (bool) $request->is_active;
        }

        if ($request->filled('slug')) {
            $slugBase = Str::slug($request->slug);
            $slug = $slugBase;
            $i = 1;
            while (MarketCategory::where('slug', $slug)->where('id', '!=', $id)->exists()) {
                $slug = $slugBase . '-' . ($i++);
            }
            $cat->slug = $slug;
        } elseif ($request->has('name_ar')) {
            $slugBase = Str::slug($cat->name_ar);
            $slug = $slugBase;
            $i = 1;
            while (MarketCategory::where('slug', $slug)->where('id', '!=', $id)->exists()) {
                $slug = $slugBase . '-' . ($i++);
            }
            $cat->slug = $slug;
        }

        $cat->save();

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث التصنيف',
            'data'    => $cat,
        ]);
    }

    /**
     * DELETE /api/admin/market-council/categories/{id}
     */
    public function categoriesDestroy(int $id): JsonResponse
    {
        try {
            $cat = MarketCategory::findOrFail($id);
            $cat->delete();
            return response()->json(['success' => true, 'message' => 'تم حذف التصنيف']);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء حذف التصنيف'], 500);
        }
    }
}

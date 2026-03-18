<?php

namespace App\Http\Controllers;

use App\Models\MarketArticle;
use App\Models\MarketArticleContext;
use App\Models\MarketCategory;
use App\Models\MarketComment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CouncilStudioController extends Controller
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
     * Dashboard stats for Council Studio (permission-gated).
     */
    public function dashboard(Request $request): JsonResponse
    {
        if (!Auth::user()?->can('council.studio.access')) {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 403);
        }

        $user = Auth::user();
        $stats = [];

        if ($user->can('council.article.create') || $user->can('council.article.edit_own')) {
            $stats['my_articles'] = MarketArticle::where('created_by_user_id', $user->id)->count();
        }
        if ($user->can('council.article.review') || $user->can('council.article.edit_any')) {
            $stats['pending_review'] = MarketArticle::where('status', 'pending_review')->count();
        }
        if ($user->can('council.article.publish') || $user->can('council.article.review')) {
            $stats['published'] = MarketArticle::where('status', 'published')->count();
        }
        if ($user->can('council.comment.review')) {
            $stats['pending_comments'] = MarketComment::where('status', 'pending')->count();
        }

        return response()->json(['success' => true, 'data' => $stats]);
    }

    /**
     * List articles for "مقالاتي" — ownership enforced.
     * Writer (edit_own/create only): own articles only.
     * Editor/Reviewer/Publisher: all articles.
     */
    public function articles(Request $request): JsonResponse
    {
        if (!Auth::user()?->can('council.studio.access')) {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 403);
        }

        $user = Auth::user();
        $query = MarketArticle::query()->with(['category:id,name_ar,slug', 'creator:id,first_name,last_name,email']);

        $canSeeAll = $user->can('council.article.edit_any')
            || $user->can('council.article.review')
            || $user->can('council.article.publish');

        if (!$canSeeAll) {
            $query->where('created_by_user_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('count_only') && $request->count_only === '1') {
            return response()->json([
                'success' => true,
                'count'   => $query->count(),
            ]);
        }

        $query->orderByDesc('updated_at');
        $perPage = min(50, max(1, (int) $request->get('per_page', 15)));

        return response()->json([
            'success' => true,
            'data'    => $query->paginate($perPage),
        ]);
    }

    /**
     * List articles pending review — requires review or publish permission.
     * Writers (edit_own only) get 403.
     */
    public function reviews(Request $request): JsonResponse
    {
        if (!Auth::user()?->can('council.studio.access')) {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 403);
        }

        $user = Auth::user();
        if (!$user->can('council.article.review') && !$user->can('council.article.publish')) {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 403);
        }

        $query = MarketArticle::query()
            ->with(['category:id,name_ar,slug', 'creator:id,first_name,last_name,email'])
            ->where('status', 'pending_review')
            ->orderByDesc('updated_at');

        $perPage = min(50, max(1, (int) $request->get('per_page', 15)));

        return response()->json([
            'success' => true,
            'data'    => $query->paginate($perPage),
        ]);
    }

    /**
     * List categories (read for create form; manage is admin-only).
     */
    public function categories(Request $request): JsonResponse
    {

        $list = MarketCategory::query()
            ->withCount('articles')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json(['success' => true, 'data' => $list]);
    }

    /**
     * GET /api/council-studio/articles/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        if (!Auth::user()?->can('council.studio.access')) {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 403);
        }

        $article = MarketArticle::with(['category', 'contexts', 'creator:id,first_name,last_name,email'])
            ->find($id);

        if (!$article) {
            return response()->json(['success' => false, 'message' => 'المقال غير موجود'], 404);
        }

        $user = Auth::user();
        if (!$user->can('council.article.edit_any') && !$user->can('council.article.review') && !$user->can('council.article.publish')) {
            if ((int) $article->created_by_user_id !== (int) $user->id) {
                return response()->json(['success' => false, 'message' => 'غير مصرح'], 403);
            }
        }

        return response()->json(['success' => true, 'data' => $article]);
    }

    /**
     * POST /api/council-studio/articles
     */
    public function store(Request $request): JsonResponse
    {
        if (!Auth::user()?->can('council.article.create')) {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 403);
        }

        $user = Auth::user();
        $allowedStatuses = ['draft', 'pending_review'];
        if ($user->can('council.article.publish')) {
            $allowedStatuses[] = 'published';
        }

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
            'read_time'   => 'nullable|integer|min:0|max:999',
            'status'       => 'required|in:' . implode(',', $allowedStatuses),
            'published_at' => 'nullable|date',
            'is_featured'  => 'nullable|boolean',
            'contexts'     => 'nullable|array',
            'contexts.*'   => 'array',
            'contexts.*.context_type' => 'required|string|in:' . implode(',', self::ALLOWED_CONTEXT_TYPES),
            'contexts.*.context_key'  => 'nullable|string|max:255',
        ], [
            'slug.regex' => 'الرابط يجب أن يحتوي على حروف إنجليزية صغيرة وأرقام وشرطات فقط',
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
        $article->created_by_user_id = $user->id;
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
     * PUT /api/council-studio/articles/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $article = MarketArticle::find($id);
        if (!$article) {
            return response()->json(['success' => false, 'message' => 'المقال غير موجود'], 404);
        }

        $user = Auth::user();
        $canEditAny = $user->can('council.article.edit_any') || $user->can('council.article.review') || $user->can('council.article.publish');
        $canEditOwn = $user->can('council.article.edit_own') && (int) $article->created_by_user_id === (int) $user->id;

        if (!$canEditAny && !$canEditOwn) {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 403);
        }

        $allowedStatuses = ['draft', 'pending_review', 'rejected'];
        if ($user->can('council.article.publish')) {
            $allowedStatuses[] = 'published';
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
            'status'       => 'sometimes|required|in:' . implode(',', $allowedStatuses),
            'published_at' => 'nullable|date',
            'is_featured'  => 'nullable|boolean',
            'contexts'     => 'nullable|array',
            'contexts.*'   => 'array',
            'contexts.*.context_type' => 'required|string|in:' . implode(',', self::ALLOWED_CONTEXT_TYPES),
            'contexts.*.context_key'  => 'nullable|string|max:255',
        ], [
            'slug.regex' => 'الرابط يجب أن يحتوي على حروف إنجليزية صغيرة وأرقام وشرطات فقط',
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
        if ($request->has('is_featured') && ($canEditAny || $user->can('council.article.feature'))) {
            $article->is_featured = (bool) $request->is_featured;
        }
        if ($request->has('status')) {
            $newStatus = $request->status;
            $currentStatus = $article->status;
            $transitionOk = $this->validateStatusTransition($user, $article, $currentStatus, $newStatus);
            if (!$transitionOk['allowed']) {
                return response()->json([
                    'success' => false,
                    'message' => $transitionOk['message'] ?? 'انتقال الحالة غير مسموح',
                ], 422);
            }
            $article->status = $newStatus;
            if ($newStatus === 'published' && !$article->published_at) {
                $article->published_at = now();
            } elseif ($newStatus !== 'published') {
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
     * Validate status transition. Returns ['allowed' => bool, 'message' => ?string].
     * Writer: draft|rejected -> pending_review
     * Reviewer: pending_review -> rejected
     * Publisher: pending_review -> published, published -> draft
     */
    private function validateStatusTransition($user, MarketArticle $article, string $from, string $to): array
    {
        if ($from === $to) {
            return ['allowed' => true];
        }

        $isOwn = (int) $article->created_by_user_id === (int) $user->id;
        $canEditAny = $user->can('council.article.edit_any')
            || $user->can('council.article.review')
            || $user->can('council.article.publish');
        $canEdit = $isOwn || $canEditAny;

        if ($to === 'pending_review') {
            if (!in_array($from, ['draft', 'rejected'], true)) {
                return ['allowed' => false, 'message' => 'لا يمكن إرسال للمراجعة من هذه الحالة'];
            }
            if (!$user->can('council.article.submit_review') || !$canEdit) {
                return ['allowed' => false, 'message' => 'غير مصرح لإرسال المقال للمراجعة'];
            }
            return ['allowed' => true];
        }

        if ($to === 'rejected') {
            if ($from !== 'pending_review') {
                return ['allowed' => false, 'message' => 'يمكن رفض المقالات بانتظار المراجعة فقط'];
            }
            if (!$user->can('council.article.review') && !$user->can('council.article.edit_any')) {
                return ['allowed' => false, 'message' => 'غير مصرح لرفض المقال'];
            }
            return ['allowed' => true];
        }

        if ($to === 'published') {
            if ($from !== 'pending_review') {
                return ['allowed' => false, 'message' => 'يمكن النشر للمقالات بانتظار المراجعة فقط'];
            }
            if (!$user->can('council.article.publish')) {
                return ['allowed' => false, 'message' => 'غير مصرح للنشر'];
            }
            return ['allowed' => true];
        }

        if ($to === 'draft') {
            if ($from !== 'published') {
                return ['allowed' => false, 'message' => 'يمكن إلغاء النشر للمقالات المنشورة فقط'];
            }
            if (!$user->can('council.article.publish') && !$user->can('council.article.unpublish')) {
                return ['allowed' => false, 'message' => 'غير مصرح لإلغاء النشر'];
            }
            return ['allowed' => true];
        }

        return ['allowed' => false, 'message' => 'انتقال غير مدعوم'];
    }

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
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Carbon;
use App\Models\BlogPost;

class BlogPostAdminController extends Controller
{
    public function index(Request $request)
    {
        $page     = max(1, (int) $request->query('page', 1));
        $pageSize = max(1, min(100, (int) $request->query('pageSize', 10)));
        $search   = trim((string) $request->query('search', ''));

        $q = BlogPost::query();

        if (method_exists(BlogPost::class, 'category')) {
            $q->with('category');
        }

        if ($search !== '') {
            $q->where(function ($qq) use ($search) {
                $qq->where('title', 'like', "%{$search}%")
                   ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $q->where('category_id', (int) $request->query('category_id'));
        }

        // اختياري: فلترة منشور/مسودة
        if ($request->filled('is_published')) {
            $q->where('is_published', filter_var($request->query('is_published'), FILTER_VALIDATE_BOOLEAN));
        }

        $p = $q->orderByDesc('id')->paginate($pageSize, ['*'], 'page', $page);

        return response()->json([
            'data' => $p->items(),
            'meta' => [
                'page'     => $p->currentPage(),
                'pageSize' => $p->perPage(),
                'total'    => $p->total(),
                'lastPage' => $p->lastPage(),
            ],
        ]);
    }

    public function show(int $id)
    {
        $q = BlogPost::query();
        if (method_exists(BlogPost::class, 'category')) {
            $q->with('category');
        }

        $post = $q->findOrFail($id);
        return response()->json(['data' => $post]);
    }

    public function store(Request $request)
    {
        // ✅ نقبل الحقول الجديدة + القديمة (compat)
        $data = $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'slug'        => ['nullable', 'string', 'max:255', 'unique:blog_posts,slug'],
            'content'     => ['required', 'string'],

            // DB عندك NOT NULL => required
            'category_id' => ['required', 'integer'],

            'excerpt'     => ['nullable', 'string'],

            // الجديد
            'cover_image'     => ['nullable', 'string', 'max:2048'],
            'is_published'    => ['nullable', 'boolean'],
            'published_at'    => ['nullable', 'date'],
            'seo_title'       => ['nullable', 'string', 'max:255'],
            'seo_description' => ['nullable', 'string'],

            // القديم (لو الفرونت لسه بيبعتهم)
            'thumbnail' => ['nullable', 'string', 'max:2048'],
            'status'    => ['nullable', 'string', 'in:draft,published'],
        ]);

        // ✅ Mapping: thumbnail -> cover_image (لو cover_image مش موجود)
        if (empty($data['cover_image']) && !empty($data['thumbnail'])) {
            $data['cover_image'] = $data['thumbnail'];
        }

        // ✅ slug: لو مش متبعت أو فاضي، حاول من العنوان، ولو طلع فاضي اعمل fallback
        $slug = trim((string)($data['slug'] ?? ''));
        if ($slug === '') {
            $generated = Str::slug($data['title']);
            if ($generated === '') {
                $generated = 'post-' . Str::lower(Str::random(10));
            }
            $slug = $this->ensureUniqueSlug($generated);
        } else {
            $slug = $this->ensureUniqueSlug($slug);
        }

        // ✅ is_published: أولوية لـ is_published، وإلا status
        $isPublished = false;
        if (array_key_exists('is_published', $data)) {
            $isPublished = (bool) $data['is_published'];
        } elseif (!empty($data['status'])) {
            $isPublished = $data['status'] === 'published';
        }

        // ✅ published_at logic
        $publishedAt = null;
        if ($isPublished) {
            $publishedAt = !empty($data['published_at'])
                ? Carbon::parse($data['published_at'])
                : Carbon::now();
        }

        $post = BlogPost::create([
            'title'           => $data['title'],
            'slug'            => $slug,
            'content'         => $data['content'],
            'category_id'     => (int) $data['category_id'],
            'excerpt'         => $data['excerpt'] ?? null,
            'cover_image'     => $data['cover_image'] ?? null,
            'is_published'    => $isPublished,
            'published_at'    => $publishedAt,
            'seo_title'       => $data['seo_title'] ?? null,
            'seo_description' => $data['seo_description'] ?? null,
        ]);

        // رجّع ومعاه category لو موجودة
        if (method_exists(BlogPost::class, 'category')) {
            $post->load('category');
        }

        return response()->json(['message' => 'Created', 'data' => $post], 201);
    }

    public function update(Request $request, int $id)
    {
        $post = BlogPost::findOrFail($id);

        $data = $request->validate([
            'title'       => ['sometimes', 'string', 'max:255'],
            'slug'        => ['sometimes', 'nullable', 'string', 'max:255', 'unique:blog_posts,slug,' . $post->id],
            'content'     => ['sometimes', 'string'],

            // DB NOT NULL => لو اتبعت لازم يكون قيمة صحيحة
            'category_id' => ['sometimes', 'required', 'integer'],

            'excerpt'     => ['sometimes', 'nullable', 'string'],

            // الجديد
            'cover_image'     => ['sometimes', 'nullable', 'string', 'max:2048'],
            'is_published'    => ['sometimes', 'boolean'],
            'published_at'    => ['sometimes', 'nullable', 'date'],
            'seo_title'       => ['sometimes', 'nullable', 'string', 'max:255'],
            'seo_description' => ['sometimes', 'nullable', 'string'],

            // القديم (compat)
            'thumbnail' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'status'    => ['sometimes', 'nullable', 'string', 'in:draft,published'],
        ]);

        // ✅ Mapping thumbnail -> cover_image
        if (!array_key_exists('cover_image', $data) && array_key_exists('thumbnail', $data)) {
            $data['cover_image'] = $data['thumbnail'];
        }
        unset($data['thumbnail']); // ما نحتاجهاش بعد التحويل

        // ✅ slug normalization
        $slugProvided = array_key_exists('slug', $data);
        if ($slugProvided) {
            $incomingSlug = trim((string)($data['slug'] ?? ''));
            if ($incomingSlug === '') {
                // لو بعت slug فاضي، نولّد slug بدل ما نخليه null
                unset($data['slug']);
                $slugProvided = false;
            } else {
                $data['slug'] = $this->ensureUniqueSlug($incomingSlug, $post->id);
            }
        }

        // ✅ لو العنوان اتغير والslug مش اتبعت: ولّد slug (مع fallback)
        if (array_key_exists('title', $data) && !$slugProvided) {
            $generated = Str::slug($data['title']);
            if ($generated === '') {
                $generated = 'post-' . Str::lower(Str::random(10));
            }
            $data['slug'] = $this->ensureUniqueSlug($generated, $post->id);
        }

        // ✅ نشر/مسودة: نحول status -> is_published إذا is_published مش موجود
        $hasIsPublished = array_key_exists('is_published', $data);
        if (!$hasIsPublished && array_key_exists('status', $data)) {
            $data['is_published'] = ($data['status'] === 'published');
            $hasIsPublished = true;
        }
        unset($data['status']); // مش موجود في الموديل

        // ✅ published_at logic مع is_published
        if ($hasIsPublished) {
            if ((bool)$data['is_published'] === true) {
                // لو نشرناه: لو التاريخ اتبعت استخدمه، لو لا حط الآن (لو مفيش تاريخ قديم)
                if (array_key_exists('published_at', $data)) {
                    $data['published_at'] = empty($data['published_at']) ? Carbon::now() : Carbon::parse($data['published_at']);
                } else {
                    $data['published_at'] = $post->published_at ? $post->published_at : Carbon::now();
                }
            } else {
                // لو مسودة: صفّر التاريخ
                $data['published_at'] = null;
            }
        } else {
            // لو is_published مش اتبعت لكن published_at اتبعت لوحده
            if (array_key_exists('published_at', $data)) {
                $data['published_at'] = empty($data['published_at']) ? null : Carbon::parse($data['published_at']);
            }
        }

        $post->update($data);

        if (method_exists(BlogPost::class, 'category')) {
            $post->load('category');
        }

        return response()->json(['message' => 'Updated', 'data' => $post]);
    }

    public function destroy(int $id)
    {
        $post = BlogPost::findOrFail($id);
        $post->delete();

        return response()->json(['message' => 'Deleted']);
    }

    /**
     * ✅ تأكد إن الـ slug unique (مع تجاهل id في التعديل)
     */
    private function ensureUniqueSlug(string $base, ?int $ignoreId = null): string
    {
        $base = trim($base);
        if ($base === '') {
            $base = 'post-' . Str::lower(Str::random(10));
        }

        $slug = $base;
        $i = 2;

        while (
            BlogPost::query()
                ->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = $base . '-' . $i;
            $i++;
            if ($i > 200) {
                $slug = $base . '-' . Str::lower(Str::random(6));
                break;
            }
        }

        return $slug;
    }
}

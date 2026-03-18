<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use App\Models\BlogCategory;
use App\Models\BlogTag;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class BlogController extends Controller
{
    // =========================================================
    // Posts
    // =========================================================

    // GET /api/admin/blog/posts
    public function postsIndex(Request $request): JsonResponse
    {
        $query = BlogPost::query()->with([
            'user:id,first_name,last_name',
            'category:id,name,slug',
            'tags:id,name',
        ]);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('tag')) {
            $query->whereHas('tags', fn($q) => $q->where('name', $request->tag));
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('excerpt', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%");
            });
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['created_at', 'title', 'views', 'status', 'published_at'];

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

    // GET /api/admin/blog/posts/{id}
    public function postsShow(int $id): JsonResponse
    {
        $post = BlogPost::with(['user:id,first_name,last_name', 'category:id,name,slug', 'tags:id,name'])
            ->findOrFail($id);

        return response()->json(['success' => true, 'data' => $post]);
    }

    // POST /api/admin/blog/posts
    public function postsStore(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title'       => 'required|string|max:255',
            'content'     => 'required|string',
            'excerpt'     => 'nullable|string',
            'image'       => 'nullable|string|max:2048',
            'status'      => 'required|in:draft,published',
            'category_id' => 'nullable|integer|exists:blog_categories,id',
            'tags'        => 'nullable|array',
            'tags.*'      => 'string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            $slugBase = Str::slug($request->title);
            $slug = $slugBase;
            $i = 1;
            while (BlogPost::where('slug', $slug)->exists()) {
                $slug = $slugBase . '-' . $i++;
            }

            $post = new BlogPost();
            $post->user_id      = auth()->id();
            $post->category_id  = $request->category_id;
            $post->title        = $request->title;
            $post->slug         = $slug;
            $post->excerpt      = $request->excerpt;
            $post->content      = $request->content;
            $post->image        = $request->image;
            $post->status       = $request->status;

            if ($request->status === 'published') {
                $post->published_at = now();
            }

            $post->save();

            $this->syncPostTagsByNames($post, $request->input('tags', []));

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء المقال بنجاح',
                'data'    => $post->load(['user:id,first_name,last_name', 'category:id,name,slug', 'tags:id,name']),
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Create blog post failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء إنشاء المقال'], 500);
        }
    }

    // PUT /api/admin/blog/posts/{id}
    public function postsUpdate(int $id, Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title'       => 'sometimes|required|string|max:255',
            'content'     => 'sometimes|required|string',
            'excerpt'     => 'nullable|string',
            'image'       => 'nullable|string|max:2048',
            'status'      => 'sometimes|required|in:draft,published',
            'category_id' => 'nullable|integer|exists:blog_categories,id',
            'tags'        => 'nullable|array',
            'tags.*'      => 'string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            $post = BlogPost::findOrFail($id);

            if ($request->filled('title') && $request->title !== $post->title) {
                $slugBase = Str::slug($request->title);
                $slug = $slugBase;
                $i = 1;
                while (BlogPost::where('slug', $slug)->where('id', '!=', $id)->exists()) {
                    $slug = $slugBase . '-' . $i++;
                }
                $post->title = $request->title;
                $post->slug  = $slug;
            }

            if ($request->has('content')) $post->content = $request->content;
            if ($request->has('excerpt')) $post->excerpt = $request->excerpt;
            if ($request->has('image')) $post->image = $request->image;
            if ($request->has('category_id')) $post->category_id = $request->category_id;

            if ($request->has('status')) {
                $post->status = $request->status;

                if ($request->status === 'published' && !$post->published_at) {
                    $post->published_at = now();
                }

                if ($request->status === 'draft') {
                    $post->published_at = null;
                }
            }

            $post->save();

            if ($request->has('tags')) {
                $this->syncPostTagsByNames($post, $request->input('tags', []));
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'تم تحديث المقال بنجاح',
                'data'    => $post->load(['user:id,first_name,last_name', 'category:id,name,slug', 'tags:id,name']),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Update blog post failed', ['error' => $e->getMessage(), 'id' => $id]);
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء تحديث المقال'], 500);
        }
    }

    // DELETE /api/admin/blog/posts/{id}
    public function postsDestroy(int $id): JsonResponse
    {
        try {
            $post = BlogPost::findOrFail($id);
            $post->tags()->detach();
            $post->delete();

            return response()->json(['success' => true, 'message' => 'تم حذف المقال بنجاح']);
        } catch (\Throwable $e) {
            Log::error('Delete blog post failed', ['error' => $e->getMessage(), 'id' => $id]);
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء حذف المقال'], 500);
        }
    }

    // POST /api/admin/blog/posts/{id}/status
    public function postsToggleStatus(int $id, Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:published,draft',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $post = BlogPost::findOrFail($id);

            $post->status = $request->status;
            if ($request->status === 'published') {
                $post->published_at = $post->published_at ?? now();
            } else {
                $post->published_at = null;
            }

            $post->save();

            return response()->json([
                'success' => true,
                'message' => $request->status === 'published' ? 'تم نشر المقال بنجاح' : 'تم تحويل المقال لمسودة',
                'data'    => $post,
            ]);
        } catch (\Throwable $e) {
            Log::error('Toggle blog post status failed', ['error' => $e->getMessage(), 'id' => $id]);
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء تغيير حالة المقال'], 500);
        }
    }

    private function syncPostTagsByNames(BlogPost $post, array $tagNames): void
    {
        $tagNames = array_values(array_filter(array_map(function ($t) {
            $t = trim((string) $t);
            return $t !== '' ? $t : null;
        }, $tagNames)));

        if (count($tagNames) === 0) {
            $post->tags()->sync([]);
            return;
        }

        $tagIds = [];
        foreach ($tagNames as $name) {
            $tag = BlogTag::firstOrCreate(['name' => $name]);
            $tagIds[] = $tag->id;
        }

        $post->tags()->sync($tagIds);
    }

    // =========================================================
    // Categories
    // =========================================================

    public function categoriesIndex(): JsonResponse
    {
        $cats = BlogCategory::query()
            ->withCount('posts')
            ->orderBy('name')
            ->get();

        return response()->json(['success' => true, 'data' => $cats]);
    }

    public function categoriesStore(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $slugBase = $request->filled('slug') ? Str::slug($request->slug) : Str::slug($request->name);
        $slug = $slugBase;
        $i = 1;
        while (BlogCategory::where('slug', $slug)->exists()) {
            $slug = $slugBase . '-' . $i++;
        }

        $cat = BlogCategory::create([
            'name' => $request->name,
            'slug' => $slug,
        ]);

        return response()->json(['success' => true, 'message' => 'تم إنشاء التصنيف', 'data' => $cat], 201);
    }

    public function categoriesUpdate(int $id, Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $cat = BlogCategory::findOrFail($id);

        if ($request->has('name')) $cat->name = $request->name;

        $slugBase = null;
        if ($request->filled('slug')) {
            $slugBase = Str::slug($request->slug);
        } elseif ($request->has('name')) {
            $slugBase = Str::slug($cat->name);
        }

        if ($slugBase) {
            $slug = $slugBase;
            $i = 1;
            while (BlogCategory::where('slug', $slug)->where('id', '!=', $id)->exists()) {
                $slug = $slugBase . '-' . $i++;
            }
            $cat->slug = $slug;
        }

        $cat->save();

        return response()->json(['success' => true, 'message' => 'تم تحديث التصنيف', 'data' => $cat]);
    }

    public function categoriesDestroy(int $id): JsonResponse
    {
        try {
            $cat = BlogCategory::findOrFail($id);
            $cat->delete(); // لو migration عامل nullOnDelete على posts.category_id
            return response()->json(['success' => true, 'message' => 'تم حذف التصنيف']);
        } catch (\Throwable $e) {
            Log::error('Delete category failed', ['error' => $e->getMessage(), 'id' => $id]);
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء حذف التصنيف'], 500);
        }
    }

    // =========================================================
    // Tags
    // =========================================================

    public function tagsIndex(): JsonResponse
    {
        $tags = BlogTag::query()
            ->withCount('posts')
            ->orderBy('name')
            ->get();

        return response()->json(['success' => true, 'data' => $tags]);
    }

    public function tagsStore(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:50|unique:blog_tags,name',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $tag = BlogTag::create(['name' => $request->name]);

        return response()->json(['success' => true, 'message' => 'تم إنشاء الوسم', 'data' => $tag], 201);
    }

    public function tagsUpdate(int $id, Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:50|unique:blog_tags,name,' . $id,
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $tag = BlogTag::findOrFail($id);
        $tag->name = $request->name;
        $tag->save();

        return response()->json(['success' => true, 'message' => 'تم تحديث الوسم', 'data' => $tag]);
    }

    public function tagsDestroy(int $id): JsonResponse
    {
        try {
            $tag = BlogTag::findOrFail($id);
            $tag->posts()->detach();
            $tag->delete();

            return response()->json(['success' => true, 'message' => 'تم حذف الوسم']);
        } catch (\Throwable $e) {
            Log::error('Delete tag failed', ['error' => $e->getMessage(), 'id' => $id]);
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء حذف الوسم'], 500);
        }
    }
}

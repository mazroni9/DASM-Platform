<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use App\Models\BlogTag;
use App\Models\BlogCategory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BlogController extends Controller
{
    /**
     * GET /api/blog
     * Public listing (published only)
     */
    public function index(Request $request): JsonResponse
    {
        $query = BlogPost::query()
            ->with([
                'user:id,first_name,last_name',
                'category:id,name,slug',
                'tags:id,name',
            ])
            ->where('status', 'published');

        // Filter: category (accept slug or id)
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

        // Filter: tag by name
        if ($request->filled('tag')) {
            $tag = $request->tag;
            $query->whereHas('tags', fn($q) => $q->where('name', $tag));
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('excerpt', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%");
            });
        }

        // Sorting (default by published_at desc)
        $sortBy = $request->get('sort_by', 'published_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $allowedSorts = ['published_at', 'views', 'created_at', 'title'];

        if (!in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'published_at';
        }

        $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');

        $perPage = min(50, max(1, (int) $request->get('per_page', 10)));

        return response()->json([
            'success' => true,
            'data' => $query->paginate($perPage),
        ]);
    }

    /**
     * GET /api/blog/{slug}
     * Public show (published only)
     */
    public function show(string $slug): JsonResponse
    {
        $post = BlogPost::query()
            ->with([
                'user:id,first_name,last_name',
                'category:id,name,slug',
                'tags:id,name',
            ])
            ->where('slug', $slug)
            ->where('status', 'published')
            ->first();

        if (!$post) {
            return response()->json([
                'success' => false,
                'message' => 'المقال غير موجود',
            ], 404);
        }

        // Increment views
        $post->increment('views');

        return response()->json([
            'success' => true,
            'data' => $post,
        ]);
    }

    /**
     * GET /api/blog/latest/{count?}
     */
    public function latest(int $count = 3): JsonResponse
    {
        $count = max(1, min(20, $count));

        $posts = BlogPost::query()
            ->with(['user:id,first_name,last_name', 'category:id,name,slug', 'tags:id,name'])
            ->where('status', 'published')
            ->orderByDesc('published_at')
            ->limit($count)
            ->get();

        return response()->json(['success' => true, 'data' => $posts]);
    }

    /**
     * GET /api/blog/tags
     */
    public function tags(): JsonResponse
    {
        $tags = BlogTag::query()
            ->withCount(['posts' => function ($q) {
                $q->where('status', 'published');
            }])
            ->orderBy('name')
            ->get();

        return response()->json(['success' => true, 'data' => $tags]);
    }

    /**
     * GET /api/blog/categories
     */
    public function categories(): JsonResponse
    {
        $cats = BlogCategory::query()
            ->withCount(['posts' => function ($q) {
                $q->where('status', 'published');
            }])
            ->orderBy('name')
            ->get();

        return response()->json(['success' => true, 'data' => $cats]);
    }
}

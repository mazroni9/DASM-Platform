<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\BlogCategory;
use App\Models\BlogPost;
use Illuminate\Http\Request;

class BlogPublicController extends Controller
{
    public function categories()
    {
        $cats = BlogCategory::query()
            ->select(['id', 'name', 'slug', 'description', 'created_at'])
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $cats]);
    }

    public function posts(Request $request)
    {
        $categorySlug = $request->query('category');

        $q = BlogPost::query()
            ->with(['category:id,name,slug'])
            ->where('is_published', true)
            ->orderByDesc('published_at')
            ->select([
                'id',
                'category_id',
                'title',
                'slug',
                'excerpt',
                'cover_image',
                'published_at',
                'created_at',
            ]);

        if (!empty($categorySlug)) {
            $q->whereHas('category', function ($cq) use ($categorySlug) {
                $cq->where('slug', $categorySlug);
            });
        }

        $posts = $q->paginate(10);

        // لو تحب نفس شكل الادمن (data + meta)
        return response()->json([
            'data' => $posts->items(),
            'meta' => [
                'page'     => $posts->currentPage(),
                'pageSize' => $posts->perPage(),
                'total'    => $posts->total(),
                'lastPage' => $posts->lastPage(),
            ],
        ]);
    }

    public function show(string $slug)
    {
        $post = BlogPost::query()
            ->with(['category:id,name,slug'])
            ->where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        return response()->json(['data' => $post]);
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

// عدّل أسماء الموديل لو عندك أسماء مختلفة
use App\Models\BlogCategory;

class BlogCategoryAdminController extends Controller
{
    public function index(Request $request)
    {
        $page     = max(1, (int) $request->query('page', 1));
        $pageSize = max(1, min(100, (int) $request->query('pageSize', 10)));
        $search   = trim((string) $request->query('search', ''));

        $q = BlogCategory::query();

        if ($search !== '') {
            $q->where(function ($qq) use ($search) {
                $qq->where('name', 'like', "%{$search}%")
                   ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        $p = $q->orderByDesc('id')->paginate($pageSize, ['*'], 'page', $page);

        return response()->json([
            'data' => $p->items(),
            'meta' => [
                'page'       => $p->currentPage(),
                'pageSize'   => $p->perPage(),
                'total'      => $p->total(),
                'lastPage'   => $p->lastPage(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'slug' => ['nullable','string','max:255','unique:blog_categories,slug'],
        ]);

        $slug = $data['slug'] ?? Str::slug($data['name']);

        $category = BlogCategory::create([
            'name' => $data['name'],
            'slug' => $slug,
        ]);

        return response()->json(['message' => 'Created', 'data' => $category], 201);
    }

    public function update(Request $request, int $id)
    {
        $category = BlogCategory::findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes','string','max:255'],
            'slug' => ['sometimes','nullable','string','max:255','unique:blog_categories,slug,' . $category->id],
        ]);

        if (array_key_exists('name', $data) && !array_key_exists('slug', $data)) {
            $data['slug'] = Str::slug($data['name']);
        }

        $category->update($data);

        return response()->json(['message' => 'Updated', 'data' => $category]);
    }

    public function destroy(int $id)
    {
        $category = BlogCategory::findOrFail($id);
        $category->delete();

        return response()->json(['message' => 'Deleted']);
    }
}

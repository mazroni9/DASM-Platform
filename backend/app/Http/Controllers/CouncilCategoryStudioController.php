<?php

namespace App\Http\Controllers;

use App\Models\MarketCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CouncilCategoryStudioController extends Controller
{
    /**
     * GET /api/council-studio/categories/{id}
     */
    public function show(int $id): JsonResponse
    {
        if (!Auth::user()?->can('council.category.manage')) {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 403);
        }

        $cat = MarketCategory::withCount('articles')->find($id);

        if (!$cat) {
            return response()->json(['success' => false, 'message' => 'التصنيف غير موجود'], 404);
        }

        return response()->json(['success' => true, 'data' => $cat]);
    }

    /**
     * POST /api/council-studio/categories
     */
    public function store(Request $request): JsonResponse
    {
        if (!Auth::user()?->can('council.category.manage')) {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 403);
        }

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
     * PUT /api/council-studio/categories/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        if (!Auth::user()?->can('council.category.manage')) {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 403);
        }

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

        $cat = MarketCategory::find($id);
        if (!$cat) {
            return response()->json(['success' => false, 'message' => 'التصنيف غير موجود'], 404);
        }

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
     * DELETE /api/council-studio/categories/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        if (!Auth::user()?->can('council.category.manage')) {
            return response()->json(['success' => false, 'message' => 'غير مصرح'], 403);
        }

        $cat = MarketCategory::find($id);
        if (!$cat) {
            return response()->json(['success' => false, 'message' => 'التصنيف غير موجود'], 404);
        }

        try {
            $cat->delete();
            return response()->json(['success' => true, 'message' => 'تم حذف التصنيف']);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء حذف التصنيف'], 500);
        }
    }
}

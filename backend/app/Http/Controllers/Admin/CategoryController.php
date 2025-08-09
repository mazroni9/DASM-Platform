<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\Request;
use App\Models\MarketCategory;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;

class CategoryController extends Controller
{
    public function index()
    {
        $categories =  MarketCategory::paginate(10);

        return response()->json([
            'status' => 'success',
            'message' => 'list of all categories',
            'data' => $categories
        ]);
    }
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required',
            'slug' => 'required|unique:market_categories,slug',
            'is_active' => 'required',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $category =  MarketCategory::create([
            'name' =>  $request->name,
            'slug' =>  $request->slug,
            'is_active' =>  $request->is_active,
            'description' =>  $request->description,
            'sort_order' => $request->sort_order
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'category added successfully',
            'data' => $category
        ], 201);
    }
}

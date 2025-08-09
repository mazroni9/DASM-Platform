<?php

namespace App\Http\Controllers\Admin;

use App\Models\Market;
use Illuminate\Http\Request;
use App\Models\MarketCategory;
use App\Enums\MarketLayoutType;
use App\Http\Controllers\Controller;

class MarketController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $markets = Market::with('category')->paginate(10);

        return response()->json([
            'status' => 'success',
            'message' => 'List of all markets',
            'data' => $markets
        ]);
    }

    public function create()
    {
        $categories =  MarketCategory::select('id', 'name')->where('is_active', true)->get();
        $layoutTypes = [];
         $layoutTypes = MarketLayoutType::labels();
        // foreach ($layoutTypes as $case) {
        //     $layoutTypes[] = [
        //         'value' => $case->value,
        //         'label' => $case->name
        //     ];
        // }

        return response()->json([
            'status' => 'success',
            'message' => 'list of all categories',
            'data' => [
                'categories' => $categories,
                'layoutTypes' => $layoutTypes
            ]
        ]);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:market_categories,id',
            'slug' => 'required|string|max:255|unique:markets,slug',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:255',
            'bg_color' => 'nullable|string|max:255',
            'layout_type' => 'required'
        ]);

        //return $request->all();

        $market = Market::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Market created successfully.',
            'data' => $market
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $slug)
    {
        $market = Market::where('slug', $slug)->first();
        return response()->json([
            'status' => 'success',
            'message' => 'Market fetched successfully.',
            'data' => $market
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $categories =  MarketCategory::select('id', 'name')->where('is_active', true)->get();
        $layoutTypes = [];
        foreach (MarketLayoutType::labels() as $case) {
            $layoutTypes[] = [
                'value' => $case->value,
                'label' => $case->name
            ];
        }

        return response()->json([
            'status' => 'success',
            'message' => 'list of all categories',
            'data' => [
                'categories' => $categories,
                'layoutTypes' => $layoutTypes
            ]
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $slug)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:market_categories,id',
            'slug' => 'required|string|max:255|unique:markets,slug,' . $slug . ',slug',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:255',
            'bg_color' => 'nullable|string|max:255',
            'layout_type' => 'required'
        ]);
        $market = Market::where('slug', $slug)->first();
        $market->update($validated);
        return response()->json([
            'status' => 'success',
            'message' => 'Market updated successfully.',
            'data' => $market
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}

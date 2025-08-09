<?php

namespace App\Http\Controllers;

use App\Models\Market;
use Illuminate\Http\Request;
use App\Models\MarketCategory;

class MarketCategoriesController extends Controller
{
    public function index()
    {
        $categories =  MarketCategory::with('markets')->get();

        return response()->json([
            'status' => 'success',
            'message' => 'list of all categories',
            'data' => $categories
        ]);
    }

    public function getAllMarkets()
    {
        $markets = Market::with('category')->get();

        return response()->json([
            'status' => 'success',
            'message' => 'list of all markets',
            'data' => $markets
        ]);
    }

    public function getMarket($slug)
    {
        $market = Market::with('category')->where('slug', $slug)->first();

        return response()->json([
            'status' => 'success',
            'message' => 'market details',
            'data' => $market,
        ]);
    }
}

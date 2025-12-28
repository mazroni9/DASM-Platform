<?php

namespace App\Http\Controllers\Dealer;

use App\Http\Controllers\Controller;
use App\Models\Dealer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AiController extends Controller
{
    /**
     * POST /api/dealer/ai/toggle
     * Saves user preference for AI recommendations.
     */
    public function toggle(Request $request)
    {
        $request->validate([
            'enabled' => 'required|boolean',
        ]);

        $user = Auth::user();
        $dealer = Dealer::where('user_id', $user->id)->first();

        if (!$dealer) {
            return response()->json([
                'status' => 'error',
                'message' => 'Dealer profile not found',
            ], 404);
        }

        $dealer->ai_recommendations_enabled = $request->input('enabled');
        $dealer->save();

        return response()->json([
            'status' => 'success',
            'message' => 'AI recommendations ' . ($request->input('enabled') ? 'enabled' : 'disabled'),
            'data' => [
                'ai_enabled' => $dealer->ai_recommendations_enabled,
            ],
        ]);
    }
}

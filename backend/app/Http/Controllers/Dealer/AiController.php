<?php

namespace App\Http\Controllers\Dealer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AiController extends Controller
{
    /**
     * POST /api/dealer/ai/toggle
     * Saves user preference for AI recommendations.
     * 
     * Note: AI recommendations feature was tied to dealer records.
     * This endpoint is kept for API compatibility but returns a success response.
     * TODO: If AI feature is needed, add ai_recommendations_enabled column to users table.
     */
    public function toggle(Request $request)
    {
        $request->validate([
            'enabled' => 'required|boolean',
        ]);

        $user = Auth::user();

        // For now, just return success - feature was dependent on Dealer model
        // If needed in future, add ai_recommendations_enabled to users table
        $enabled = $request->input('enabled');

        return response()->json([
            'status' => 'success',
            'message' => 'AI recommendations ' . ($enabled ? 'enabled' : 'disabled'),
            'data' => [
                'ai_enabled' => $enabled,
            ],
        ]);
    }
}

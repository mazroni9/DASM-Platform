<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Test\Services\AuctionTestingAnalyticsService;

/**
 * لوحة تحليلية واحدة تربط runs + events + activity_logs + test_results.
 * GET /api/admin/auction-testing-analytics?days=30
 */
class AuctionTestingAnalyticsController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $days = min(max((int) $request->get('days', 30), 1), 365);

        $data = AuctionTestingAnalyticsService::getAnalytics($days);

        return response()->json([
            'status' => 'success',
            'data' => $data,
        ]);
    }
}

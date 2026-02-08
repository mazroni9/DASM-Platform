<?php

namespace Modules\Test\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Test\Entities\AuctionTestRun;
use Modules\Test\Services\ScenarioRunner;

class ScenarioRunController extends Controller
{
    public function __construct(
        private ScenarioRunner $scenarioRunner
    ) {
    }

    /**
     * قائمة تعريفات السيناريوهات (من الـ config).
     */
    public function listScenarios(): JsonResponse
    {
        $scenarios = $this->scenarioRunner->getScenariosList();
        $list = [];
        foreach ($scenarios as $key => $def) {
            $list[] = [
                'key' => $key,
                'name_ar' => $def['name_ar'] ?? $key,
                'name_en' => $def['name_en'] ?? $key,
                'description' => $def['description'] ?? '',
                'default_users' => $def['default_users'] ?? 10,
                'default_duration_seconds' => $def['default_duration_seconds'] ?? 300,
                'bid_pattern' => $def['bid_pattern'] ?? 'random',
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => $list,
        ]);
    }

    /**
     * تشغيل سيناريو (مع اختياري: user_count، duration_seconds).
     */
    public function runScenario(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'scenario_key' => 'required|string|max:64',
            'user_count' => 'nullable|integer|min:1|max:500',
            'duration_seconds' => 'nullable|integer|min:10|max:3600',
        ]);

        try {
            $run = $this->scenarioRunner->runScenario(
                $validated['scenario_key'],
                $validated['user_count'] ?? null,
                $validated['duration_seconds'] ?? null
            );

            return response()->json([
                'status' => 'success',
                'message' => 'تم بدء تشغيل السيناريو',
                'data' => [
                    'id' => $run->id,
                    'scenario_key' => $run->scenario_key,
                    'status' => $run->status,
                    'user_count' => $run->user_count,
                    'duration_seconds' => $run->duration_seconds,
                    'total_bids' => $run->total_bids,
                    'successful_bids' => $run->successful_bids,
                    'failed_bids' => $run->failed_bids,
                    'avg_latency_ms' => $run->avg_latency_ms,
                    'max_latency_ms' => $run->max_latency_ms,
                    'started_at' => $run->started_at?->toIso8601String(),
                    'completed_at' => $run->completed_at?->toIso8601String(),
                    'error_message' => $run->error_message,
                ],
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'فشل تشغيل السيناريو: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * تفاصيل تشغيل واحد مع الأحداث.
     */
    public function showRun(int $id): JsonResponse
    {
        $run = AuctionTestRun::with('events')->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $run->id,
                'scenario_key' => $run->scenario_key,
                'status' => $run->status,
                'user_count' => $run->user_count,
                'duration_seconds' => $run->duration_seconds,
                'total_bids' => $run->total_bids,
                'successful_bids' => $run->successful_bids,
                'failed_bids' => $run->failed_bids,
                'avg_latency_ms' => $run->avg_latency_ms,
                'max_latency_ms' => $run->max_latency_ms,
                'auction_id' => $run->auction_id,
                'options' => $run->options,
                'started_at' => $run->started_at?->toIso8601String(),
                'completed_at' => $run->completed_at?->toIso8601String(),
                'error_message' => $run->error_message,
                'events' => $run->events->map(fn ($e) => [
                    'id' => $e->id,
                    'event_type' => $e->event_type,
                    'latency_ms' => $e->latency_ms,
                    'user_id' => $e->user_id,
                    'bid_id' => $e->bid_id,
                    'bid_amount' => $e->bid_amount,
                    'message' => $e->message,
                    'occurred_at' => $e->occurred_at?->toIso8601String(),
                ]),
            ],
        ]);
    }

    /**
     * قائمة تشغيلات السيناريوهات (مع pagination).
     */
    public function indexRuns(Request $request): JsonResponse
    {
        $query = AuctionTestRun::query();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('scenario_key')) {
            $query->where('scenario_key', $request->scenario_key);
        }

        $perPage = (int) $request->get('per_page', 15);
        $perPage = min(max($perPage, 1), 100);
        $runs = $query->orderBy('created_at', 'desc')->paginate($perPage);

        $items = $runs->getCollection()->map(fn ($run) => [
            'id' => $run->id,
            'scenario_key' => $run->scenario_key,
            'status' => $run->status,
            'user_count' => $run->user_count,
            'duration_seconds' => $run->duration_seconds,
            'total_bids' => $run->total_bids,
            'successful_bids' => $run->successful_bids,
            'failed_bids' => $run->failed_bids,
            'avg_latency_ms' => $run->avg_latency_ms,
            'max_latency_ms' => $run->max_latency_ms,
            'started_at' => $run->started_at?->toIso8601String(),
            'completed_at' => $run->completed_at?->toIso8601String(),
            'error_message' => $run->error_message,
        ]);

        return response()->json([
            'status' => 'success',
            'data' => $items,
            'pagination' => [
                'current_page' => $runs->currentPage(),
                'last_page' => $runs->lastPage(),
                'per_page' => $runs->perPage(),
                'total' => $runs->total(),
                'from' => $runs->firstItem(),
                'to' => $runs->lastItem(),
            ],
        ]);
    }
}

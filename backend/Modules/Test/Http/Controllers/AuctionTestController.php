<?php

namespace Modules\Test\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Test\Entities\AuctionTestResult;
use Modules\Test\Entities\Enums\TestCategory;
use Modules\Test\Entities\Enums\TestStatus;
use Modules\Test\Services\AuctionTestRunner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuctionTestController extends Controller
{
    public function __construct(
        private AuctionTestRunner $testRunner
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $query = AuctionTestResult::query();

        if ($request->has('category')) {
            $category = TestCategory::tryFrom($request->category);
            if ($category) {
                $query->byCategory($category);
            }
        }

        if ($request->has('status')) {
            $status = TestStatus::tryFrom($request->status);
            if ($status) {
                $query->byStatus($status);
            }
        }

        $perPage = $request->get('per_page', 15);
        $page = $request->get('page', 1);

        $results = $query->orderBy('created_at', 'desc')->paginate($perPage, ['*'], 'page', $page);

        $summary = [
            'total' => AuctionTestResult::count(),
            'passed' => AuctionTestResult::where('status', TestStatus::PASSED->value)->count(),
            'failed' => AuctionTestResult::where('status', TestStatus::FAILED->value)->count(),
            'pending' => AuctionTestResult::where('status', TestStatus::PENDING->value)->count(),
            'running' => AuctionTestResult::where('status', TestStatus::RUNNING->value)->count(),
        ];

        return response()->json([
            'status' => 'success',
            'data' => $results->items(),
            'pagination' => [
                'current_page' => $results->currentPage(),
                'last_page' => $results->lastPage(),
                'per_page' => $results->perPage(),
                'total' => $results->total(),
                'from' => $results->firstItem(),
                'to' => $results->lastItem(),
            ],
            'summary' => $summary,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $result = AuctionTestResult::findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $result,
        ]);
    }

    public function runAll(): JsonResponse
    {
        try {
            $results = $this->testRunner->runAllTests();

            return response()->json([
                'status' => 'success',
                'message' => 'All tests completed',
                'data' => $results,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to run tests: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function runCategory(Request $request, string $category): JsonResponse
    {
        try {
            $testCategory = TestCategory::tryFrom($category);

            if (!$testCategory) {
                return response()->json([
                    'status' => 'error',
                    'message' => "Unknown test category: {$category}",
                ], 400);
            }

            $result = $this->testRunner->runTestByCategory($category);

            return response()->json([
                'status' => 'success',
                'message' => "Test category '{$category}' completed",
                'data' => $result,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to run test: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function getLatest(): JsonResponse
    {
        $results = AuctionTestResult::query()
            ->select('test_category')
            ->selectRaw('MAX(created_at) as latest_run')
            ->selectRaw('MAX(CASE WHEN status = ? THEN created_at END) as last_passed', [TestStatus::PASSED->value])
            ->selectRaw('MAX(CASE WHEN status = ? THEN created_at END) as last_failed', [TestStatus::FAILED->value])
            ->groupBy('test_category')
            ->get()
            ->map(function ($item) {
                $categoryValue = $item->getRawOriginal('test_category') ?? $item->test_category;
                
                if ($categoryValue instanceof TestCategory) {
                    $categoryValue = $categoryValue->value;
                }
                
                $category = TestCategory::from($categoryValue);

                $latest = AuctionTestResult::where('test_category', $categoryValue)
                    ->orderBy('created_at', 'desc')
                    ->first();

                return [
                    'category' => $categoryValue,
                    'category_label' => $category->label(),
                    'latest_run' => $item->latest_run,
                    'last_passed' => $item->last_passed,
                    'last_failed' => $item->last_failed,
                    'latest_result' => $latest ? [
                        'id' => $latest->id,
                        'status' => $latest->status->value,
                        'status_label' => $latest->status->label(),
                        'message' => $latest->message,
                        'execution_time_ms' => $latest->execution_time_ms,
                        'completed_at' => $latest->completed_at,
                    ] : null,
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $results,
        ]);
    }

    public function getCategories(): JsonResponse
    {
        $categories = collect(TestCategory::cases())->map(function ($category) {
            return [
                'value' => $category->value,
                'label' => $category->label(),
                'english_label' => $category->englishLabel(),
                'description' => $category->description(),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $categories,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $result = AuctionTestResult::findOrFail($id);
            $result->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'تم حذف نتيجة الاختبار بنجاح',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'فشل حذف نتيجة الاختبار: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        try {
            $ids = $request->validate([
                'ids' => 'required|array',
                'ids.*' => 'integer|exists:auction_test_results,id',
            ])['ids'];

            $deleted = AuctionTestResult::whereIn('id', $ids)->delete();

            return response()->json([
                'status' => 'success',
                'message' => "تم حذف {$deleted} نتيجة اختبار بنجاح",
                'deleted_count' => $deleted,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'فشل حذف النتائج: ' . $e->getMessage(),
            ], 500);
        }
    }
}

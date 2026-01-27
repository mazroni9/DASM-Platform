<?php

namespace Modules\Test\Services\Traits;

use Modules\Test\Entities\AuctionTestResult;
use Modules\Test\Entities\Enums\TestStatus;
use Modules\Test\Events\AuctionTestResultUpdated;

trait TestResultTrait
{
    protected function saveTestResult(
        string $testName,
        string $category,
        TestStatus $status,
        string $message,
        array $details,
        array $errors,
        float $executionTime
    ): AuctionTestResult {
        $result = AuctionTestResult::create([
            'test_name' => $testName,
            'test_category' => $category,
            'status' => $status->value,
            'message' => $message,
            'details' => $details,
            'errors' => !empty($errors) ? $errors : null,
            'execution_time_ms' => (int)round($executionTime),
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        event(new AuctionTestResultUpdated($result));

        return $result;
    }
}

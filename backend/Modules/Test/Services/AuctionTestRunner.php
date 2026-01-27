<?php

namespace Modules\Test\Services;

use Modules\Test\Entities\AuctionTestResult;
use Modules\Test\Entities\Enums\TestCategory;
use Modules\Test\Services\Contracts\TestServiceInterface;

class AuctionTestRunner
{
    public function runAllTests(): array
    {
        $results = [];

        foreach (TestCategory::cases() as $category) {
            $serviceClass = TestCategory::getServiceClass($category->value);
            $service = app($serviceClass);

            if ($service instanceof TestServiceInterface) {
                $results[] = $service->run();
            }
        }

        return $results;
    }

    public function runTestByCategory(string $category): AuctionTestResult
    {
        $serviceClass = TestCategory::getServiceClass($category);
        $service = app($serviceClass);

        if (!$service instanceof TestServiceInterface) {
            throw new \InvalidArgumentException("Service for category '{$category}' does not implement TestServiceInterface");
        }

        return $service->run();
    }
}

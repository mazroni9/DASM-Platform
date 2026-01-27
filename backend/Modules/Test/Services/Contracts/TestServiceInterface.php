<?php

namespace Modules\Test\Services\Contracts;

use Modules\Test\Entities\AuctionTestResult;

interface TestServiceInterface
{
    public function run(): AuctionTestResult;
}

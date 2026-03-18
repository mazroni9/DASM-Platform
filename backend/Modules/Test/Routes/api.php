<?php

use Illuminate\Support\Facades\Route;
use Modules\Test\Http\Controllers\AuctionTestController;
use Modules\Test\Http\Controllers\ScenarioRunController;

Route::get('/', [AuctionTestController::class, 'index'])
    ->middleware('can:auction_tests.view');

Route::get('/latest', [AuctionTestController::class, 'getLatest'])
    ->middleware('can:auction_tests.view');

Route::get('/categories', [AuctionTestController::class, 'getCategories'])
    ->middleware('can:auction_tests.view');

// Scenario-based load runs (scenario definitions + run history)
Route::get('/scenarios', [ScenarioRunController::class, 'listScenarios'])
    ->middleware('can:auction_tests.view');
Route::get('/scenario-runs', [ScenarioRunController::class, 'indexRuns'])
    ->middleware('can:auction_tests.view');
Route::post('/scenario-runs', [ScenarioRunController::class, 'runScenario'])
    ->middleware('can:auction_tests.run');
Route::get('/scenario-runs/{id}', [ScenarioRunController::class, 'showRun'])
    ->whereNumber('id')
    ->middleware('can:auction_tests.view_details');

Route::get('/{id}', [AuctionTestController::class, 'show'])
    ->whereNumber('id')
    ->middleware('can:auction_tests.view_details');

Route::post('/run-all', [AuctionTestController::class, 'runAll'])
    ->middleware('can:auction_tests.run_all');

Route::post('/run/{category}', [AuctionTestController::class, 'runCategory'])
    ->where('category', 'logic|transitions|price_updates|state_consistency')
    ->middleware('can:auction_tests.run');

Route::delete('/{id}', [AuctionTestController::class, 'destroy'])
    ->whereNumber('id')
    ->middleware('can:auction_tests.delete');

Route::delete('/bulk', [AuctionTestController::class, 'bulkDestroy'])
    ->middleware('can:auction_tests.delete');

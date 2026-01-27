<?php

use Illuminate\Support\Facades\Route;
use Modules\Test\Http\Controllers\AuctionTestController;

Route::get('/', [AuctionTestController::class, 'index'])
    ->middleware('can:auction_tests.view');

Route::get('/latest', [AuctionTestController::class, 'getLatest'])
    ->middleware('can:auction_tests.view');

Route::get('/categories', [AuctionTestController::class, 'getCategories'])
    ->middleware('can:auction_tests.view');

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

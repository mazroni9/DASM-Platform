<?php

use App\Jobs\UpdateCarAuctionJob;
use Illuminate\Foundation\Inspiring;
use App\Jobs\MoveCarToFixedAuctionJob;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::job(new UpdateCarAuctionJob('instant'))->dailyAt('19:00')
    ->timezone('Asia/Riyadh');
Schedule::job(new UpdateCarAuctionJob('late'))->dailyAt('22:00')
    ->timezone('Asia/Riyadh');

Schedule::job(new MoveCarToFixedAuctionJob())->everyMinute();

// Activate scheduled auctions at 7:00 PM (Instant Market opening time)
Schedule::command('auction:activate-scheduled')
    ->dailyAt('19:00')
    ->timezone('Asia/Riyadh')
    ->withoutOverlapping()
    ->onOneServer()
    ->appendOutputTo(storage_path('logs/scheduled-auctions.log'));

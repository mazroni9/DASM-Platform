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
// Schedule::job(new UpdateCarAuctionJob('live'))->dailyAt('16:00')
// ->timezone('Asia/Riyadh');
Schedule::job(new MoveCarToFixedAuctionJob())->everyMinute();
// Schedule::job(new MoveCarToFixedAuctionJob())->twiceDailyAt(22,16)
// ->timezone('Asia/Riyadh');

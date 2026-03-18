<?php

namespace App\Jobs;

use Carbon\Carbon;
use App\Models\Auction;
use App\Enums\AuctionType;
use App\Enums\AuctionStatus;
use Illuminate\Support\Facades\Log;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;

class MoveCarToFixedAuctionJob implements ShouldQueue
{
    use Queueable;

    public function __construct()
    {
        //
    }

    public function handle(): void
    {
        $now = Carbon::now();

        $affectedRows = Auction::query()
            ->whereIn('auction_type', [
                AuctionType::LIVE_INSTANT->value,
                AuctionType::SILENT_INSTANT->value,
            ])
            ->whereIn('status', AuctionStatus::activeValues())
            ->where(function ($query) use ($now) {
                $query
                    ->where(function ($q) use ($now) {
                        $q->whereNotNull('extended_until')
                          ->where('extended_until', '<', $now);
                    })
                    ->orWhere(function ($q) use ($now) {
                        $q->whereNull('extended_until')
                          ->where('end_time', '<', $now);
                    });
            })
            ->update([
                'control_room_approved' => true,
                'status'                => AuctionStatus::ACTIVE->value, // normalize
                'auction_type'          => AuctionType::FIXED->value,
                'approved_for_live'     => false,
            ]);

        Log::info("MoveCarToFixedAuctionJob: Updated {$affectedRows} auctions from LIVE_INSTANT/SILENT_INSTANT to FIXED.");
    }
}

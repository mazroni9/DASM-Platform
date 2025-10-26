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

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $affectedRows = Auction::whereIn('auction_type', [AuctionType::LIVE_INSTANT->value, AuctionType::SILENT_INSTANT->value])
            ->where('status', AuctionStatus::ACTIVE->value)
            ->where('end_time', '<', Carbon::now())
            ->where(function($query) {
                $query->where('extended_until', '<', Carbon::now())
                    ->orWhere('extended_until', null);
            })
            ->update([
                'control_room_approved' => true,
                'status' => AuctionStatus::ACTIVE->value,
                'auction_type' => AuctionType::FIXED->value,
                'approved_for_live' => false
            ]);

        Log::error("Updated {$affectedRows} auctions from LIVE_instant and SILENT_INSTANT to FIXED");
    }
}

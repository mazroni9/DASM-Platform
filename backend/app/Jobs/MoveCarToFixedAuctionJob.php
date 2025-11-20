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
        $now = Carbon::now();

        $affectedRows = Auction::query()
            ->whereIn('auction_type', [
                AuctionType::LIVE_INSTANT->value,
                AuctionType::SILENT_INSTANT->value,
            ])
            ->where('status', AuctionStatus::ACTIVE->value)
            ->where(function ($query) use ($now) {
                $query
                    // لو المزاد متمدّد، نعتمد على extended_until
                    ->where(function ($q) use ($now) {
                        $q->whereNotNull('extended_until')
                          ->where('extended_until', '<', $now);
                    })
                    // لو مفيش تمديد، نعتمد على end_time
                    ->orWhere(function ($q) use ($now) {
                        $q->whereNull('extended_until')
                          ->where('end_time', '<', $now);
                    });
            })
            ->update([
                'control_room_approved' => true,
                'status'                => AuctionStatus::ACTIVE->value,
                'auction_type'          => AuctionType::FIXED->value,
                'approved_for_live'     => false,
            ]);

        Log::info("MoveCarToFixedAuctionJob: Updated {$affectedRows} auctions from LIVE_INSTANT/SILENT_INSTANT to FIXED.");
    }
}

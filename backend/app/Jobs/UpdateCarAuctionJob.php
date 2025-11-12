<?php

namespace App\Jobs;

use App\Models\Auction;
use App\Enums\AuctionType;
use App\Enums\AuctionStatus;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class UpdateCarAuctionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(public $status)
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::error("Starting UpdateCarAuctionJob with status: {$this->status}");

        try {
            switch ($this->status) {
                case "instant":
                    $this->transitionDelayedToInstant();
                    break;

                case "late":
                    // This logic remains for transitioning auctions into the 'delayed'/'late' state.
                    $affectedRows = Auction::where('auction_type', AuctionType::LIVE_INSTANT->value)
                        ->where('status', AuctionStatus::ACTIVE->value)
                        ->update([
                            'control_room_approved' => true,
                            'status' => AuctionStatus::ACTIVE->value,
                            'auction_type' => AuctionType::SILENT_INSTANT->value,
                        ]);

                    Log::error("Updated {$affectedRows} auctions from LIVE_INSTANT to SILENT_INSTANT (late mode)");
                    break;

                default:
                    Log::warning("Unknown status '{$this->status}' in UpdateCarAuctionJob");
                    break;
            }
        } catch (\Exception $e) {
            Log::error("Error in UpdateCarAuctionJob with status '{$this->status}': " . $e->getMessage());
            throw $e;
        }

        Log::error("Completed UpdateCarAuctionJob with status: {$this->status}");
    }

    /**
     * Transitions auctions from 'delayed' (Silent Instant) to 'instant' (Live Instant).
     * Calculates a new opening price based on the average of bids in a specific KSA time window.
     */
    private function transitionDelayedToInstant(): void
    {
        Log::error("Starting transition from 'delayed' (SILENT_INSTANT) to 'instant' (LIVE_INSTANT) auctions.");

        $ksaTimezone = 'Asia/Riyadh';
        // The cron job is scheduled to run at 4:01 PM KSA, so `now()` is appropriate.
        $endOfWindowKSA = Carbon::now($ksaTimezone)->setTime(16, 0, 0);
        $startOfWindowKSA = $endOfWindowKSA->copy()->subDay()->setTime(22, 0, 0);

        // We assume 'delayed' auctions are of type SILENT_INSTANT.
        $auctionsToTransition = Auction::where('auction_type', AuctionType::SILENT_INSTANT->value)
            ->where('status', AuctionStatus::ACTIVE->value)
            ->get();

        Log::error("Found {$auctionsToTransition->count()} auctions to transition from delayed to instant.");

        foreach ($auctionsToTransition as $auction) {
            $newAverage = $auction->bids()
                ->whereBetween('created_at', [$startOfWindowKSA, $endOfWindowKSA])
                ->avg('bid_amount');

            // Fallback to the auction's original starting_bid if no bids were placed.
            if (is_null($newAverage) || $newAverage == 0) {
                $newAverage = $auction->starting_bid;
            }

            $auction->update([
                'opening_price' => $newAverage,
                'current_bid' => null, // "T-Zeroing": Reset the current bid for the instant phase.
                'auction_type' => AuctionType::LIVE_INSTANT->value, // Transition to 'instant'.
                'control_room_approved' => true,
                'approved_for_live' => false,
            ]);

            Log::error("Auction #{$auction->id} transitioned to LIVE_INSTANT. New opening price set to: {$newAverage}");
        }
    }
}

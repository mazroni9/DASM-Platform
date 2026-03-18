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

    public function __construct(public $status)
    {
        //
    }

    public function handle(): void
    {
        Log::error("Starting UpdateCarAuctionJob with status: {$this->status}");

        try {
            switch ($this->status) {
                case "instant":
                    $this->transitionDelayedToInstant();
                    break;

                case "late":
                    $affectedRows = Auction::where('auction_type', AuctionType::LIVE_INSTANT->value)
                        ->whereIn('status', AuctionStatus::activeValues())
                        ->update([
                            'control_room_approved' => true,
                            'status' => AuctionStatus::ACTIVE->value, // normalize to live
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

    private function transitionDelayedToInstant(): void
    {
        Log::error("Starting transition from 'delayed' (SILENT_INSTANT) to 'instant' (LIVE_INSTANT) auctions.");

        $ksaTimezone = 'Asia/Riyadh';

        $endOfWindowKSA = Carbon::now($ksaTimezone)->setTime(16, 0, 0);
        $startOfWindowKSA = $endOfWindowKSA->copy()->subDay()->setTime(22, 0, 0);

        // ✅ convert to UTC for DB safety (لو DB UTC)
        $startUTC = $startOfWindowKSA->copy()->utc();
        $endUTC   = $endOfWindowKSA->copy()->utc();

        $auctionsToTransition = Auction::where('auction_type', AuctionType::SILENT_INSTANT->value)
            ->whereIn('status', AuctionStatus::activeValues())
            ->get();

        Log::error("Found {$auctionsToTransition->count()} auctions to transition from delayed to instant.");

        foreach ($auctionsToTransition as $auction) {
            $newAverage = $auction->bids()
                ->whereBetween('created_at', [$startUTC, $endUTC])
                ->avg('bid_amount');

            if (is_null($newAverage) || (float)$newAverage == 0.0) {
                $newAverage = $auction->starting_bid; // ✅ now safe (accessor)
            }

            $auction->update([
                'opening_price' => $newAverage,
                'current_bid' => null,
                'auction_type' => AuctionType::LIVE_INSTANT->value,
                'control_room_approved' => true,
                'approved_for_live' => false,
                'status' => AuctionStatus::ACTIVE->value, // normalize
            ]);

            Log::error("Auction #{$auction->id} transitioned to LIVE_INSTANT. New opening price set to: {$newAverage}");
        }
    }
}

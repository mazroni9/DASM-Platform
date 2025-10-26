<?php

namespace App\Jobs;

use App\Models\Auction;
use App\Enums\AuctionType;
use App\Enums\AuctionStatus;
use Illuminate\Support\Facades\Log;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class UpdateCarAuctionJob implements ShouldQueue
{
    use  Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(public $status)
    {
        // Constructor logging removed - job execution is logged in handle() method
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
                    // Update silent instant auctions to live instant auctions
                    $affectedRows = Auction::whereIn('auction_type', [AuctionType::LIVE->value, AuctionType::SILENT_INSTANT->value])
                        ->where('status', AuctionStatus::ACTIVE->value)
                        ->update([
                            'control_room_approved' => true,
                            'status' => AuctionStatus::ACTIVE->value,
                            'auction_type' => AuctionType::LIVE_INSTANT->value,
                            'approved_for_live' => false
                        ]);

                    Log::error("Updated {$affectedRows} auctions from SILENT_INSTANT to LIVE_INSTANT (status: {$this->status})");
                    break;
                // case "live":
                //     // Update silent instant auctions to live instant auctions
                //     $affectedRows = Auction::where('auction_type', AuctionType::SILENT_INSTANT->value)
                //         ->where('status', AuctionStatus::ACTIVE->value)
                //         ->update([
                //             'control_room_approved' => true,
                //             'status' => AuctionStatus::ACTIVE->value,
                //             'auction_type' => AuctionType::LIVE->value,
                //         ]);

                //     Log::error("Updated {$affectedRows} auctions from SILENT_INSTANT to LIVE (status: {$this->status})");
                //     break;

                case "late":
                    // Update live instant auctions to silent instant auctions
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
}

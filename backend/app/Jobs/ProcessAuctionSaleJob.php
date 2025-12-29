<?php

namespace App\Jobs;

use App\Enums\AuctionStatus;
use App\Models\Auction;
use App\Models\CommissionTier;
use App\Models\Setting;
use App\Models\Settlement;
use App\Models\User;
use App\Notifications\NewSaleNotification;
use App\Notifications\NewSaleConfirmedNotification;
use App\Enums\UserRole;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class ProcessAuctionSaleJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $auctionId;
    protected $triggeringBidId;

    /**
     * Create a new job instance.
     */
    public function __construct(int $auctionId, int $triggeringBidId)
    {
        $this->auctionId = $auctionId;
        $this->triggeringBidId = $triggeringBidId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        DB::beginTransaction();
        try {
            $auction = Auction::with('car', 'bids')->lockForUpdate()->find($this->auctionId);
            Log::info("ProcessAuctionSaleJob: Auction", [$auction]);
            if (!$auction || $auction->status !== AuctionStatus::ACTIVE) {
                Log::info("ProcessAuctionSaleJob: Auction {$this->auctionId} not active or not found. Aborting job.");
                DB::rollBack();
                return;
            }

            $highestBid = $auction->bids()->orderBy('bid_amount', 'desc')->first();

            if (!$highestBid || $highestBid->id !== $this->triggeringBidId) {
                Log::info("ProcessAuctionSaleJob: A higher bid was placed for auction {$this->auctionId}. Aborting job for bid {$this->triggeringBidId}.");
                DB::rollBack();
                return;
            }

            $auction->status = AuctionStatus::ENDED->value;
            $auction->save();

            $buyer = User::find($highestBid->user_id);
            $seller = $auction->car?->owner;

            $platformFee = CommissionTier::getCommissionForPrice($highestBid->bid_amount);
            $tamFeeSetting = Setting::where('key', 'tamFee')->first();
            $tamFee = $tamFeeSetting->value;
            $muroorFee = Setting::where('key', 'muroorFee')->first()->value;

            $netAmount = $highestBid->bid_amount - $platformFee;
            $buyerNetAmount = $highestBid->bid_amount + $platformFee + $tamFee + $muroorFee;

            $settlement = Settlement::create([
                'auction_id' => $auction->id,
                'seller_id' => $seller->id,
                'buyer_id' => $buyer->id,
                'car_id' => $auction->car_id,
                'final_price' => $highestBid->bid_amount,
                'platform_fee' => $platformFee,
                'tam_fee' => $tamFee,
                'muroor_fee' => $muroorFee,
                'net_amount' => $netAmount,
                'buyer_net_amount' => $buyerNetAmount,
                'status' => 'pending'
            ]);

            $buyer->notify(new NewSaleNotification($settlement));

            // Notify all admins about the new sale
            $admins = User::whereIn('type', [UserRole::ADMIN, UserRole::SUPER_ADMIN])->get();
            Notification::send($admins, new NewSaleConfirmedNotification($settlement));

            DB::commit();
            Log::info("ProcessAuctionSaleJob: Sale confirmed successfully for auction {$this->auctionId} triggered by bid {$this->triggeringBidId}.");
        } catch (\Throwable $th) {
            Log::error("ProcessAuctionSaleJob: Failed for auction {$this->auctionId}. Error: " . $th->getMessage());
            DB::rollBack();
            // Optionally, re-throw the exception to let Laravel handle the failed job
            // throw $th;
        }
    }
}

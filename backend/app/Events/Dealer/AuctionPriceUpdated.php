<?php

namespace App\Events\Dealer;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AuctionPriceUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $auctionId;
    public float $price;
    public string $currency;
    public ?int $bidderId;
    public float $nextMinBid;
    public ?string $endTime;

    public function __construct(
        int $auctionId,
        float $price,
        ?int $bidderId = null,
        ?string $endTime = null
    ) {
        $this->auctionId = $auctionId;
        $this->price = $price;
        $this->currency = 'SAR';
        $this->bidderId = $bidderId;
        $this->nextMinBid = $price + max($price * 0.01, 100); // 1% or min 100
        $this->endTime = $endTime;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('auction.' . $this->auctionId);
    }

    public function broadcastAs(): string
    {
        return 'price-updated';
    }

    public function broadcastWith(): array
    {
        return [
            'auction_id' => $this->auctionId,
            'price' => $this->price,
            'currency' => $this->currency,
            'bidder_id' => $this->bidderId,
            'next_min_bid' => $this->nextMinBid,
            'end_time' => $this->endTime,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}

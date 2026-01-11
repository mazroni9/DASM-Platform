<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LiveMarketBidEvent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $bidderId;
    public $auction;
    public $bidAmount;
    public $car;

    /**
     * Create a new event instance.
     */
    public function __construct($bidderId, $auction, $bidAmount, $car)
    {
        $this->bidderId = $bidderId;
        $this->auction = $auction;
        $this->bidAmount = $bidAmount;
        $this->car = $car;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn()
    {
        return [
            new Channel('auction.live'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs()
    {
        return 'LiveMarketBidEvent';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith()
    {
        return [
            'bidder_id' => $this->bidderId,
            'auction_id' => $this->auction->id,
            'bid_amount' => (float) $this->bidAmount,
            'car_make' => $this->car->make,
            'car_model' => $this->car->model,
            'car_year' => $this->car->year,
            'current_bid' => (float) $this->auction->current_bid,
            'message' => 'تم تقديم مزايدة جديدة على ' . $this->car->make . ' ' . $this->car->model,
            'timestamp' => now()->toISOString()
        ];
    }
}

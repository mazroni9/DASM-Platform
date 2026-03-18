<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CarMovedBetweenAuctionsEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $channelName;
    public $data;

    /**
     * Create a new event instance.
     */
    public function __construct(public $auction, public $auctionType, public $car)
    {
        $this->channelName = 'auction.updates';
        $this->data = [
            'auction' => $auction,
            'auction_type' => $auctionType,
            'car' => $car,
            'message' => 'Car moved to ' . $auctionType . ' auction',
            'timestamp' => now()->toISOString()
        ];
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn()
    {
        return [
            new Channel('auction.updates'),
            new Channel('auction.' . $this->auctionType),
            new Channel('auction.live'),
            new Channel('auction.instant'),
            new Channel('auction.silent')
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs()
    {
        return 'CarMovedBetweenAuctionsEvent';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith()
    {
        return [
            'channelName' => $this->channelName,
            'data' => $this->data,
            'auction_id' => $this->auction->id,
            'car_id' => $this->car->id,
            'auction_type' => $this->auctionType,
            'car_make' => $this->car->make,
            'car_model' => $this->car->model,
            'car_year' => $this->car->year,
            'current_bid' => $this->auction->current_bid,
            'starting_bid' => $this->auction->starting_bid
        ];
    }
}

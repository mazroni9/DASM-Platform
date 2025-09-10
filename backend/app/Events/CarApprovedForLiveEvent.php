<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CarApprovedForLiveEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $channelName;
    public $data;

    /**
     * Create a new event instance.
     */
    public function __construct(public $auction, public $car)
    {
        $this->channelName = 'auction.live.approved';
        $this->data = [
            'auction' => $auction,
            'car' => $car,
            'message' => 'Car approved for live auction',
            'timestamp' => now()->toISOString()
        ];
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn()
    {
        return [
            new Channel('auction.live.approved'),
            new Channel('auction.live'),
            new Channel('auction.updates')
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs()
    {
        return 'CarApprovedForLiveEvent';
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
            'car_make' => $this->car->make,
            'car_model' => $this->car->model,
            'car_year' => $this->car->year,
            'current_bid' => $this->auction->current_bid,
            'starting_bid' => $this->auction->starting_bid,
            'approved_for_live' => $this->auction->approved_for_live
        ];
    }
}

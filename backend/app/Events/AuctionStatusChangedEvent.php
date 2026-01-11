<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AuctionStatusChangedEvent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $channelName;
    public $data;

    /**
     * Create a new event instance.
     */
    public function __construct(public $auction, public $oldStatus, public $newStatus, public $car)
    {
        $this->channelName = 'auction.status.changed';
        $this->data = [
            'auction' => $auction,
            'car' => $car,
            'old_status' => is_object($oldStatus) ? $oldStatus->value : $oldStatus,
            'new_status' => is_object($newStatus) ? $newStatus->value : $newStatus,
            'message' => 'Auction status changed from ' . (is_object($oldStatus) ? $oldStatus->value : $oldStatus) . ' to ' . (is_object($newStatus) ? $newStatus->value : $newStatus),
            'timestamp' => now()->toISOString()
        ];
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn()
    {
        return [
            new Channel('auction.status.changed'),
            new Channel('auction.' . $this->auction->id)
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs()
    {
        return 'AuctionStatusChangedEvent';
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
            'old_status' => is_object($this->oldStatus) ? $this->oldStatus->value : $this->oldStatus,
            'new_status' => is_object($this->newStatus) ? $this->newStatus->value : $this->newStatus,
            'current_bid' => $this->auction->current_bid,
            'starting_bid' => $this->auction->starting_bid,
            'approved_for_live' => $this->auction->approved_for_live,
            'control_room_approved' => $this->auction->control_room_approved
        ];
    }
}

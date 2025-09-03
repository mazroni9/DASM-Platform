<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewBidEvent implements ShouldBroadcast
{
    public $channelName;
    public $data;
    public $name;

    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     *
     * @return void
     */
    public function __construct(public $auction)
    {
        $this->channelName = 'auction.' . $auction->car_id;
        $this->data = [
            'active_auction' => $auction,
            'total_bids' => $auction ? $auction->bids_count : 0
        ];


        $this->name = 'new.bid';
    }

    public function broadcastAs()
    {
        return 'NewBidEvent';
    }

    /**
     * Get the channels the event should broadcast on.
     * https://laravel.com/docs/broadcasting#model-broadcasting-channel-conventions
     *
     * @return \Illuminate\Broadcasting\Channel|array
     */
    public function broadcastOn()
    {
        return [new Channel('auction.' . $this->auction->car_id)];
    }

    public function broadcastWith()
    {
        return [
            'channelName' => "auction",
            'data' => $this->data
        ];
    }
}

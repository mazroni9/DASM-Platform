<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewBidEvent implements ShouldBroadcastNow
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
        if ($auction->auction_type === \App\Enums\AuctionType::FIXED) {
            $this->channelName = 'auction.fixed';
        } else {
            $this->channelName = 'auction.' . $auction->car_id;
        }
        
        $this->data = [
            'active_auction' => $auction,
            'total_bids' => $auction ? ($auction->bids_count ?? $auction->bids()->count()) : 0
        ];


        $this->name = 'new.bid';
    }

    public function broadcastAs()
    {
        return 'NewBidEvent';
    }

    /**
     * @return \Illuminate\Broadcasting\Channel|array
     */
    public function broadcastOn()
    {
        $channels = [new Channel($this->channelName)];
        $auctionIdChannel = 'auction.' . $this->auction->id;
        if ($this->channelName !== $auctionIdChannel) {
            $channels[] = new Channel($auctionIdChannel);
        }
        return $channels;
    }

    public function broadcastWith()
    {
        return [
            'channelName' => "auction",
            'data' => $this->data
        ];
    }
}

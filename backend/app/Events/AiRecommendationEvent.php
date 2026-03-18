<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AiRecommendationEvent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $userId;
    public array $recommendation;

    /**
     * Create a new event instance.
     * 
     * @param int $userId The user to send the recommendation to
     * @param array $recommendation The recommendation data
     */
    public function __construct(int $userId, array $recommendation)
    {
        $this->userId = $userId;
        $this->recommendation = $recommendation;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel("dealer.{$this->userId}.ai")];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'opportunity-detected';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'vehicle_id' => $this->recommendation['vehicle_id'],
            'name' => $this->recommendation['name'],
            'discount_percentage' => $this->recommendation['discount_percentage'],
            'reason' => $this->recommendation['reason'],
            'confidence_score' => $this->recommendation['confidence_score'],
            'current_price' => $this->recommendation['current_price'],
            'market_price' => $this->recommendation['market_price'],
            'timestamp' => $this->recommendation['timestamp'] ?? now()->toIso8601String(),
        ];
    }
}

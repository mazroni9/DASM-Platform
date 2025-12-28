<?php

namespace App\Events\Dealer;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AiOpportunityDetected implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $userId;
    public int $vehicleId;
    public string $vehicleName;
    public float $discountPercentage;
    public string $reason;
    public float $confidenceScore;
    public float $currentPrice;
    public float $marketPrice;

    public function __construct(
        int $userId,
        int $vehicleId,
        string $vehicleName,
        float $discountPercentage,
        string $reason,
        float $confidenceScore,
        float $currentPrice,
        float $marketPrice
    ) {
        $this->userId = $userId;
        $this->vehicleId = $vehicleId;
        $this->vehicleName = $vehicleName;
        $this->discountPercentage = $discountPercentage;
        $this->reason = $reason;
        $this->confidenceScore = $confidenceScore;
        $this->currentPrice = $currentPrice;
        $this->marketPrice = $marketPrice;
    }

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('dealer.' . $this->userId . '.ai');
    }

    public function broadcastAs(): string
    {
        return 'opportunity-detected';
    }

    public function broadcastWith(): array
    {
        return [
            'vehicle_id' => $this->vehicleId,
            'name' => $this->vehicleName,
            'discount_percentage' => $this->discountPercentage,
            'reason' => $this->reason,
            'confidence_score' => $this->confidenceScore,
            'current_price' => $this->currentPrice,
            'market_price' => $this->marketPrice,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}

<?php

namespace App\Events\Dealer;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SystemLatencyCheck implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $userId;
    public string $token;
    public string $serverTime;

    public function __construct(int $userId, string $token)
    {
        $this->userId = $userId;
        $this->token = $token;
        $this->serverTime = now()->toIso8601String();
    }

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('dealer.' . $this->userId . '.system');
    }

    public function broadcastAs(): string
    {
        return 'pong';
    }

    public function broadcastWith(): array
    {
        return [
            'token' => $this->token,
            'server_time' => $this->serverTime,
        ];
    }
}

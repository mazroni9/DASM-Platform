<?php

namespace Modules\Test\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AuctionTestResultUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public $testResult)
    {
    }

    public function broadcastAs(): string
    {
        return 'AuctionTestResultUpdated';
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('admin.auction-tests'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'test_result' => [
                'id' => $this->testResult->id,
                'test_name' => $this->testResult->test_name,
                'test_category' => $this->testResult->test_category->value,
                'status' => $this->testResult->status->value,
                'message' => $this->testResult->message,
                'execution_time_ms' => $this->testResult->execution_time_ms,
                'completed_at' => $this->testResult->completed_at?->toISOString(),
                'errors' => $this->testResult->errors,
            ],
        ];
    }
}

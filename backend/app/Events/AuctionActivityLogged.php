<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * يُبث عند إضافة سجل نشاط مزاد (عبر الـ queue لعدم إبطاء الطلبات).
 */
class AuctionActivityLogged implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $logId,
        public string $eventType,
        public ?string $subjectType,
        public ?int $subjectId,
        public array $payload,
        public string $occurredAt
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel(config('auction_log.channel', 'admin.auction-log')),
        ];
    }

    public function broadcastAs(): string
    {
        return config('auction_log.broadcast_event', 'AuctionActivityLogged');
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->logId,
            'event_type' => $this->eventType,
            'subject_type' => $this->subjectType,
            'subject_id' => $this->subjectId,
            'payload' => $this->payload,
            'occurred_at' => $this->occurredAt,
        ];
    }

    public function broadcastQueue(): string
    {
        return config('auction_log.queue', 'auction-log');
    }
}

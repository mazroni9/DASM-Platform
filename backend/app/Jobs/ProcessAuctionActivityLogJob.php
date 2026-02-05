<?php

namespace App\Jobs;

use App\Events\AuctionActivityLogged;
use App\Models\AuctionActivityLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessAuctionActivityLogJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $eventType,
        public ?string $subjectType,
        public ?int $subjectId,
        public array $payload,
        public ?string $occurredAt = null
    ) {
        $this->onQueue(config('auction_log.queue', 'auction-log'));
    }

    public function handle(): void
    {
        $occurredAt = $this->occurredAt ?? now()->toIso8601String();

        $log = AuctionActivityLog::create([
            'event_type' => $this->eventType,
            'subject_type' => $this->subjectType,
            'subject_id' => $this->subjectId,
            'payload' => $this->payload,
            'occurred_at' => $occurredAt,
        ]);

        event(new AuctionActivityLogged(
            $log->id,
            $this->eventType,
            $this->subjectType,
            $this->subjectId,
            $this->payload,
            $log->occurred_at->toIso8601String()
        ));
    }
}

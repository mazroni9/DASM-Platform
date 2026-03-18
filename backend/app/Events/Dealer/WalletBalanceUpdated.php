<?php

namespace App\Events\Dealer;

use App\Models\Wallet;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WalletBalanceUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $userId;
    public float $availableBalance;
    public float $fundedBalance;
    public string $currency;

    public function __construct(int $userId, Wallet $wallet)
    {
        $this->userId = $userId;
        $this->availableBalance = $wallet->available_balance;
        $this->fundedBalance = $wallet->funded_balance;
        $this->currency = 'SAR';
    }

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('dealer.' . $this->userId . '.wallet');
    }

    public function broadcastAs(): string
    {
        return 'balance-updated';
    }

    public function broadcastWith(): array
    {
        return [
            'available_balance' => $this->availableBalance,
            'funded_balance' => $this->fundedBalance,
            'on_hold' => $this->fundedBalance,
            'currency' => $this->currency,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}

<?php

namespace App\Http\Resources;

use App\Enums\AuctionStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LiveAuctionSessionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return[
            'current_live_car' => $this->auctions
            ->where('approved_for_live', true)
                ->where('status', AuctionStatus::ACTIVE->value)
                ->first(),
            'pending_live_auctions' => $this->auctions
            ->sortByDesc('approved_for_live',SORT_NUMERIC)
            ->where('status', AuctionStatus::ACTIVE->value)->toArray(),

            'completed_live_auctions' => $this->auctions
            ->where('status', AuctionStatus::ENDED->value)
            ->toArray()
        ];
    }
}

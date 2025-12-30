<?php

namespace App\Http\Resources;

use App\Enums\AuctionStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LiveAuctionSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $active = AuctionStatus::activeValues();

        return [
            'current_live_car' => $this->resource->auctions()
                ->where('approved_for_live', true)
                ->whereIn('status', $active)
                ->orderBy('id')
                ->first(),

            'pending_live_auctions' => $this->resource->auctions()
                ->whereIn('status', $active)
                ->orderByDesc('approved_for_live')
                ->get(),

            'completed_live_auctions' => $this->resource->auctions()
                ->where('status', AuctionStatus::ENDED->value)
                ->get(),
        ];
    }
}

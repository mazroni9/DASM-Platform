<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicMarketCarResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'make' => $this->make,
            'model' => $this->model,
            'year' => $this->year,

            'odometer' => $this->odometer,
            'evaluation_price' => $this->evaluation_price,

            // لو عندك images كـ JSON column
            'images' => is_array($this->images) ? $this->images : ($this->images ? (array) $this->images : []),

            'color' => $this->color ?? null,
            'condition' => $this->condition ?? null,
            'auction_status' => $this->auction_status ?? null,

            'created_at' => optional($this->created_at)->toISOString(),
        ];
    }
}

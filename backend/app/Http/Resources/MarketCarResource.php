<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class MarketCarResource extends JsonResource
{
    public function toArray($request)
    {
        // Generate anonymous label for comparison (dealer_id removed - using user_id)
        $ownerLabel = $this->user_id ? ('U-' . substr(sha1($this->user_id . '|' . $this->id), 0, 8)) : null;

        return [
            'id'               => $this->id,
            'make'             => $this->make,
            'model'            => $this->model,
            'year'             => $this->year ? (int) $this->year : null,
            'color'            => $this->color,
            'engine'           => $this->engine,
            'transmission'     => $this->transmission,
            'odometer'         => $this->odometer,
            'condition'        => $this->condition,
            'evaluation_price' => $this->evaluation_price, // السعر المرجعي للمقارنة
            'auction_status'   => $this->auction_status,
            'created_at'       => $this->created_at,
            'owner_label'      => $ownerLabel,
            'description'      => $this->description ? Str::limit(strip_tags($this->description), 180) : null,
        ];
    }
}

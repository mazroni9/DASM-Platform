<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ShipmentItemResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'name' => $this->name,
            'qty'  => (int) $this->qty,
        ];
    }
}

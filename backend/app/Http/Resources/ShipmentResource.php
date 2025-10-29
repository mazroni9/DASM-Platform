<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ShipmentResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'             => $this->id,
            'recipient'      => $this->recipient_name,
            'address'        => $this->address_line,
            'trackingNumber' => $this->tracking_number,
            'shippingStatus' => (int) $this->shipping_status, // 0..3
            'paymentStatus'  => $this->payment_status,
            'createdAt'      => optional($this->created_at)->toIso8601String(),
            'items'          => ShipmentItemResource::collection($this->whenLoaded('items')),
        ];
    }
}

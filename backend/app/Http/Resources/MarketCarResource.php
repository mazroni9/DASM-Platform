<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class MarketCarResource extends JsonResource
{
    public function toArray($request)
    {
        // إخفاء الهوية الحقيقية للمعرض (dealer) وإظهار label مبهم للمقارنة فقط
        $dealerLabel = $this->dealer_id ? ('D-' . substr(sha1($this->dealer_id . '|' . $this->id), 0, 8)) : null;

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
            'dealer_label'     => $dealerLabel,
            'description'      => $this->description ? Str::limit(strip_tags($this->description), 180) : null,
        ];
    }
}

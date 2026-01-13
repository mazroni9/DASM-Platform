<?php

namespace App\Http\Resources\Admin;

use App\Enums\CarCondition;
use Illuminate\Http\Request;
use App\Enums\CarTransmission;
use Illuminate\Http\Resources\Json\JsonResource;

class CarResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->make . ' ' . $this->model . ' ' . $this->year,
            'description' => $this->description,
            'make' => $this->make,
            'model' => $this->model,
            'year' => $this->year,
            'image' => $this->images ? $this->images[0] : null,
            'images' => $this->images,
            "condition" => CarCondition::getTranslations()[$this->condition->value],
            "auction_status" => $this->auction_status,
            "market_category" => $this->market_category,
            'min_price' => $this->min_price,
            'max_price' => $this->max_price,
            'vin' => $this->vin,
            'odometer' => $this->odometer,
            'color' => $this->color,
            "engine" => $this->engine,
            "transmission" => CarTransmission::getTranslations()[$this->transmission->value],
            //"dealer_id" => $this->dealer_id,
            // dealer key removed - dealers table dropped
            "user" => [
                'id' => $this->user_id,
                'first_name' => $this->user->first_name,
                'last_name' => $this->user->last_name,
                'name' => $this->user->first_name . ' ' . $this->user->last_name
            ],
            "evaluation_price" =>  $this->evaluation_price, //$this->active_auction?->current_bid ??
            "province" => $this->province,
            "created_at" => $this->created_at?->format('Y-m-d'),
            'active_auction' => $this->activeAuction,
        ];
    }
}

<?php

namespace App\Http\Resources;

use App\Enums\CarCondition;
use Illuminate\Http\Request;
use App\Enums\CarTransmission;
use Illuminate\Http\Resources\Json\JsonResource;

class CarCardResource extends JsonResource
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
            'image' => $this->images[0],
            'images' => $this->images,
            "condition" => CarCondition::getTranslations()[$this->condition->value],
            "auction_status" => $this->auction_status,
            "market_category" => $this->market_category,
            //"color" => $this->color,
            "engine" => $this->engine,
            "transmission" => CarTransmission::getTranslations()[$this->transmission->value],
            //"dealer_id" => $this->dealer_id,
            //"user_id" => $this->user_id,
            "evaluation_price" =>  $this->evaluation_price, //$this->active_auction?->current_bid ??
            "province" => $this->province,
            "created_at" => $this->created_at->format('Y-m-d'),
            'active_auction' => $this->activeAuction,

        ];
    }

    public function paginationInformation($request, $paginated, $default)
    {
        $default['pagination']['current_page'] = $default['meta']['current_page'];
        $default['pagination']['last_page'] = $default['meta']['last_page'];
        $default['pagination']['per_page'] = $default['meta']['per_page'];
        $default['pagination']['total'] = $default['meta']['total'];

        unset($default['links']);
        unset($default['meta']);
        return $default;
    }
}

<?php

namespace App\Http\Resources;

use App\Enums\CarCondition;
use App\Enums\CarTransmission;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CarCardResource extends JsonResource
{
    /**
     * images ممكن تكون: null | array | json string
     */
    private function normalizeImages($images): array
    {
        if (is_array($images)) {
            return $images;
        }

        if (is_string($images)) {
            $decoded = json_decode($images, true);
            return is_array($decoded) ? $decoded : [];
        }

        return [];
    }

    /**
     * يجيب أول صورة بشكل آمن سواء كانت string أو array فيها url
     */
    private function getFirstImage(array $images): ?string
    {
        $first = $images[0] ?? null;

        if (is_string($first)) {
            return $first;
        }

        if (is_array($first)) {
            return $first['url']
                ?? $first['secure_url']
                ?? $first['path']
                ?? $first['image']
                ?? null;
        }

        return null;
    }

    /**
     * ترجمة Enum بشكل آمن (لو null أو key مش موجود يرجّع null)
     */
    private function safeEnumTranslation(string $enumClass, $enumValue): ?string
    {
        try {
            if ($enumValue === null) return null;

            $value = is_object($enumValue) && property_exists($enumValue, 'value')
                ? $enumValue->value
                : (is_string($enumValue) ? $enumValue : null);

            if (!$value) return null;

            $map = method_exists($enumClass, 'getTranslations')
                ? $enumClass::getTranslations()
                : [];

            return $map[$value] ?? $value; // fallback للقيمة نفسها
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $images = $this->normalizeImages($this->images ?? null);
        $firstImage = $this->getFirstImage($images);

        $conditionLabel = $this->safeEnumTranslation(CarCondition::class, $this->condition ?? null);
        $transmissionLabel = $this->safeEnumTranslation(CarTransmission::class, $this->transmission ?? null);

        // created_at ممكن تكون null في بعض الحالات النادرة
        $createdAt = $this->created_at ? $this->created_at->format('Y-m-d') : null;

        return [
            'id' => (int) ($this->id ?? 0),
            'title' => trim(($this->make ?? '') . ' ' . ($this->model ?? '') . ' ' . ($this->year ?? '')),
            'description' => $this->description ?? null,

            'make' => $this->make ?? null,
            'model' => $this->model ?? null,
            'year' => $this->year ?? null,

            // ✅ أهم إصلاح
            'image' => $firstImage,
            'images' => $images,

            'condition' => $conditionLabel,
            'auction_status' => $this->auction_status ?? null,
            'market_category' => $this->market_category ?? null,

            'engine' => $this->engine ?? null,
            'transmission' => $transmissionLabel,

            'evaluation_price' => $this->evaluation_price ?? null,
            'province' => $this->province ?? null,

            'created_at' => $createdAt,

            // relation (ممكن تكون null)
            'active_auction' => $this->whenLoaded('activeAuction', function () {
                return $this->activeAuction;
            }, $this->activeAuction ?? null),
        ];
    }

    public function paginationInformation($request, $paginated, $default)
    {
        // خليها null-safe برضه
        $meta = $default['meta'] ?? [];

        $default['pagination']['current_page'] = $meta['current_page'] ?? null;
        $default['pagination']['last_page'] = $meta['last_page'] ?? null;
        $default['pagination']['per_page'] = $meta['per_page'] ?? null;
        $default['pagination']['total'] = $meta['total'] ?? null;

        unset($default['links'], $default['meta']);

        return $default;
    }
}

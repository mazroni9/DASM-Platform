<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AuctionType;
use App\Enums\CarsMarketsCategory;
use App\Http\Controllers\Controller;
use App\Models\Car;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * Staging workflow for new cars / live market feed.
 * Delegates mutations to {@see AuctionController::approveRejectAuctionBulk}
 * and {@see AuctionController::moveBetweenAuctionsBulk} to avoid divergent business rules.
 */
class LiveMarketStagingController extends Controller
{
    /**
     * GET /api/admin/cars/pending (legacy alias)
     * GET /api/admin/live-market-staging/pending-cars
     */
    public function pendingCars(): JsonResponse
    {
        $cars = Car::query()
            ->with([
                'user:id,first_name,last_name,email',
                'reportImages',
                'auctions' => static fn ($q) => $q->orderByDesc('created_at')->limit(1),
            ])
            ->whereIn('auction_status', ['pending', 'available'])
            ->orderByDesc('created_at')
            ->limit(100)
            ->get();

        $rows = $cars->map(fn (Car $car) => $this->carToStagingRow($car))->values()->all();

        return response()->json([
            'status' => 'success',
            'data'   => $rows,
        ]);
    }

    /**
     * POST /api/admin/cars/approve (legacy)
     * POST /api/admin/live-market-staging/approve-to-instant
     */
    public function approveToInstant(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id'     => 'sometimes|required_without:car_id|integer|exists:cars,id',
            'car_id' => 'sometimes|required_without:id|integer|exists:cars,id',
            'type'   => 'nullable|string|max:64',
            'market' => 'nullable|string|max:32',
        ]);

        $carId = (int) ($validated['id'] ?? $validated['car_id']);

        $car = Car::findOrFail($carId);

        if (!empty($validated['type'])) {
            $enumValue = $this->normalizeStagingCategory($validated['type']);
            if ($enumValue !== null) {
                $cat = CarsMarketsCategory::tryFrom($enumValue);
                if ($cat !== null) {
                    $car->market_category = $cat;
                    $car->save();
                }
            }
        }

        $sub = Request::create('', 'PUT', [
            'action' => true,
            'ids'    => [$carId],
        ]);
        $sub->setUserResolver(static fn () => $request->user());

        return app(AuctionController::class)->approveRejectAuctionBulk($sub);
    }

    /**
     * POST /api/admin/cars/move-to-live-market (legacy body: carIds)
     * POST /api/admin/live-market-staging/move-selected-to-live (body: car_ids)
     */
    public function moveSelectedToLive(Request $request): JsonResponse
    {
        $rawIds = $request->input('car_ids', $request->input('carIds'));

        $validator = Validator::make(
            ['ids' => $rawIds],
            [
                'ids'   => 'required|array|min:1',
                'ids.*' => 'integer|exists:cars,id',
            ],
            [],
            ['ids' => 'car_ids']
        );

        if ($validator->fails()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        /** @var list<int> $ids */
        $ids = array_map('intval', $validator->validated()['ids']);

        $sub = Request::create('', 'PUT', [
            'ids'    => $ids,
            'status' => 'live',
        ]);
        $sub->setUserResolver(static fn () => $request->user());

        return app(AuctionController::class)->moveBetweenAuctionsBulk($sub);
    }

    /**
     * @return array<string, mixed>
     */
    private function carToStagingRow(Car $car): array
    {
        $user = $car->user;
        $ownerName = $user
            ? trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''))
            : '';

        $auction = $car->auctions->first();
        $market  = null;
        if ($auction && $auction->auction_type !== null) {
            $at = $auction->auction_type instanceof AuctionType
                ? $auction->auction_type
                : AuctionType::tryFrom((string) $auction->auction_type);
            if ($at === AuctionType::LIVE) {
                $market = 'live-market';
            } elseif ($at === AuctionType::LIVE_INSTANT || $at === AuctionType::SILENT_INSTANT) {
                $market = 'instant';
            }
        }

        $stagingType = $this->stagingTypeFromCategory($car->market_category);

        return [
            'id'          => $car->id,
            'owner_name'  => $ownerName !== '' ? $ownerName : (string) ($user->email ?? ''),
            'model'       => trim("{$car->make} {$car->model} {$car->year}"),
            'status'      => $car->auction_status,
            'images'      => $car->images_list,
            'reports'     => $car->reportImages->pluck('image_path')->filter()->values()->all(),
            'market'      => $market,
            'type'        => $stagingType,
        ];
    }

    private function stagingTypeFromCategory(mixed $cat): ?string
    {
        if (!$cat instanceof CarsMarketsCategory) {
            return null;
        }

        return match ($cat) {
            CarsMarketsCategory::LUXURY_CARS    => 'luxury',
            CarsMarketsCategory::CLASSIC        => 'classic',
            CarsMarketsCategory::CARAVAN        => 'caravan',
            CarsMarketsCategory::TRUCKS         => 'truck',
            CarsMarketsCategory::COMPANIES_CARS => 'company',
            CarsMarketsCategory::GOVERNMENT     => 'government',
            CarsMarketsCategory::BUSES,
            CarsMarketsCategory::BUSES_TRUCKS   => 'truck',
            default                             => null,
        };
    }

    private function normalizeStagingCategory(string $type): ?string
    {
        $n = CarsMarketsCategory::normalize($type);
        if ($n !== null) {
            return $n;
        }

        return match (strtolower(trim($type))) {
            'truck'      => CarsMarketsCategory::TRUCKS->value,
            'company'    => CarsMarketsCategory::COMPANIES_CARS->value,
            'government' => CarsMarketsCategory::GOVERNMENT->value,
            'individual' => CarsMarketsCategory::LUXURY_CARS->value,
            default      => null,
        };
    }
}

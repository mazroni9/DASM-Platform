<?php

namespace App\Http\Controllers\Exhibitor;

use App\Http\Controllers\Controller;
use App\Http\Resources\MarketCarResource;
use App\Models\Car;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CarExplorerController extends Controller
{
    /**
     * GET /api/exhibitor/market/cars
     * GET /api/market/explorer/cars
     *
     * ✅ Listing + filters (used as "similar cars" explorer)
     * ✅ Performance: Eager loading + safe user display column for PG
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $perPage = max(1, (int) $request->query('per_page', 12));

        $query = Car::query();

        // ✅ Fix: users.name doesn't exist on PG in your schema
        $userDisplayCol = $this->resolveUserDisplayColumn();

        // ✅ Performance: Eager loading with safe columns
        $query->with([
            'dealer:id,user_id',
            'user' => function ($q) use ($userDisplayCol) {
                $q->select(['id', $userDisplayCol]);
            },
        ]);

        $this->applyExplorerFilters($query, $request, $user);

        $allowedSort = ['created_at', 'year', 'odometer', 'evaluation_price'];
        $sortBy  = in_array($request->query('sort_by'), $allowedSort, true) ? $request->query('sort_by') : 'created_at';
        $sortDir = strtolower($request->query('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDir);

        $paginator = $query->paginate($perPage);

        return MarketCarResource::collection($paginator)->additional(['success' => true]);
    }

    /**
     * GET /api/exhibitor/market/cars/{car}
     * GET /api/market/explorer/cars/{car}
     */
    public function show(Request $request, Car $car)
    {
        $userDisplayCol = $this->resolveUserDisplayColumn();

        $car->load([
            'dealer:id,user_id',
            'user' => function ($q) use ($userDisplayCol) {
                $q->select(['id', $userDisplayCol]);
            },
        ]);

        return (new MarketCarResource($car))->additional(['success' => true]);
    }

    /**
     * GET /api/market/explorer/cars/stats
     * GET /api/exhibitor/market/cars/stats
     *
     * ✅ Quick price analysis for "similar cars" based on same filters:
     * - count
     * - avg / min / max
     * - median (PostgreSQL)
     */
    public function stats(Request $request)
    {
        $user = $request->user();

        $query = Car::query();
        $this->applyExplorerFilters($query, $request, $user);

        // Basic aggregates
        $agg = (clone $query)
            ->selectRaw('COUNT(*)::int as count')
            ->selectRaw('AVG(evaluation_price) as avg_price')
            ->selectRaw('MIN(evaluation_price) as min_price')
            ->selectRaw('MAX(evaluation_price) as max_price')
            ->first();

        // Median (PostgreSQL). If DB driver isn't PG, it will fail; we keep it nullable.
        $median = null;
        try {
            $median = (clone $query)
                ->selectRaw("percentile_cont(0.5) within group (order by evaluation_price) as median_price")
                ->value('median_price');
        } catch (\Throwable $e) {
            $median = null;
        }

        return response()->json([
            'success' => true,
            'filters' => [
                'q' => (string) $request->query('q', ''),
                'make' => $request->query('make'),
                'model' => $request->query('model'),
                'year_from' => $request->query('year_from'),
                'year_to' => $request->query('year_to'),
                'odometer_from' => $request->query('odometer_from'),
                'odometer_to' => $request->query('odometer_to'),
                'price_from' => $request->query('price_from'),
                'price_to' => $request->query('price_to'),
                'condition' => $request->query('condition'),
                'auction_status' => $request->query('auction_status'),
                'include_mine' => (bool) $request->boolean('include_mine', false),
            ],
            'stats' => [
                'count' => (int) ($agg->count ?? 0),
                'avg_price' => $agg->avg_price !== null ? (float) $agg->avg_price : null,
                'min_price' => $agg->min_price !== null ? (float) $agg->min_price : null,
                'max_price' => $agg->max_price !== null ? (float) $agg->max_price : null,
                'median_price' => $median !== null ? (float) $median : null,
            ],
        ], 200);
    }

    /**
     * Apply same filters for listing + stats (so analysis matches the explorer).
     */
    private function applyExplorerFilters($query, Request $request, ?User $user): void
    {
        // افتراضياً: إخفاء سيارات المستخدم نفسه من السوق
        $includeMine = (bool) $request->boolean('include_mine', false);
        if (!$includeMine && $user) {
            $query->where(function ($q) use ($user) {
                $q->where('user_id', '!=', $user->id)
                  ->orWhereNull('user_id');
            });
        }

        // بحث عام
        if ($q = trim((string) $request->query('q', ''))) {
            $like = "%{$q}%";
            $query->where(function ($qq) use ($like) {
                $qq->where('make', 'like', $like)
                   ->orWhere('model', 'like', $like)
                   ->orWhere('color', 'like', $like)
                   ->orWhere('description', 'like', $like);
            });
        }

        // فلترة محددة
        if ($request->filled('make'))   $query->where('make', $request->query('make'));
        if ($request->filled('model'))  $query->where('model', $request->query('model'));

        if ($request->filled('year_from')) $query->where('year', '>=', (int) $request->query('year_from'));
        if ($request->filled('year_to'))   $query->where('year', '<=', (int) $request->query('year_to'));

        if ($request->filled('condition'))      $query->where('condition', $request->query('condition'));
        if ($request->filled('auction_status')) $query->where('auction_status', $request->query('auction_status'));

        if ($request->filled('odometer_from')) $query->where('odometer', '>=', (int) $request->query('odometer_from'));
        if ($request->filled('odometer_to'))   $query->where('odometer', '<=', (int) $request->query('odometer_to'));

        // نطاق السعر المرجعي
        if ($request->filled('price_from')) $query->where('evaluation_price', '>=', (float) $request->query('price_from'));
        if ($request->filled('price_to'))   $query->where('evaluation_price', '<=', (float) $request->query('price_to'));
    }

    /**
     * Resolve best display column for users table to avoid PG error on missing `name`.
     * Priority:
     * 1) full_name
     * 2) username
     * 3) email
     * 4) phone
     * 5) id (fallback)
     */
    private function resolveUserDisplayColumn(): string
    {
        $table = (new User())->getTable();

        if (Schema::hasColumn($table, 'full_name')) return 'full_name';
        if (Schema::hasColumn($table, 'username'))  return 'username';
        if (Schema::hasColumn($table, 'email'))     return 'email';
        if (Schema::hasColumn($table, 'phone'))     return 'phone';

        return 'id';
    }
}

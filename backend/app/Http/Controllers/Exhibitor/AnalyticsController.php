<?php

namespace App\Http\Controllers\Exhibitor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class AnalyticsController extends Controller
{
    /**
     * Cache للأعمدة الموجودة
     */
    private static array $columnCache = [];

    /**
     * KPIs سريعة + أحدث سيارات
     * GET /api/exhibitor/analytics/overview
     */
    public function overview(Request $request)
    {
        $userId = $request->user()->id;

        // IDs سياراتي
        $myCarIds = DB::table('cars')
            ->where(function ($q) use ($userId) {
                $q->where('user_id', $userId)
                    ->orWhere('dealer_id', $userId);
            })
            ->pluck('id');

        $totalCars = $myCarIds->count();

        $activeStatuses   = ['active', 'running', 'live', 'open'];
        $finishedStatuses = ['finished', 'closed', 'sold', 'ended', 'completed'];

        $activeAuctions = 0;
        $finishedAuctions = 0;
        $avgFinalPrice = 0.0;
        $bidsCount = 0;

        try {
            $activeAuctions = DB::table('auctions')
                ->whereIn('car_id', $myCarIds)
                ->whereIn('status', $activeStatuses)
                ->count();

            $finishedAuctions = DB::table('auctions')
                ->whereIn('car_id', $myCarIds)
                ->whereIn('status', $finishedStatuses)
                ->count();

            $priceCol = $this->pickFirstExistingColumn('auctions', [
                'final_price', 'sold_price', 'closing_price', 'winning_price',
                'highest_bid', 'current_price', 'end_price', 'price',
                'min_price', 'open_price', 'starting_price',
            ]);

            if ($priceCol) {
                $avgFinalPrice = (float) (DB::table('auctions')
                        ->whereIn('car_id', $myCarIds)
                        ->whereIn('status', $finishedStatuses)
                        ->avg($priceCol) ?? 0.0);
            }

            $myAuctionIds = DB::table('auctions')
                ->whereIn('car_id', $myCarIds)
                ->pluck('id');

            $bidsCount = DB::table('bids')
                ->whereIn('auction_id', $myAuctionIds)
                ->count();
        } catch (\Exception $e) {
            // تجاهل الأخطاء
        }

        // ✅ Bug Fix: اسم الجدول الصحيح venue_commission_operations
        $commissionSum = 0.0;
        try {
            $venueOwnerId = DB::table('venue_owners')
                ->where('user_id', $userId)
                ->value('id');

            if ($venueOwnerId) {
                $commissionSum = (float) (DB::table('venue_commission_operations')
                        ->where('venue_owner_id', $venueOwnerId)
                        ->sum('amount') ?? 0.0);
            }
        } catch (\Exception $e) {
            // الجدول غير موجود
        }

        // ✅ Bug Fix: اسم الجدول الصحيح venue_owner_reviews
        $ratingsAvg = null;
        $ratingsCount = 0;
        try {
            $venueOwnerId = $venueOwnerId ?? DB::table('venue_owners')
                ->where('user_id', $userId)
                ->value('id');

            if ($venueOwnerId) {
                $ratingsAvg = (float) DB::table('venue_owner_reviews')
                    ->where('venue_owner_id', $venueOwnerId)
                    ->where('is_approved', true)
                    ->avg('rating');

                $ratingsCount = DB::table('venue_owner_reviews')
                    ->where('venue_owner_id', $venueOwnerId)
                    ->where('is_approved', true)
                    ->count();
            }
        } catch (\Exception $e) {
            // الجدول غير موجود
        }

        // الشحنات
        $shipmentsCount = 0;
        try {
            $venueOwnerId = $venueOwnerId ?? DB::table('venue_owners')
                ->where('user_id', $userId)
                ->value('id');

            if ($venueOwnerId) {
                $shipmentsCount = DB::table('shipments')
                    ->where('venue_owner_id', $venueOwnerId)
                    ->count();
            }
        } catch (\Exception $e) {
            // الجدول غير موجود
        }

        // أحدث 5 سيارات
        $recentCars = DB::table('cars')
            ->select('id', 'make', 'model', 'year', 'evaluation_price', 'auction_status', 'created_at')
            ->whereIn('id', $myCarIds)
            ->orderByDesc('id')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'kpis' => [
                    'total_cars'        => $totalCars,
                    'active_auctions'   => $activeAuctions,
                    'finished_auctions' => $finishedAuctions,
                    'avg_final_price'   => round($avgFinalPrice, 2),
                    'bids_count'        => $bidsCount,
                    'commission_sum'    => round($commissionSum, 2),
                    'ratings_avg'       => $ratingsAvg !== null ? round($ratingsAvg, 2) : null,
                    'ratings_count'     => $ratingsCount,
                    'shipments_count'   => $shipmentsCount,
                ],
                'lists' => [
                    'recent_cars' => $recentCars,
                ],
            ],
        ]);
    }

    /**
     * سلاسل زمنية
     * GET /api/exhibitor/analytics/timeseries
     */
    public function timeseries(Request $request)
    {
        $userId = $request->user()->id;
        $kind = $request->query('kind', 'cars');
        $days = max(1, min(365, (int) $request->query('days', 30)));
        $from = Carbon::now()->subDays($days)->startOfDay();

        $myCarIds = DB::table('cars')
            ->where(function ($q) use ($userId) {
                $q->where('user_id', $userId)
                    ->orWhere('dealer_id', $userId);
            })
            ->pluck('id');

        $rows = collect();

        try {
            switch ($kind) {
                case 'auctions':
                    $rows = DB::table('auctions')
                        ->whereIn('car_id', $myCarIds)
                        ->where('created_at', '>=', $from)
                        ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
                        ->groupBy('date')
                        ->orderBy('date')
                        ->get();
                    break;

                case 'bids':
                    $myAuctionIds = DB::table('auctions')
                        ->whereIn('car_id', $myCarIds)
                        ->pluck('id');

                    $rows = DB::table('bids')
                        ->whereIn('auction_id', $myAuctionIds)
                        ->where('created_at', '>=', $from)
                        ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
                        ->groupBy('date')
                        ->orderBy('date')
                        ->get();
                    break;

                default: // cars
                    $rows = DB::table('cars')
                        ->whereIn('id', $myCarIds)
                        ->where('created_at', '>=', $from)
                        ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
                        ->groupBy('date')
                        ->orderBy('date')
                        ->get();
            }
        } catch (\Exception $e) {
            // تجاهل الأخطاء
        }

        return response()->json([
            'success' => true,
            'data' => [
                'kind' => $kind,
                'days' => $days,
                'series' => $rows,
            ],
        ]);
    }

    /**
     * Top Models
     * GET /api/exhibitor/analytics/top-models
     *
     * Query params:
     * - days (1..365)   default 30
     * - limit (1..50)  default 10
     * - sort_by: bids|auctions|avg_price  default bids
     * - sort_dir: asc|desc default desc
     */
    public function topModels(Request $request)
    {
        $userId = $request->user()->id;

        $days  = max(1, min(365, (int) $request->query('days', 30)));
        $limit = max(1, min(50, (int) $request->query('limit', 10)));
        $from  = Carbon::now()->subDays($days)->startOfDay();

        $sortBy  = strtolower((string) $request->query('sort_by', 'bids'));
        $sortDir = strtolower((string) $request->query('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        $allowedSortBy = ['bids', 'auctions', 'avg_price'];
        if (!in_array($sortBy, $allowedSortBy, true)) {
            $sortBy = 'bids';
        }

        // IDs سياراتي
        $myCarIds = DB::table('cars')
            ->where(function ($q) use ($userId) {
                $q->where('user_id', $userId)
                    ->orWhere('dealer_id', $userId);
            })
            ->pluck('id');

        if ($myCarIds->isEmpty()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'days' => $days,
                    'limit' => $limit,
                    'items' => [],
                ],
            ]);
        }

        $activeStatuses   = ['active', 'running', 'live', 'open'];
        $finishedStatuses = ['finished', 'closed', 'sold', 'ended', 'completed'];

        $priceCol = $this->pickFirstExistingColumn('auctions', [
            'final_price', 'sold_price', 'closing_price', 'winning_price',
            'highest_bid', 'current_price', 'end_price', 'price',
            'min_price', 'open_price', 'starting_price',
        ]);

        try {
            $q = DB::table('cars as c')
                ->join('auctions as a', 'a.car_id', '=', 'c.id')
                ->leftJoin('bids as b', 'b.auction_id', '=', 'a.id')
                ->whereIn('c.id', $myCarIds)
                ->where('a.created_at', '>=', $from)
                ->groupBy('c.make', 'c.model')
                ->selectRaw('
                    c.make  as make,
                    c.model as model,
                    COUNT(DISTINCT a.id) as auctions_count,
                    COUNT(b.id)          as bids_count
                ');

            // متوسط سعر الإغلاق/البيع للمزادات المنتهية فقط (لو عمود السعر موجود)
            if ($priceCol) {
                // نحقن statuses بشكل آمن نسبيًا (قيم ثابتة في الكود)
                $finishedList = "'" . implode("','", array_map('addslashes', $finishedStatuses)) . "'";
                $q->selectRaw("
                    AVG(
                        CASE
                            WHEN a.status IN ({$finishedList}) THEN a.{$priceCol}
                            ELSE NULL
                        END
                    ) as avg_final_price
                ");
            } else {
                $q->selectRaw("NULL as avg_final_price");
            }

            // Sorting
            if ($sortBy === 'auctions') {
                $q->orderBy('auctions_count', $sortDir);
            } elseif ($sortBy === 'avg_price') {
                $q->orderBy('avg_final_price', $sortDir);
            } else { // bids
                $q->orderBy('bids_count', $sortDir);
            }

            $rows = $q->limit($limit)->get();

            $items = $rows->map(function ($r) {
                return [
                    'make'            => $r->make ?? null,
                    'model'           => $r->model ?? null,
                    'auctions_count'  => (int) ($r->auctions_count ?? 0),
                    'bids_count'      => (int) ($r->bids_count ?? 0),
                    'avg_final_price' => is_null($r->avg_final_price) ? null : round((float) $r->avg_final_price, 2),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'days'  => $days,
                    'limit' => $limit,
                    'sort_by' => $sortBy,
                    'sort_dir' => $sortDir,
                    'items' => $items,
                ],
            ]);
        } catch (\Exception $e) {
            // لو فيه اختلاف في schema/جدول… إلخ
            return response()->json([
                'success' => true,
                'data' => [
                    'days' => $days,
                    'limit' => $limit,
                    'items' => [],
                ],
            ]);
        }
    }

    /**
     * Bids Heatmap (Day x Hour)
     * GET /api/exhibitor/analytics/bids-heatmap
     *
     * Query params:
     * - days (1..365) default 30
     *
     * Output:
     * - matrix: 7x24 (Mon..Sun) x (0..23)
     * - cells: list of non-zero cells
     */
    public function bidsHeatmap(Request $request)
    {
        $userId = $request->user()->id;

        $days = max(1, min(365, (int) $request->query('days', 30)));
        $from = Carbon::now()->subDays($days)->startOfDay();

        $myCarIds = DB::table('cars')
            ->where(function ($q) use ($userId) {
                $q->where('user_id', $userId)
                    ->orWhere('dealer_id', $userId);
            })
            ->pluck('id');

        if ($myCarIds->isEmpty()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'days' => $days,
                    'labels' => [
                        'days'  => ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
                        'hours' => range(0, 23),
                    ],
                    'matrix' => array_fill(0, 7, array_fill(0, 24, 0)),
                    'cells'  => [],
                    'total_bids' => 0,
                    'max_cell' => 0,
                ],
            ]);
        }

        $myAuctionIds = DB::table('auctions')
            ->whereIn('car_id', $myCarIds)
            ->pluck('id');

        if ($myAuctionIds->isEmpty()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'days' => $days,
                    'labels' => [
                        'days'  => ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
                        'hours' => range(0, 23),
                    ],
                    'matrix' => array_fill(0, 7, array_fill(0, 24, 0)),
                    'cells'  => [],
                    'total_bids' => 0,
                    'max_cell' => 0,
                ],
            ]);
        }

        // 7x24 matrix: Monday(0) .. Sunday(6)
        $matrix = array_fill(0, 7, array_fill(0, 24, 0));

        $driver = DB::getDriverName();

        // SQL expressions by driver
        if ($driver === 'pgsql') {
            // EXTRACT(DOW): 0=Sun..6=Sat, EXTRACT(HOUR): 0..23
            $dayExpr  = 'EXTRACT(DOW FROM created_at)';
            $hourExpr = 'EXTRACT(HOUR FROM created_at)';
            $normalizeDay = function (int $dow): int {
                // pg: 0=Sun -> 6, 1=Mon ->0 ... 6=Sat->5
                return (int) (($dow + 6) % 7);
            };
        } else {
            // MySQL/MariaDB: DAYOFWEEK: 1=Sun..7=Sat, HOUR: 0..23
            $dayExpr  = 'DAYOFWEEK(created_at)';
            $hourExpr = 'HOUR(created_at)';
            $normalizeDay = function (int $dow): int {
                // mysql: 1=Sun ->6, 2=Mon->0 ... 7=Sat->5
                return (int) (($dow + 5) % 7);
            };
        }

        try {
            $rows = DB::table('bids')
                ->whereIn('auction_id', $myAuctionIds)
                ->where('created_at', '>=', $from)
                ->selectRaw("{$dayExpr} as day, {$hourExpr} as hour, COUNT(*) as count")
                ->groupBy('day', 'hour')
                ->get();

            $total = 0;
            $maxCell = 0;
            $cells = [];

            foreach ($rows as $r) {
                $rawDay  = (int) round((float) ($r->day ?? 0));
                $rawHour = (int) round((float) ($r->hour ?? 0));
                $count   = (int) ($r->count ?? 0);

                if ($rawHour < 0 || $rawHour > 23 || $count <= 0) {
                    continue;
                }

                $day = $normalizeDay($rawDay);
                if ($day < 0 || $day > 6) {
                    continue;
                }

                $matrix[$day][$rawHour] += $count;

                $total += $count;
                if ($matrix[$day][$rawHour] > $maxCell) {
                    $maxCell = $matrix[$day][$rawHour];
                }
            }

            // build non-zero cells list (for lighter payload if needed)
            for ($d = 0; $d < 7; $d++) {
                for ($h = 0; $h < 24; $h++) {
                    if ($matrix[$d][$h] > 0) {
                        $cells[] = ['day' => $d, 'hour' => $h, 'count' => $matrix[$d][$h]];
                    }
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'days' => $days,
                    'labels' => [
                        'days'  => ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
                        'hours' => range(0, 23),
                    ],
                    'matrix' => $matrix,
                    'cells'  => $cells,
                    'total_bids' => $total,
                    'max_cell' => $maxCell,
                ],
            ]);
        } catch (\Exception $e) {
            // أي مشكلة schema/driver… إلخ
            return response()->json([
                'success' => true,
                'data' => [
                    'days' => $days,
                    'labels' => [
                        'days'  => ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
                        'hours' => range(0, 23),
                    ],
                    'matrix' => array_fill(0, 7, array_fill(0, 24, 0)),
                    'cells'  => [],
                    'total_bids' => 0,
                    'max_cell' => 0,
                ],
            ]);
        }
    }

    /**
     * Performance: Cache للأعمدة
     */
    private function pickFirstExistingColumn(string $table, array $candidates): ?string
    {
        $cacheKey = "columns_{$table}";

        if (!isset(self::$columnCache[$cacheKey])) {
            try {
                self::$columnCache[$cacheKey] = Cache::remember(
                    "db_columns_{$table}",
                    3600,
                    fn () => Schema::getColumnListing($table)
                );
            } catch (\Exception $e) {
                self::$columnCache[$cacheKey] = [];
            }
        }

        $columns = self::$columnCache[$cacheKey];

        foreach ($candidates as $col) {
            if (in_array($col, $columns, true)) {
                return $col;
            }
        }

        return null;
    }
}

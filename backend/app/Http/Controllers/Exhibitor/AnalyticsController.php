<?php

namespace App\Http\Controllers\Exhibitor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AnalyticsController extends Controller
{
    /**
     * KPIs سريعة + أحدث سيارات
     * GET /api/exhibitor/analytics/overview
     */
    public function overview(Request $request)
    {
        $userId = $request->user()->id;

        // IDs سياراتي (ندعم user_id أو dealer_id)
        $myCarIds = DB::table('cars')
            ->where(function ($q) use ($userId) {
                $q->where('user_id', $userId)
                  ->orWhere('dealer_id', $userId);
            })
            ->pluck('id');

        $totalCars = $myCarIds->count();

        $activeStatuses   = ['active','running','live','open'];
        $finishedStatuses = ['finished','closed','sold','ended','completed'];

        $activeAuctions = 0;
        $finishedAuctions = 0;
        $avgFinalPrice = 0.0;
        $bidsCount = 0;

        if (Schema::hasTable('auctions')) {
            // العدادات الأساسية
            $activeAuctions = DB::table('auctions')
                ->whereIn('car_id', $myCarIds)
                ->whereIn('status', $activeStatuses)
                ->count();

            $finishedAuctions = DB::table('auctions')
                ->whereIn('car_id', $myCarIds)
                ->whereIn('status', $finishedStatuses)
                ->count();

            // ✅ اختيار عمود السعر الختامي/الفعلي المتاح ديناميكيًا
            $priceCol = $this->pickFirstExistingColumn('auctions', [
                'final_price',
                'sold_price',
                'closing_price',
                'winning_price',
                'highest_bid',
                'current_price',
                'end_price',
                'price',
                'min_price',
                'open_price',
                'starting_price',
            ]);

            if ($priceCol) {
                $avgFinalPrice = (float) DB::table('auctions')
                    ->whereIn('car_id', $myCarIds)
                    ->whereIn('status', $finishedStatuses)
                    ->avg($priceCol) ?? 0.0;
            }

            // عدد المزايدات على مزادات سياراتي
            if (Schema::hasTable('bids')) {
                $myAuctionIds = DB::table('auctions')
                    ->whereIn('car_id', $myCarIds)
                    ->pluck('id');

                $bidsCount = DB::table('bids')
                    ->whereIn('auction_id', $myAuctionIds)
                    ->count();
            }
        }

        // إجمالي العمليات/العمولة (نختار أول عمود مناسب)
        $commissionSum = 0.0;
        if (Schema::hasTable('exhibitor_commission_operations')) {
            $commissionCol = $this->pickFirstExistingColumn('exhibitor_commission_operations', [
                'value', 'amount', 'total', 'commission_value', 'commission_amount'
            ]);

            if ($commissionCol) {
                $commissionSum = (float) DB::table('exhibitor_commission_operations')
                    ->where('user_id', $userId)
                    ->sum($commissionCol);
            }
        }

        // التقييمات (ملخّص)
        $ratingsAvg = null;
        $ratingsCount = 0;
        if (Schema::hasTable('venue_owner_ratings')) {
            // ندعم venue_owner_id أو user_id
            $ownerCol = $this->pickFirstExistingColumn('venue_owner_ratings', [
                'venue_owner_id', 'user_id', 'owner_id'
            ]) ?? 'user_id';

            $ratingCol = $this->pickFirstExistingColumn('venue_owner_ratings', [
                'rating', 'score', 'stars'
            ]) ?? 'rating';

            $ratingsAvg = (float) DB::table('venue_owner_ratings')
                ->where($ownerCol, $userId)
                ->avg($ratingCol);

            $ratingsCount = DB::table('venue_owner_ratings')
                ->where($ownerCol, $userId)
                ->count();
        }

        // الشحنات (اختياري)
        $shipmentsCount = 0;
        if (Schema::hasTable('shipments')) {
            $shipUserCol = $this->pickFirstExistingColumn('shipments', [
                'user_id', 'owner_id', 'venue_owner_id'
            ]) ?? 'user_id';

            $shipmentsCount = DB::table('shipments')
                ->where($shipUserCol, $userId)
                ->count();
        }

        // أحدث 5 سيارات
        $recentCars = DB::table('cars')
            ->select('id','make','model','year','evaluation_price','auction_status','created_at')
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
     * سلاسل زمنية: cars|auctions|bids خلال آخر N يوم (افتراضي 30)
     * GET /api/exhibitor/analytics/timeseries?kind=cars,auctions,bids&days=30
     */
    public function timeseries(Request $request)
    {
        $userId = $request->user()->id;
        $kind = $request->query('kind', 'cars'); // cars|auctions|bids
        $days = max(1, min(365, (int) $request->query('days', 30)));
        $from = Carbon::now()->subDays($days)->startOfDay();

        $myCarIds = DB::table('cars')
            ->where(function ($q) use ($userId) {
                $q->where('user_id', $userId)
                  ->orWhere('dealer_id', $userId);
            })
            ->pluck('id');

        $rows = collect();
        switch ($kind) {
            case 'cars':
                $rows = DB::table('cars')
                    ->selectRaw("DATE(created_at) as d, COUNT(*) as c")
                    ->whereIn('id', $myCarIds)
                    ->where('created_at', '>=', $from)
                    ->groupBy('d')
                    ->orderBy('d')
                    ->get();
                break;

            case 'auctions':
                if (!Schema::hasTable('auctions')) {
                    return $this->emptySeries();
                }
                $rows = DB::table('auctions')
                    ->selectRaw("DATE(created_at) as d, COUNT(*) as c")
                    ->whereIn('car_id', $myCarIds)
                    ->where('created_at', '>=', $from)
                    ->groupBy('d')
                    ->orderBy('d')
                    ->get();
                break;

            case 'bids':
                if (!Schema::hasTable('auctions') || !Schema::hasTable('bids')) {
                    return $this->emptySeries();
                }
                $auctionIds = DB::table('auctions')
                    ->whereIn('car_id', $myCarIds)
                    ->pluck('id');

                $rows = DB::table('bids')
                    ->selectRaw("DATE(created_at) as d, COUNT(*) as c")
                    ->whereIn('auction_id', $auctionIds)
                    ->where('created_at', '>=', $from)
                    ->groupBy('d')
                    ->orderBy('d')
                    ->get();
                break;

            default:
                return $this->emptySeries();
        }

        // نبني سلسلة مرتبة بالأيام حتى لو مفيش بيانات
        $series = [];
        $cursor = $from->copy();
        $map = $rows->keyBy('d');
        while ($cursor->lte(Carbon::now())) {
            $key = $cursor->toDateString();
            $series[] = [
                'date'  => $key,
                'value' => (int) ($map->get($key)->c ?? 0),
            ];
            $cursor->addDay();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'kind'   => $kind,
                'series' => $series,
            ],
        ]);
    }

    /**
     * أكثر الموديلات تكرارًا بسياراتي
     * GET /api/exhibitor/analytics/top-models?limit=10
     */
    public function topModels(Request $request)
    {
        $userId = $request->user()->id;
        $limit  = max(1, min(50, (int) $request->query('limit', 10)));

        $rows = DB::table('cars')
            ->select('make','model', DB::raw('COUNT(*) as cnt'))
            ->where(function ($q) use ($userId) {
                $q->where('user_id', $userId)
                  ->orWhere('dealer_id', $userId);
            })
            ->groupBy('make','model')
            ->orderByDesc('cnt')
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rows,
        ]);
    }

    /**
     * Heatmap للمزايدات حسب اليوم/الساعة على مزادات سياراتي
     * GET /api/exhibitor/analytics/bids-heatmap
     */
    public function bidsHeatmap(Request $request)
    {
        if (!Schema::hasTable('bids') || !Schema::hasTable('auctions')) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $userId = $request->user()->id;

        $auctionIds = DB::table('auctions')
            ->whereIn('car_id', function ($sub) use ($userId) {
                $sub->from('cars')->select('id')
                    ->where('user_id', $userId)
                    ->orWhere('dealer_id', $userId);
            })
            ->pluck('id');

        $connection = DB::connection()->getDriverName();

        if ($connection === 'pgsql') {
            $rows = DB::table('bids')
                ->selectRaw('CAST(EXTRACT(DOW FROM created_at) AS INT) as dow, CAST(EXTRACT(HOUR FROM created_at) AS INT) as hr, COUNT(*) as cnt')
                ->whereIn('auction_id', $auctionIds)
                ->groupBy('dow','hr')
                ->orderBy('dow')->orderBy('hr')
                ->get();
        } else {
            // MySQL/MariaDB
            $rows = DB::table('bids')
                ->selectRaw('(DAYOFWEEK(created_at) + 5) % 7 as dow, HOUR(created_at) as hr, COUNT(*) as cnt')
                ->whereIn('auction_id', $auctionIds)
                ->groupBy('dow','hr')
                ->orderBy('dow')->orderBy('hr')
                ->get();
        }

        return response()->json([
            'success' => true,
            'data' => $rows, // [{dow:0..6, hr:0..23, cnt:int}]
        ]);
    }

    private function emptySeries()
    {
        return response()->json(['success' => true, 'data' => ['kind' => null, 'series' => []]]);
    }

    /**
     * يُعيد أوّل عمود موجود فعليًا من قائمة أعمدة محتملة.
     */
    private function pickFirstExistingColumn(string $table, array $candidates): ?string
    {
        if (!Schema::hasTable($table)) {
            return null;
        }
        foreach ($candidates as $col) {
            if (Schema::hasColumn($table, $col)) {
                return $col;
            }
        }
        return null;
    }
}

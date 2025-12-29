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

        $activeStatuses   = ['active','running','live','open'];
        $finishedStatuses = ['finished','closed','sold','ended','completed'];

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
                $avgFinalPrice = (float) DB::table('auctions')
                    ->whereIn('car_id', $myCarIds)
                    ->whereIn('status', $finishedStatuses)
                    ->avg($priceCol) ?? 0.0;
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
                $commissionSum = (float) DB::table('venue_commission_operations')
                    ->where('venue_owner_id', $venueOwnerId)
                    ->sum('amount') ?? 0.0;
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
                    fn() => Schema::getColumnListing($table)
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

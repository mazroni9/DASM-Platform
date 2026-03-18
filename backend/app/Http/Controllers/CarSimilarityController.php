<?php

namespace App\Http\Controllers;

use App\Http\Requests\SuggestSimilarCarsRequest;
use App\Models\Car;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CarSimilarityController extends Controller
{
    /**
     * اقتراح سيارات مشابهة (أمان + أداء + بدون كسر الفرونت)
     */
    public function suggest(SuggestSimilarCarsRequest $request)
    {
        $data = $request->validated();

        $make      = mb_strtolower(trim((string) $data['make']));
        $model     = mb_strtolower(trim((string) $data['model']));
        $year      = (int) $data['year'];
        $price     = (float) $data['price'];
        $odo       = isset($data['odometer']) ? (int) $data['odometer'] : null;
        $limit     = (int) ($data['limit'] ?? 3);
        $excludeId = $data['exclude_id'] ?? null;

        // ✅ هل pg_trgm متاح؟ (نحسبها مرة كل 10 دقائق)
        $hasTrgm = $this->hasPgTrgm();

        // ✅ كاش خفيف 30 ثانية (نفس الـ response format)
        $cacheKey = "similar:v4:" . md5(json_encode([
            $make,
            $model,
            $year,
            (int) round($price, 0),
            $odo,
            $limit,
            $excludeId,
            $hasTrgm,
            DB::getDriverName(),
        ]));

        return Cache::remember($cacheKey, 30, function () use ($make, $model, $year, $price, $odo, $limit, $excludeId, $hasTrgm) {

            $results = collect();

            // مراحل تدريجية
            $phases = [
                ['brand_only' => false, 'year_delta' => 0, 'price_band' => 0.15, 'use_odo' => true],
                ['brand_only' => false, 'year_delta' => 1, 'price_band' => 0.20, 'use_odo' => true],
                ['brand_only' => false, 'year_delta' => 2, 'price_band' => 0.30, 'use_odo' => false],

                ['brand_only' => true,  'year_delta' => 2, 'price_band' => 0.35, 'use_odo' => false, 'fuzzy_model' => true],
                ['brand_only' => true,  'year_delta' => 4, 'price_band' => 0.50, 'use_odo' => false, 'fuzzy_model' => true],

                ['brand_only' => true,  'any_year'   => true, 'price_band' => 0.60, 'use_odo' => false, 'fuzzy_model' => true],
            ];

            foreach ($phases as $phase) {
                if ($results->count() >= $limit) break;

                $q = Car::query()
                    ->select([
                        'id',
                        'make',
                        'model',
                        'year',
                        'odometer',
                        'evaluation_price',
                        'images',
                        'color',
                        'engine',
                        'transmission',
                    ])
                    ->whereNotNull('evaluation_price')
                    ->whereRaw('lower(make) = ?', [$make])
                    ->when($excludeId, fn ($qq) => $qq->where('id', '<>', (int) $excludeId));

                // موديل
                if (empty($phase['brand_only'])) {
                    $q->where(function ($qq) use ($model) {
                        $qq->whereRaw('lower(model) = ?', [$model])
                           ->orWhereRaw('lower(model) LIKE ?', ['%' . $model . '%']);
                    });

                    // model_sim بسيط يفيد ranking
                    $q->selectRaw('(CASE WHEN lower(model) = ? THEN 1.0 WHEN lower(model) LIKE ? THEN 0.5 ELSE 0 END) AS model_sim', [
                        $model,
                        '%' . $model . '%'
                    ]);
                } else {
                    if (!empty($phase['fuzzy_model'])) {
                        if ($hasTrgm) {
                            $q->selectRaw('similarity(lower(model), ?) AS model_sim', [$model]);
                            $q->orderByRaw('similarity(lower(model), ?) DESC', [$model]);
                        } else {
                            $q->selectRaw('(CASE WHEN lower(model) = ? THEN 1.0 WHEN lower(model) LIKE ? THEN 0.5 ELSE 0 END) AS model_sim', [
                                $model,
                                '%' . $model . '%'
                            ]);
                            $q->orderByRaw('(CASE WHEN lower(model) = ? THEN 1.0 WHEN lower(model) LIKE ? THEN 0.5 ELSE 0 END) DESC', [
                                $model,
                                '%' . $model . '%'
                            ]);
                        }
                    } else {
                        $q->selectRaw('0.0 AS model_sim');
                    }
                }

                // سنة
                if (empty($phase['any_year'])) {
                    $yd = (int) ($phase['year_delta'] ?? 0);
                    $q->whereBetween('year', [$year - $yd, $year + $yd]);
                }

                // سعر
                $band = (float) $phase['price_band'];
                $minP = max(0, $price * (1 - $band));
                $maxP = $price * (1 + $band);
                $q->whereBetween('evaluation_price', [$minP, $maxP]);

                // فرق السعر
                $q->selectRaw('ABS(evaluation_price - ?) AS price_diff', [$price]);

                // ممشى (اختياري)
                if (!empty($phase['use_odo']) && $odo !== null) {
                    $q->selectRaw('CASE WHEN odometer IS NULL THEN 0 ELSE ABS(odometer - ?)/10000.0 END AS odo_penalty', [$odo]);
                    $q->orderByRaw(
                        '(ABS(evaluation_price - ?)) + 0.05 * (CASE WHEN odometer IS NULL THEN 0 ELSE ABS(odometer - ?)/10000.0 END) ASC',
                        [$price, $odo]
                    );
                } else {
                    $q->selectRaw('0.0 AS odo_penalty');
                    $q->orderBy('price_diff', 'asc');
                }

                // نسحب شوية زيادة وبعدين نفلتر
                $phaseRows = $q->limit(max($limit * 10, 60))->get();
                if ($phaseRows->isNotEmpty()) {
                    $results = $results->concat($phaseRows)->unique('id');
                }

                if ($results->count() >= $limit) break;
            }

            // Fallback A: أي حاجة ضمن ±40%
            if ($results->count() < $limit) {
                $band = 0.40;
                $minP = max(0, $price * (1 - $band));
                $maxP = $price * (1 + $band);

                $extra = Car::query()
                    ->select([
                        'id','make','model','year','odometer','evaluation_price','images','color','engine','transmission',
                    ])
                    ->whereNotNull('evaluation_price')
                    ->whereBetween('evaluation_price', [$minP, $maxP])
                    ->when($excludeId, fn ($qq) => $qq->where('id', '<>', (int) $excludeId))
                    ->selectRaw('ABS(evaluation_price - ?) AS price_diff', [$price])
                    ->selectRaw('0.0 AS odo_penalty')
                    ->selectRaw('0.0 AS model_sim')
                    ->orderBy('price_diff', 'asc')
                    ->limit(max($limit * 10, 60))
                    ->get();

                $results = $results->concat($extra)->unique('id');
            }

            // Fallback B: أقرب أسعار من كل الجدول
            if ($results->count() < $limit) {
                $extra2 = Car::query()
                    ->select([
                        'id','make','model','year','odometer','evaluation_price','images','color','engine','transmission',
                    ])
                    ->whereNotNull('evaluation_price')
                    ->when($excludeId, fn ($qq) => $qq->where('id', '<>', (int) $excludeId))
                    ->selectRaw('ABS(evaluation_price - ?) AS price_diff', [$price])
                    ->selectRaw('0.0 AS odo_penalty')
                    ->selectRaw('0.0 AS model_sim')
                    ->orderBy('price_diff', 'asc')
                    ->limit(max($limit * 10, 80))
                    ->get();

                $results = $results->concat($extra2)->unique('id');
            }

            // Ranking نهائي
            $wPrice = 1.0;
            $wYear  = 0.15;
            $wOdo   = 0.05;
            $wModel = 0.20;

            $final = $results->map(function ($c) use ($price, $year, $wPrice, $wYear, $wOdo, $wModel) {
                    $evalPrice     = (float) $c->evaluation_price;
                    $priceDiff     = abs($evalPrice - $price);
                    $priceDiffNorm = $price > 0 ? ($priceDiff / $price) : $priceDiff;

                    $yearDiff   = abs(((int) $c->year) - $year);
                    $odoPenalty = isset($c->odo_penalty) ? (float) $c->odo_penalty : 0.0;
                    $modelSim   = isset($c->model_sim) ? (float) $c->model_sim : 0.0;

                    $rank = ($wPrice * $priceDiffNorm)
                          + ($wYear * $yearDiff)
                          + ($wOdo  * $odoPenalty)
                          - ($wModel * $modelSim);

                    $c->rank_score = $rank;
                    $c->price_diff_abs = $priceDiff;
                    return $c;
                })
                ->sortBy('rank_score')
                ->take($limit)
                ->values();

            // Stats (كاش 5 دقائق)
            $statsKey = "similar_stats:v2:" . md5(json_encode([$make, $model, $year, (int) round($price, 0), DB::getDriverName()]));
            $stats = Cache::remember($statsKey, 300, fn () => $this->computeFlexibleStats($make, $model, $year, $price));

            return response()->json([
                'status' => 'ok',
                'query' => [
                    'make' => $make,
                    'model' => $model,
                    'year' => $year,
                    'price' => $price,
                    'odometer' => $odo,
                ],
                'suggestions' => $final->map(function ($c) use ($price) {
                    $evalPrice = (float) $c->evaluation_price;

                    return [
                        'id' => $c->id,
                        'label' => "{$c->make} {$c->model} {$c->year}",
                        'year' => (int) $c->year,
                        'odometer' => $c->odometer,
                        'evaluation_price' => $evalPrice,
                        'price_diff' => round(($evalPrice - $price), 2),
                        'images' => $c->images,
                        'color' => $c->color,
                        'engine' => $c->engine,
                        'transmission' => $c->transmission,
                    ];
                }),
                'stats' => $stats,
            ]);
        });
    }

    private function hasPgTrgm(): bool
    {
        return Cache::remember('pg_trgm_installed', 600, function () {
            try {
                if (DB::getDriverName() !== 'pgsql') return false;

                $row = DB::selectOne("SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_trgm') AS installed");
                return (bool) ($row->installed ?? false);
            } catch (\Throwable $e) {
                return false;
            }
        });
    }

    private function computeFlexibleStats(string $make, string $model, int $year, float $price): array
    {
        $driver = DB::getDriverName();

        // ✅ Postgres: percentiles
        if ($driver === 'pgsql') {
            $tryPg = function (string $where, array $bindings = []) {
                try {
                    $row = Car::query()
                        ->whereNotNull('evaluation_price')
                        ->whereRaw($where, $bindings)
                        ->selectRaw("
                            COUNT(*) AS n,
                            MIN(evaluation_price) AS min_price,
                            MAX(evaluation_price) AS max_price,
                            PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY evaluation_price) AS p25,
                            PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY evaluation_price) AS median,
                            PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY evaluation_price) AS p75
                        ")
                        ->first();

                    $count = (int) ($row->n ?? 0);
                    if ($count <= 0) return null;

                    return [
                        'count'  => $count,
                        'min'    => isset($row->min_price) ? (float) $row->min_price : null,
                        'p25'    => isset($row->p25) ? (float) $row->p25 : null,
                        'median' => isset($row->median) ? (float) $row->median : null,
                        'p75'    => isset($row->p75) ? (float) $row->p75 : null,
                        'max'    => isset($row->max_price) ? (float) $row->max_price : null,
                    ];
                } catch (\Throwable $e) {
                    return null;
                }
            };

            $s = $tryPg('lower(make) = ? AND lower(model) = ? AND year BETWEEN ? AND ?', [$make, $model, $year-1, $year+1]);
            if ($s) return $s;

            $s = $tryPg('lower(make) = ? AND lower(model) = ? AND year BETWEEN ? AND ?', [$make, $model, $year-3, $year+3]);
            if ($s) return $s;

            $s = $tryPg('lower(make) = ? AND year BETWEEN ? AND ?', [$make, $year-3, $year+3]);
            if ($s) return $s;

            $band = 0.25;
            $minP = max(0, $price * (1 - $band));
            $maxP = $price * (1 + $band);
            $s = $tryPg('evaluation_price BETWEEN ? AND ?', [$minP, $maxP]);
            if ($s) return $s;

            return ['count' => 0];
        }

        // ✅ أي DB تانية: stats بسيطة (بدون percentiles) عشان ما ينهارش
        $try = function (string $where, array $bindings = []) {
            $row = Car::query()
                ->whereNotNull('evaluation_price')
                ->whereRaw($where, $bindings)
                ->selectRaw('COUNT(*) AS n, MIN(evaluation_price) AS min_price, MAX(evaluation_price) AS max_price, AVG(evaluation_price) AS avg_price')
                ->first();

            $count = (int) ($row->n ?? 0);
            if ($count <= 0) return null;

            return [
                'count'  => $count,
                'min'    => isset($row->min_price) ? (float) $row->min_price : null,
                'p25'    => null,
                'median' => isset($row->avg_price) ? (float) $row->avg_price : null, // بدل median
                'p75'    => null,
                'max'    => isset($row->max_price) ? (float) $row->max_price : null,
            ];
        };

        $s = $try('lower(make) = ? AND lower(model) = ? AND year BETWEEN ? AND ?', [$make, $model, $year-1, $year+1]);
        if ($s) return $s;

        $s = $try('lower(make) = ? AND lower(model) = ? AND year BETWEEN ? AND ?', [$make, $model, $year-3, $year+3]);
        if ($s) return $s;

        $s = $try('lower(make) = ? AND year BETWEEN ? AND ?', [$make, $year-3, $year+3]);
        if ($s) return $s;

        $band = 0.25;
        $minP = max(0, $price * (1 - $band));
        $maxP = $price * (1 + $band);
        $s = $try('evaluation_price BETWEEN ? AND ?', [$minP, $maxP]);
        if ($s) return $s;

        return ['count' => 0];
    }
}

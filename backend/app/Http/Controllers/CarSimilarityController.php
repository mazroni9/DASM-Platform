<?php

namespace App\Http\Controllers;

use App\Models\Car;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CarSimilarityController extends Controller
{
    /**
     * خوارزمية اقتراح سيارات مشابهة (مرنة + سريعة + Fallback قوي)
     *
     * المراحل:
     *  1) نفس الماركة + نفس الموديل (سنة ±0..±2 ، سعر ±15%..±30%) + وزن بسيط للممشى لو موجود
     *  2) نفس الماركة فقط مع فزي موديل (pg_trgm إن وجد) (سنة ±2..±4 ، سعر ±35%..±60%)
     *  3) نفس الماركة فقط بدون قيد سنة (سعر ±60%)
     *  ثم Fallback:
     *    A) أي ماركة/موديل ضمن ±40% من السعر
     *    B) أقرب أسعار مطلقًا من الجدول كله (بدون أي قيود)
     *
     * الفرز النهائي: rank_score (أقل = أفضل) مبني على:
     *   price_diff_norm (أهم عامل) + year_diff * 0.15 + odo_penalty * 0.05 - model_sim * 0.2
     */
    public function suggest(Request $request)
    {
        $data = $request->validate([
            'make'       => 'required|string',
            'model'      => 'required|string',
            'year'       => 'required|integer|min:1950|max:2100',
            'price'      => 'required|numeric|min:0',
            'odometer'   => 'nullable|integer|min:0',
            'exclude_id' => 'nullable|integer',
            'limit'      => 'nullable|integer|min:1|max:10',
        ]);

        $make     = mb_strtolower(trim($data['make']));
        $model    = mb_strtolower(trim($data['model']));
        $year     = (int) $data['year'];
        $price    = (float) $data['price'];
        $odo      = $data['odometer'] ?? null;
        $limit    = (int)($data['limit'] ?? 3);
        $excludeId= $data['exclude_id'] ?? null;

        // هل pg_trgm متاح؟ (نكاشيه 10 دقائق)
        $hasTrgm = Cache::remember('pg_trgm_installed', 600, function () {
            try {
                $row = DB::selectOne("SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_trgm') AS installed");
                return (bool) ($row->installed ?? false);
            } catch (\Throwable $e) {
                return false;
            }
        });

        // كاش خفيف 30 ثانية
        $cacheKey = "similar:v3:" . md5(json_encode([$make,$model,$year,round($price,0),$odo,$limit,$excludeId,$hasTrgm]));
        return Cache::remember($cacheKey, 30, function () use ($make,$model,$year,$price,$odo,$limit,$excludeId,$hasTrgm) {

            $results = collect();

            // مراحل مرنة تدريجية
            $phases = [
                // نفس الماركة + نفس الموديل (ضيّق → أوسع)
                ['brand_only' => false, 'year_delta' => 0, 'price_band' => 0.15, 'use_odo' => true],
                ['brand_only' => false, 'year_delta' => 1, 'price_band' => 0.20, 'use_odo' => true],
                ['brand_only' => false, 'year_delta' => 2, 'price_band' => 0.30, 'use_odo' => false],

                // نفس الماركة فقط + فزي موديل
                ['brand_only' => true,  'year_delta' => 2, 'price_band' => 0.35, 'use_odo' => false, 'fuzzy_model' => true],
                ['brand_only' => true,  'year_delta' => 4, 'price_band' => 0.50, 'use_odo' => false, 'fuzzy_model' => true],

                // نفس الماركة فقط بدون سنة
                ['brand_only' => true,  'any_year'   => true, 'price_band' => 0.60, 'use_odo' => false, 'fuzzy_model' => true],
            ];

            foreach ($phases as $phase) {
                if ($results->count() >= $limit) break;

                $q = Car::query()
                    ->select([
                        'id','make','model','year','odometer',
                        'evaluation_price','color','engine','transmission','description','images'
                    ])
                    ->whereNotNull('evaluation_price')
                    ->whereRaw('lower(make) = ?', [$make]);

                // فلترة/ترتيب الموديل
                if (empty($phase['brand_only'])) {
                    // دقيق + contains
                    $q->where(function ($qq) use ($model) {
                        $qq->whereRaw('lower(model) = ?', [$model])
                           ->orWhereRaw('lower(model) LIKE ?', ['%'.$model.'%']);
                    });
                } else {
                    // فزي داخل نفس الماركة (اختياري)
                    if (!empty($phase['fuzzy_model'])) {
                        if ($hasTrgm) {
                            $q->selectRaw('similarity(lower(model), ?) AS model_sim', [$model]);
                            $q->orderByRaw('similarity(lower(model), ?) DESC', [$model]);
                        } else {
                            // بدون pg_trgm: وزن بسيط
                            $q->selectRaw('(CASE WHEN lower(model) = ? THEN 1.0 WHEN lower(model) LIKE ? THEN 0.5 ELSE 0 END) AS model_sim', [$model, '%'.$model.'%']);
                            $q->orderByRaw('(CASE WHEN lower(model) = ? THEN 1.0 WHEN lower(model) LIKE ? THEN 0.5 ELSE 0 END) DESC', [$model, '%'.$model.'%']);
                        }
                    }
                }

                // سنة
                if (empty($phase['any_year'])) {
                    $yd = (int)($phase['year_delta'] ?? 0);
                    $q->whereBetween('year', [$year - $yd, $year + $yd]);
                }

                // نطاق السعر
                $band = (float) $phase['price_band'];
                $minP = max(0, $price * (1 - $band));
                $maxP = $price * (1 + $band);
                $q->whereBetween('evaluation_price', [$minP, $maxP]);

                // استبعاد id إن طلب
                if ($excludeId) {
                    $q->where('id', '<>', $excludeId);
                }

                // فرق السعر + ممشى
                $q->selectRaw('ABS(evaluation_price - ?) AS price_diff', [$price]);

                if (!empty($phase['use_odo']) && $odo !== null) {
                    // كل 10,000 كم = 1 نقطة
                    $q->selectRaw('CASE WHEN odometer IS NULL THEN 0 ELSE ABS(odometer - ?)/10000.0 END AS odo_penalty', [(int)$odo]);
                    $q->orderByRaw(' (ABS(evaluation_price - ?)) + 0.05 * (CASE WHEN odometer IS NULL THEN 0 ELSE ABS(odometer - ?)/10000.0 END) ASC ',
                        [$price, (int)$odo]
                    );
                } else {
                    $q->orderBy('price_diff', 'asc');
                }

                // نسحب أكثر من المطلوب ثم نكمّش
                $phaseRows = $q->limit(max($limit * 10, 60))->get();
                if ($phaseRows->isNotEmpty()) {
                    $results = $results->concat($phaseRows)->unique('id');
                }

                if ($results->count() >= $limit) break;
            }

            // Fallback A: أي ماركة/موديل ضمن ±40% من السعر
            if ($results->count() < $limit) {
                $band = 0.40;
                $minP = max(0, $price * (1 - $band));
                $maxP = $price * (1 + $band);

                $extra = Car::query()
                    ->select([
                        'id','make','model','year','odometer',
                        'evaluation_price','color','engine','transmission','description','images'
                    ])
                    ->whereNotNull('evaluation_price')
                    ->whereBetween('evaluation_price', [$minP, $maxP])
                    ->when($excludeId, fn($qq) => $qq->where('id','<>',$excludeId))
                    ->selectRaw('ABS(evaluation_price - ?) AS price_diff', [$price])
                    ->orderBy('price_diff','asc')
                    ->limit(max($limit * 10, 60))
                    ->get();

                $results = $results->concat($extra)->unique('id');
            }

            // Fallback B: أقرب أسعار مطلقًا (بدون أي قيود)
            if ($results->count() < $limit) {
                $extra2 = Car::query()
                    ->select([
                        'id','make','model','year','odometer',
                        'evaluation_price','color','engine','transmission','description','images'
                    ])
                    ->whereNotNull('evaluation_price')
                    ->when($excludeId, fn($qq) => $qq->where('id','<>',$excludeId))
                    ->selectRaw('ABS(evaluation_price - ?) AS price_diff', [$price])
                    ->orderBy('price_diff','asc')
                    ->limit(max($limit * 10, 80))
                    ->get();

                $results = $results->concat($extra2)->unique('id');
            }

            // --------- الفرز النهائي بالـ rank_score (أقل = أفضل) ----------
            // أوزان (اضبطها حسب رغبتك)
            $wPrice = 1.0;   // أهم عامل
            $wYear  = 0.15;  // تأثير فرق السنة
            $wOdo   = 0.05;  // تأثير الممشى
            $wModel = 0.20;  // مكافأة تشابه الاسم

            $final = $results->map(function ($c) use ($price,$year,$wPrice,$wYear,$wOdo,$wModel) {
                    $priceDiff      = abs(((float)$c->evaluation_price) - $price);
                    $priceDiffNorm  = $price > 0 ? ($priceDiff / $price) : $priceDiff; // تطبيع نسبي
                    $yearDiff       = abs(((int)$c->year) - $year);
                    $odoPenalty     = property_exists($c,'odo_penalty') && $c->odo_penalty !== null
                                      ? (float)$c->odo_penalty
                                      : 0.0;
                    $modelSim       = property_exists($c,'model_sim') && $c->model_sim !== null
                                      ? (float)$c->model_sim
                                      : 0.0;

                    $rank = ($wPrice * $priceDiffNorm)
                          + ($wYear * $yearDiff)
                          + ($wOdo  * $odoPenalty)
                          - ($wModel * $modelSim);

                    // نخزّنها مؤقتًا
                    $c->rank_score   = $rank;
                    $c->price_diff   = $priceDiff; // للاستخدام في الإخراج
                    return $c;
                })
                ->sortBy('rank_score')
                ->take($limit)
                ->values();

            // ======= الإحصائيات المرنة =======
            $stats = $this->computeFlexibleStats($make, $model, $year, $price);

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
                    return [
                        'id' => $c->id,
                        'label' => "{$c->make} {$c->model} {$c->year}",
                        'year' => (int)$c->year,
                        'odometer' => $c->odometer,
                        'evaluation_price' => (float)$c->evaluation_price,
                        'price_diff' => round(((float)$c->evaluation_price - $price), 2),
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

    /**
     * إحصائيات مرنة:
     *  1) make+model سنة ±1
     *  2) make+model سنة ±3
     *  3) make فقط سنة ±3
     *  4) نطاق سعر عام ±25% (كل الماركات/الموديلات)
     */
    private function computeFlexibleStats(string $make, string $model, int $year, float $price): array
    {
        $try = function ($where, $bindings = []) {
            $row = Car::query()
                ->whereNotNull('evaluation_price')
                ->whereRaw($where, $bindings)
                ->selectRaw("
                    COUNT(*) AS n,
                    MIN(evaluation_price)::numeric AS min_price,
                    MAX(evaluation_price)::numeric AS max_price,
                    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY evaluation_price)::numeric AS p25,
                    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY evaluation_price)::numeric AS median,
                    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY evaluation_price)::numeric AS p75
                ")
                ->first();

            $count = (int)($row->n ?? 0);

            return $count > 0 ? [
                'count'  => $count,
                'min'    => isset($row->min_price) ? (float)$row->min_price : null,
                'p25'    => isset($row->p25) ? (float)$row->p25 : null,
                'median' => isset($row->median) ? (float)$row->median : null,
                'p75'    => isset($row->p75) ? (float)$row->p75 : null,
                'max'    => isset($row->max_price) ? (float)$row->max_price : null,
            ] : null;
        };

        // 1) make+model سنة ±1
        $stats = $try('lower(make) = ? AND lower(model) = ? AND year BETWEEN ? AND ?', [$make, $model, $year-1, $year+1]);
        if ($stats) return $stats;

        // 2) make+model سنة ±3
        $stats = $try('lower(make) = ? AND lower(model) = ? AND year BETWEEN ? AND ?', [$make, $model, $year-3, $year+3]);
        if ($stats) return $stats;

        // 3) make فقط سنة ±3
        $stats = $try('lower(make) = ? AND year BETWEEN ? AND ?', [$make, $year-3, $year+3]);
        if ($stats) return $stats;

        // 4) نطاق سعر عام ±25%
        $band = 0.25;
        $minP = max(0, $price * (1 - $band));
        $maxP = $price * (1 + $band);
        $stats = $try('evaluation_price BETWEEN ? AND ?', [$minP, $maxP]);
        if ($stats) return $stats;

        // إن لم نجد أي شيء
        return ['count' => 0];
    }
}

<?php

namespace App\Http\Controllers\Market;

use App\Http\Controllers\Controller;
use App\Http\Resources\PublicMarketCarResource;
use App\Models\Car;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class PublicCarExplorerController extends Controller
{
    private const MAX_PER_PAGE = 48;

    // أقل عدد لازم يرجع في fallback (طالما في داتا)
    private const MIN_FALLBACK_RESULTS = 5;

    // أقصى عدد IDs نشتغل عليهم في stats عشان الأداء
    private const STATS_SAMPLE_LIMIT = 2000;

    /**
     * GET /api/market/explorer/cars
     * ✅ Public endpoint (Hybrid: strict ثم أقرب الأقرب)
     */
    public function index(Request $request)
    {
        // حماية من الاستعلامات الضخمة بدون أي فلتر
        if (!$this->hasAnyFilter($request)) {
            return response()->json([
                'success' => false,
                'message' => 'يجب تحديد فلتر واحد على الأقل (مثل make/model/year/q) لتفادي استعلام ضخم.',
            ], 422);
        }

        $perPage = (int) $request->query('per_page', 12);
        $perPage = max(1, min($perPage, self::MAX_PER_PAGE));

        // 1) ✅ Strict (المطابق أولًا)
        $strict = Car::query();
        $this->applyStrictFilters($strict, $request);
        $this->applySort($strict, $request);

        $strictPaginator = $strict->simplePaginate($perPage);

        if ($strictPaginator->count() > 0) {
            return PublicMarketCarResource::collection($strictPaginator)->additional([
                'success'  => true,
                'fallback' => false,
                'mode'     => 'strict',
            ]);
        }

        // 2) ✅ Fallback Hybrid (أقرب الأقرب)
        $resolved = $this->resolveClosestMakeModel($request);

        // Level A: Candidates + score (مفلتر OR + windows ثم scoring)
        $fallbackA = $this->buildHybridScoredQuery($request, $resolved, prefilter: true);
        $fallbackA->orderByDesc('score')->orderByDesc('created_at');
        $fallbackPaginator = $fallbackA->simplePaginate($perPage);

        if ($fallbackPaginator->count() > 0) {
            return PublicMarketCarResource::collection($fallbackPaginator)->additional([
                'success'   => true,
                'fallback'  => true,
                'mode'      => 'hybrid_scored',
                'message'   => 'لا توجد نتائج مطابقة تمامًا، تم عرض أقرب النتائج المتاحة من قاعدة البيانات.',
                'resolved'  => $resolved,
            ]);
        }

        // Level B: لو حتى المرشحين صفر (نادر) ⇒ رجّع أحدث عربيات (دايمًا يجيب بيانات لو الجدول مش فاضي)
        $latest = Car::query()->orderByDesc('created_at')->simplePaginate($perPage);

        return PublicMarketCarResource::collection($latest)->additional([
            'success'   => true,
            'fallback'  => true,
            'mode'      => 'latest',
            'message'   => $latest->count() > 0
                ? 'تم عرض أحدث البيانات المتاحة (لا توجد أي نتائج قريبة حسب الداتا الحالية).'
                : 'لا توجد بيانات سيارات في قاعدة البيانات.',
            'resolved'  => $resolved,
        ]);
    }

    /**
     * GET /api/market/explorer/cars/{car}
     */
    public function show(Request $request, Car $car)
    {
        return (new PublicMarketCarResource($car))->additional(['success' => true]);
    }

    /**
     * GET /api/market/explorer/cars/stats
     * ✅ Hybrid stats: strict لو فيه نتائج، وإلا stats على عينة من أقرب المرشحين
     */
    public function stats(Request $request)
    {
        if (!$this->hasAnyFilter($request)) {
            return response()->json([
                'success' => false,
                'message' => 'يجب تحديد فلتر واحد على الأقل (مثل make/model/year/q) للحصول على الإحصائيات.',
            ], 422);
        }

        $resolved = $this->resolveClosestMakeModel($request);

        // هل strict عنده بيانات سعر أصلاً؟
        $strictBase = Car::query();
        $this->applyStrictFilters($strictBase, $request);
        $strictCount = (clone $strictBase)->whereNotNull('evaluation_price')->count();

        $mode = $strictCount > 0 ? 'strict' : 'hybrid';

        $cacheKey = $this->statsCacheKey($request, $mode);
        $payload = Cache::remember($cacheKey, 60, function () use ($request, $mode, $strictBase, $resolved) {

            if ($mode === 'strict') {
                return $this->computeStats((clone $strictBase)->whereNotNull('evaluation_price'));
            }

            // ✅ Hybrid: ناخد عينة IDs من أقرب المرشحين (بدون Full Scan)
            $ids = $this->hybridCandidateIdsForStats($request, $resolved);

            if (empty($ids)) {
                return [
                    'mode' => 'hybrid',
                    'count' => 0,
                    'avg_price' => null,
                    'min_price' => null,
                    'max_price' => null,
                    'median_price' => null,
                ];
            }

            $base = Car::query()
                ->whereIn('id', $ids)
                ->whereNotNull('evaluation_price');

            $stats = $this->computeStats($base);
            $stats['mode'] = 'hybrid';
            $stats['resolved'] = $resolved;

            return $stats;
        });

        return response()->json([
            'success' => true,
            'stats'   => $payload,
        ], 200);
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private function hasAnyFilter(Request $request): bool
    {
        return
            trim((string) $request->query('q', '')) !== '' ||
            trim((string) $request->query('make', '')) !== '' ||
            trim((string) $request->query('model', '')) !== '' ||
            $request->filled('year_from') ||
            $request->filled('year_to') ||
            $request->filled('odometer_from') ||
            $request->filled('odometer_to') ||
            $request->filled('price_from') ||
            $request->filled('price_to') ||
            $request->filled('condition') ||
            $request->filled('auction_status');
    }

    private function applySort($query, Request $request): void
    {
        $allowedSort = ['created_at', 'year', 'odometer', 'evaluation_price'];
        $sortBy  = in_array($request->query('sort_by'), $allowedSort, true) ? $request->query('sort_by') : 'created_at';
        $sortDir = strtolower($request->query('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDir);
    }

    /**
     * Strict filters = مطابق قدر الإمكان
     */
    private function applyStrictFilters($query, Request $request): void
    {
        $opLike = (DB::getDriverName() === 'pgsql') ? 'ilike' : 'like';

        if ($q = trim((string) $request->query('q', ''))) {
            $like = "%{$q}%";
            $query->where(function ($qq) use ($like, $opLike) {
                $qq->where('make', $opLike, $like)
                    ->orWhere('model', $opLike, $like)
                    ->orWhere('color', $opLike, $like)
                    ->orWhere('description', $opLike, $like);
            });
        }

        if ($request->filled('make'))   $query->where('make', $request->query('make'));
        if ($request->filled('model'))  $query->where('model', $request->query('model'));

        if ($request->filled('year_from')) $query->where('year', '>=', (int) $request->query('year_from'));
        if ($request->filled('year_to'))   $query->where('year', '<=', (int) $request->query('year_to'));

        if ($request->filled('condition'))      $query->where('condition', $request->query('condition'));
        if ($request->filled('auction_status')) $query->where('auction_status', $request->query('auction_status'));

        if ($request->filled('odometer_from')) $query->where('odometer', '>=', (int) $request->query('odometer_from'));
        if ($request->filled('odometer_to'))   $query->where('odometer', '<=', (int) $request->query('odometer_to'));

        if ($request->filled('price_from')) $query->where('evaluation_price', '>=', (float) $request->query('price_from'));
        if ($request->filled('price_to'))   $query->where('evaluation_price', '<=', (float) $request->query('price_to'));
    }

    /**
     * ✅ Hybrid scored query:
     * - لا يرفض النتيجة لو السعر/السنة/المشى مش مطابق
     * - بيحسب score ويجيب الأقرب
     * - مع prefilter ذكي لتجنب Full Scan (OR + windows)
     */
    private function buildHybridScoredQuery(Request $request, array $resolved, bool $prefilter = true)
    {
        $opLike = (DB::getDriverName() === 'pgsql') ? 'ilike' : 'like';

        $makeInput  = trim((string) $request->query('make', ''));
        $modelInput = trim((string) $request->query('model', ''));
        $qInput     = trim((string) $request->query('q', ''));

        $resolvedMake  = $resolved['resolved']['make']  ?? null;
        $resolvedModel = $resolved['resolved']['model'] ?? null;

        // Targets
        $yearTarget = $this->midInt($request->query('year_from'), $request->query('year_to'));
        $odoTarget  = $this->midInt($request->query('odometer_from'), $request->query('odometer_to'));
        $priceTarget = $this->midFloat($request->query('price_from'), $request->query('price_to'));

        $condition = $request->filled('condition') ? (string) $request->query('condition') : null;
        $auctionStatus = $request->filled('auction_status') ? (string) $request->query('auction_status') : null;

        $query = Car::query();

        // ✅ Prefilter: نجمع مرشحين بسرعة بدون قتل النتائج (OR مش AND)
        if ($prefilter) {
            $query->where(function ($w) use (
                $opLike,
                $makeInput, $modelInput, $qInput,
                $resolvedMake, $resolvedModel,
                $yearTarget, $odoTarget, $priceTarget
            ) {
                $has = false;

                // make/model OR (input + resolved)
                if ($makeInput !== '') {
                    $has = true;
                    $w->orWhere('make', $opLike, '%' . $makeInput . '%');
                }
                if (!empty($resolvedMake) && $resolvedMake !== $makeInput) {
                    $has = true;
                    $w->orWhere('make', $opLike, '%' . $resolvedMake . '%');
                }

                if ($modelInput !== '') {
                    $has = true;
                    $w->orWhere('model', $opLike, '%' . $modelInput . '%');
                }
                if (!empty($resolvedModel) && $resolvedModel !== $modelInput) {
                    $has = true;
                    $w->orWhere('model', $opLike, '%' . $resolvedModel . '%');
                }

                // q search OR across columns
                if ($qInput !== '') {
                    $has = true;
                    $like = '%' . $qInput . '%';
                    $w->orWhere('make', $opLike, $like)
                        ->orWhere('model', $opLike, $like)
                        ->orWhere('color', $opLike, $like)
                        ->orWhere('description', $opLike, $like);
                }

                // year window OR (لو مفيش make/model/q أو حتى معاهم)
                if ($yearTarget !== null) {
                    $has = true;
                    $w->orWhereBetween('year', [$yearTarget - 5, $yearTarget + 5]);
                }

                // odometer window OR
                if ($odoTarget !== null) {
                    $has = true;
                    $w->orWhereBetween('odometer', [max(0, $odoTarget - 50000), $odoTarget + 50000]);
                }

                // price window OR (مرن)
                if ($priceTarget !== null) {
                    $has = true;
                    $min = max(0, $priceTarget * 0.6);
                    $max = $priceTarget * 1.4;
                    $w->orWhereBetween('evaluation_price', [$min, $max]);
                }

                // لو ولا حاجة اتضافت (نادر لأننا بنطلب filter) سيبها
                if (!$has) {
                    $w->orWhereNotNull('id');
                }
            });
        }

        // ✅ Score expression (Soft matching)
        $scoreParts = [];
        $bindings = [];

        // make scoring
        $makeForScore = $resolvedMake ?: ($makeInput !== '' ? $makeInput : null);
        if ($makeForScore) {
            $scoreParts[] = "(CASE
                WHEN make = ? THEN 50
                WHEN make {$opLike} ? THEN 25
                ELSE 0 END)";
            $bindings[] = $makeForScore;
            $bindings[] = $makeForScore . '%';
        }

        // model scoring
        $modelForScore = $resolvedModel ?: ($modelInput !== '' ? $modelInput : null);
        if ($modelForScore) {
            $scoreParts[] = "(CASE
                WHEN model = ? THEN 40
                WHEN model {$opLike} ? THEN 20
                ELSE 0 END)";
            $bindings[] = $modelForScore;
            $bindings[] = $modelForScore . '%';
        }

        // q scoring (وجود الكلمة في أي مكان)
        if ($qInput !== '') {
            $like = '%' . $qInput . '%';
            $scoreParts[] = "(CASE
                WHEN (make {$opLike} ? OR model {$opLike} ? OR color {$opLike} ? OR description {$opLike} ?)
                THEN 15 ELSE 0 END)";
            $bindings[] = $like;
            $bindings[] = $like;
            $bindings[] = $like;
            $bindings[] = $like;
        }

        // year closeness
        if ($yearTarget !== null) {
            $scoreParts[] = "(CASE
                WHEN year IS NULL THEN 0
                ELSE GREATEST(0, 30 - ABS(year - ?))
            END)";
            $bindings[] = $yearTarget;
        }

        // odometer closeness
        if ($odoTarget !== null) {
            $scoreParts[] = "(CASE
                WHEN odometer IS NULL THEN 0
                ELSE GREATEST(0, 20 - (ABS(odometer - ?) / 20000.0))
            END)";
            $bindings[] = $odoTarget;
        }

        // price closeness
        if ($priceTarget !== null) {
            $scoreParts[] = "(CASE
                WHEN evaluation_price IS NULL THEN 0
                ELSE GREATEST(0, 20 - (ABS(evaluation_price - ?) / 50000.0))
            END)";
            $bindings[] = $priceTarget;
        }

        // condition/status as bonus (مش شرط)
        if ($condition) {
            $scoreParts[] = "(CASE WHEN condition = ? THEN 10 ELSE 0 END)";
            $bindings[] = $condition;
        }
        if ($auctionStatus) {
            $scoreParts[] = "(CASE WHEN auction_status = ? THEN 10 ELSE 0 END)";
            $bindings[] = $auctionStatus;
        }

        $expr = implode(' + ', $scoreParts);
        if ($expr === '') $expr = '0';

        $query->select('*')->selectRaw("($expr) as score", $bindings);

        return $query;
    }

    private function midInt($from, $to): ?int
    {
        $fromOk = is_numeric($from);
        $toOk   = is_numeric($to);

        if ($fromOk && $toOk) return (int) round((((int)$from) + ((int)$to)) / 2);
        if ($fromOk) return (int) $from;
        if ($toOk)   return (int) $to;
        return null;
    }

    private function midFloat($from, $to): ?float
    {
        $fromOk = is_numeric($from);
        $toOk   = is_numeric($to);

        if ($fromOk && $toOk) return (float) ((((float)$from) + ((float)$to)) / 2);
        if ($fromOk) return (float) $from;
        if ($toOk)   return (float) $to;
        return null;
    }

    private function statsCacheKey(Request $request, string $mode): string
    {
        $params = $request->query();
        ksort($params);
        return 'public_car_explorer_stats:' . $mode . ':' . md5(json_encode($params));
    }

    private function computeStats($base): array
    {
        $count = (clone $base)->count();
        $avg   = (clone $base)->avg('evaluation_price');
        $min   = (clone $base)->min('evaluation_price');
        $max   = (clone $base)->max('evaluation_price');

        $median = null;
        $includeMedian = request()->boolean('include_median', true);

        if ($includeMedian && $count > 0) {
            try {
                if (DB::getDriverName() === 'pgsql') {
                    $median = (clone $base)
                        ->selectRaw('percentile_cont(0.5) WITHIN GROUP (ORDER BY evaluation_price) as median_price')
                        ->value('median_price');
                }
            } catch (\Throwable $e) {
                $median = null;
            }
        }

        return [
            'count' => (int) $count,
            'avg_price' => $avg !== null ? (float) $avg : null,
            'min_price' => $min !== null ? (float) $min : null,
            'max_price' => $max !== null ? (float) $max : null,
            'median_price' => $median !== null ? (float) $median : null,
        ];
    }

    /**
     * IDs لعينة stats من أقرب المرشحين (بدون Full Scan)
     * + FIX لمشكلة score + pluck: نعمل reorder() قبل اختيار IDs
     */
    private function hybridCandidateIdsForStats(Request $request, array $resolved): array
    {
        $q = $this->buildHybridScoredQuery($request, $resolved, prefilter: true);

        $ids = (clone $q)
            ->reorder()              // ✅ يشيل order by score
            ->orderByDesc('created_at')
            ->limit(self::STATS_SAMPLE_LIMIT)
            ->get(['id'])
            ->pluck('id')
            ->toArray();

        if (!empty($ids)) return $ids;

        // لو لسبب ما صفر: هات أحدث IDs
        return Car::query()
            ->orderByDesc('created_at')
            ->limit(self::STATS_SAMPLE_LIMIT)
            ->get(['id'])
            ->pluck('id')
            ->toArray();
    }

    // ------------------------------------------------------------------
    // Closest make/model (tyota -> toyota) using levenshtein + cached distincts
    // ------------------------------------------------------------------

    private function resolveClosestMakeModel(Request $request): array
    {
        $make = trim((string) $request->query('make', ''));
        $model = trim((string) $request->query('model', ''));

        $resolvedMake = null;
        $resolvedModel = null;

        if ($make !== '') {
            $resolvedMake = $this->closestColumnValue('make', $make);
        }
        if ($model !== '') {
            $resolvedModel = $this->closestColumnValue('model', $model);
        }

        return [
            'input' => [
                'make'  => $make !== '' ? $make : null,
                'model' => $model !== '' ? $model : null,
            ],
            'resolved' => [
                'make'  => $resolvedMake,
                'model' => $resolvedModel,
            ],
        ];
    }

    private function normalizeTerm(string $s): string
    {
        $s = mb_strtolower(trim($s));
        $s = preg_replace('/[\s\-_]+/u', '', $s);
        return $s ?? '';
    }

    private function distinctColumnValues(string $column): array
    {
        $key = "cars:distinct:{$column}";
        return Cache::remember($key, 3600, function () use ($column) {
            return Car::query()
                ->whereNotNull($column)
                ->where($column, '!=', '')
                ->select($column)
                ->distinct()
                ->orderBy($column)
                ->limit(10000)
                ->pluck($column)
                ->toArray();
        });
    }

    private function closestColumnValue(string $column, string $input): ?string
    {
        $values = $this->distinctColumnValues($column);
        if (empty($values)) return null;

        $needle = $this->normalizeTerm($input);
        if ($needle === '') return null;

        $best = null;
        $bestDist = PHP_INT_MAX;

        foreach ($values as $v) {
            $cand = $this->normalizeTerm((string) $v);
            if ($cand === '') continue;

            if ($cand === $needle) {
                return (string) $v;
            }

            $dist = levenshtein($needle, $cand);
            if ($dist < $bestDist) {
                $bestDist = $dist;
                $best = (string) $v;
            }
        }

        $len = mb_strlen($needle);
        $threshold = ($len <= 4) ? 1 : (($len <= 7) ? 2 : 3);

        return ($best !== null && $bestDist <= $threshold) ? $best : null;
    }
}

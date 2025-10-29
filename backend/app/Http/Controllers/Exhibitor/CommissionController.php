<?php

namespace App\Http\Controllers\Exhibitor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\VenueOwner;
use App\Models\VenueCommissionOperation;
use App\Models\CommissionTier;
use Illuminate\Validation\Rule;

class CommissionController extends Controller
{
    /**
     * GET /api/exhibitor/commission/summary
     * قيمة السعي + عملة + ملاحظة + آخر عمليات (recent=N)
     */
    public function summary(Request $request)
    {
        $venue = VenueOwner::where('user_id', $request->user()->id)->firstOrFail();

        $per = (int) $request->integer('recent', 5);
        $ops = VenueCommissionOperation::where('venue_owner_id', $venue->id)
            ->latest()
            ->take($per)
            ->get()
            ->map(fn ($op) => [
                'id'    => $op->id,
                'date'  => $op->created_at?->toIso8601String(),
                'car'   => $op->car_title,
                'value' => (float) $op->amount,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'commissionValue'    => (float) ($venue->commission_value ?? 0),
                'commissionCurrency' => $venue->commission_currency ?? 'SAR',
                'commissionNote'     => $venue->commission_note ?? null,
                'recentCommissions'  => $ops,
            ],
        ]);
    }

    /**
     * PUT /api/exhibitor/commission/settings
     * تحديث إعدادات السعي لصاحب المعرض
     */
    public function updateSettings(Request $request)
    {
        $request->validate([
            'commission_value'    => ['required','numeric','min:0'],
            'commission_currency' => ['nullable','string','size:3'],
            'commission_note'     => ['nullable','string','max:2000'],
        ]);

        $venue = VenueOwner::where('user_id', $request->user()->id)->firstOrFail();

        $venue->commission_value = (float) $request->commission_value;
        if ($request->filled('commission_currency')) {
            $venue->commission_currency = strtoupper($request->commission_currency);
        }
        if ($request->filled('commission_note')) {
            $venue->commission_note = $request->commission_note;
        }
        $venue->save();

        return response()->json(['success' => true, 'message' => 'تم تحديث الإعدادات.']);
    }

    /**
     * GET /api/exhibitor/commission/operations
     * قائمة العمليات مع فلترة وتصفح
     */
    public function index(Request $request)
    {
        $venue = VenueOwner::where('user_id', $request->user()->id)->firstOrFail();

        $perPage = (int) $request->integer('per_page', 10);
        $q       = trim((string) $request->get('q', ''));
        $from    = $request->date('from');
        $to      = $request->date('to');

        $ops = VenueCommissionOperation::where('venue_owner_id', $venue->id)
            ->when($q !== '', function ($qf) use ($q) {
                $qf->where(function ($w) use ($q) {
                    $w->where('car_title', 'like', "%{$q}%")
                      ->orWhere('description', 'like', "%{$q}%");
                });
            })
            ->when($from, fn ($w) => $w->whereDate('created_at', '>=', $from))
            ->when($to,   fn ($w) => $w->whereDate('created_at', '<=', $to))
            ->latest()
            ->paginate($perPage);

        $mapped = $ops->getCollection()->map(fn ($op) => [
            'id'           => $op->id,
            'date'         => $op->created_at?->toIso8601String(),
            'car'          => $op->car_title,
            'value'        => (float) $op->amount,
            'currency'     => $op->currency,
            'description'  => $op->description,
        ]);

        $ops->setCollection($mapped);

        return response()->json($ops);
    }

    /**
     * POST /api/exhibitor/commission/operations
     * إضافة عملية سعي (اختبار/تكامل لاحقًا)
     */
    public function storeOperation(Request $request)
    {
        $venue = VenueOwner::where('user_id', $request->user()->id)->firstOrFail();

        $data = $request->validate([
            'amount'      => ['required','numeric','min:0'],
            'currency'    => ['nullable','string','size:3'],
            'car_title'   => ['nullable','string','max:150'],
            'description' => ['nullable','string','max:255'],
        ]);

        $op = VenueCommissionOperation::create([
            'venue_owner_id' => $venue->id,
            'amount'         => (float) $data['amount'],
            'currency'       => strtoupper($data['currency'] ?? ($venue->commission_currency ?? 'SAR')),
            'car_title'      => $data['car_title'] ?? null,
            'description'    => $data['description'] ?? null,
        ]);

        return response()->json(['success' => true, 'data' => $op], 201);
    }

    /**
     * GET /api/exhibitor/commission/tiers
     * عرض الشرائح الفعّالة
     */
    public function tiers(Request $request)
    {
        $tiers = CommissionTier::query()
            ->where('isActive', true)
            ->orderBy('minPrice')
            ->get()
            ->map(fn ($t) => [
                'id'               => $t->id,
                'name'             => $t->name,
                'minPrice'         => (float) $t->minPrice,
                'maxPrice'         => is_null($t->maxPrice) ? null : (float) $t->maxPrice,
                'commissionAmount' => (float) $t->commissionAmount,
                'isProgressive'    => (bool) $t->isProgressive,
            ]);

        return response()->json(['success' => true, 'data' => $tiers]);
    }

    /**
     * POST /api/exhibitor/commission/estimate
     * حساب تقديري: price + mode (flat|progressive)
     * نفترض commissionAmount = نسبة مئوية.
     */
    public function estimate(Request $request)
    {
        $data = $request->validate([
            'price' => ['required','numeric','min:0.01'],
            'mode'  => ['nullable', Rule::in(['flat','progressive'])],
        ]);

        $price = (float) $data['price'];
        $mode  = $data['mode'] ?? 'flat';

        $tiers = CommissionTier::query()
            ->where('isActive', true)
            ->orderBy('minPrice')
            ->get();

        if ($tiers->isEmpty()) {
            return response()->json(['success' => true, 'data' => ['amount' => 0.0, 'currency' => 'SAR', 'note' => 'لا توجد شرائح مفعّلة']], 200);
        }

        $amount = 0.0;
        if ($mode === 'flat') {
            $tier = $tiers->first(function ($t) use ($price) {
                $min = (float) $t->minPrice;
                $max = is_null($t->maxPrice) ? INF : (float) $t->maxPrice;
                return $price >= $min && $price <= $max;
            });
            if ($tier) {
                $amount = $price * ((float) $tier->commissionAmount) / 100.0;
            }
        } else {
            foreach ($tiers as $t) {
                $brStart = (float) $t->minPrice;
                $brEnd   = is_null($t->maxPrice) ? $price : min((float) $t->maxPrice, $price);
                if ($price <= $brStart) break;
                $segment = max(0.0, $brEnd - $brStart);
                if ($segment > 0) {
                    $amount += $segment * ((float) $t->commissionAmount) / 100.0;
                }
                if (!is_null($t->maxPrice) && $price <= (float) $t->maxPrice) {
                    break;
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'amount'   => round($amount, 2),
                'currency' => 'SAR',
                'mode'     => $mode,
            ],
        ]);
    }
}

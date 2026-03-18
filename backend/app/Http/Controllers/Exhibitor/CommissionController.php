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
    public function summary(Request $request)
    {
        $venue = $this->getVenueOwner($request);

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

    public function updateSettings(Request $request)
    {
        $request->validate([
            'commission_value'    => ['required','numeric','min:0'],
            'commission_currency' => ['nullable','string','size:3'],
            'commission_note'     => ['nullable','string','max:2000'],
        ]);

        $venue = $this->getVenueOwner($request);

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

    public function index(Request $request)
    {
        $venue = $this->getVenueOwner($request);

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

    public function storeOperation(Request $request)
    {
        $venue = $this->getVenueOwner($request);

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

    public function estimate(Request $request)
    {
        $data = $request->validate([
            'price' => ['required','numeric','min:0.01'],
            'mode'  => ['nullable', Rule::in(['flat','progressive'])],
        ]);

        $price = (float) $data['price'];
        $mode  = $data['mode'] ?? 'flat';

        $amount = CommissionTier::estimate($price, $mode);

        return response()->json([
            'success' => true,
            'data' => [
                'amount'   => round($amount, 2),
                'currency' => 'SAR',
                'mode'     => $mode,
            ],
        ]);
    }

    private function getVenueOwner(Request $request): VenueOwner
    {
        $venue = VenueOwner::where('user_id', $request->user()->id)->first();
        
        if (!$venue) {
            abort(403, 'ليس لديك ملف معرض.');
        }
        
        return $venue;
    }
}

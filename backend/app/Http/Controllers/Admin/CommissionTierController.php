<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CommissionTier;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CommissionTierController extends Controller
{
    public function index()
    {
        $tiers = CommissionTier::orderBy('minPrice')->get();
        return response()->json($tiers);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        // Prevent overlapping price ranges with active tiers
        if ($this->hasOverlap(null, $data['minPrice'], $data['maxPrice'], $data['isActive'])) {
            return response()->json([
                'message' => 'نطاق الأسعار يتداخل مع فئة أخرى مفعلة',
                'errors' => ['range' => ['نطاق الأسعار يتداخل مع فئة أخرى مفعلة']]
            ], 422);
        }

        $tier = CommissionTier::create($data);
        return response()->json($tier, 201);
    }

    public function show($id)
    {
        $tier = CommissionTier::findOrFail($id);
        return response()->json($tier);
    }

    public function update(Request $request, $id)
    {
        $tier = CommissionTier::findOrFail($id);
        $data = $this->validateData($request, $tier->id);

        if ($this->hasOverlap($tier->id, $data['minPrice'], $data['maxPrice'], $data['isActive'])) {
            return response()->json([
                'message' => 'نطاق الأسعار يتداخل مع فئة أخرى مفعلة',
                'errors' => ['range' => ['نطاق الأسعار يتداخل مع فئة أخرى مفعلة']]
            ], 422);
        }

        $tier->update($data);
        return response()->json($tier);
    }

    public function destroy($id)
    {
        $tier = CommissionTier::findOrFail($id);
        $tier->delete();
        return response()->json(['message' => 'تم حذف الفئة بنجاح']);
    }

    public function calculateCommission(Request $request)
    {
        $request->validate([
            'price' => ['required', 'numeric', 'min:0'],
        ], [
            'price.required' => 'السعر مطلوب',
            'price.numeric' => 'يجب إدخال رقم صحيح للسعر',
            'price.min' => 'السعر لا يمكن أن يكون سالبًا',
        ]);

        $price = (float) $request->input('price');
        $tier = CommissionTier::where('isActive', true)
            ->where('minPrice', '<=', $price)
            ->where(function ($q) use ($price) {
                $q->whereNull('maxPrice')->orWhere('maxPrice', '>=', $price);
            })
            ->orderBy('minPrice', 'desc')
            ->first();

        $commission = CommissionTier::getCommissionForPrice($price);

        return response()->json([
            'price' => $price,
            'commission' => $commission,
            'tier' => $tier,
        ]);
    }

    private function validateData(Request $request, $id = null): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'minPrice' => ['required', 'numeric', 'min:0'],
            'maxPrice' => ['nullable', 'numeric', 'gte:minPrice'],
            'commissionAmount' => ['required', 'numeric', 'min:0'],
            'isProgressive' => ['boolean'],
            'isActive' => ['boolean'],
        ];

        $messages = [
            'name.required' => 'اسم الفئة مطلوب',
            'minPrice.required' => 'أقل سعر مطلوب',
            'minPrice.numeric' => 'أقل سعر يجب أن يكون رقمًا',
            'maxPrice.numeric' => 'أعلى سعر يجب أن يكون رقمًا',
            'maxPrice.gte' => 'أعلى سعر يجب أن يكون أكبر من أو يساوي أقل سعر',
            'commissionAmount.required' => 'مبلغ العمولة مطلوب',
            'commissionAmount.numeric' => 'مبلغ العمولة يجب أن يكون رقمًا',
        ];

        $data = $request->validate($rules, $messages);

        $data['isProgressive'] = (bool) ($data['isProgressive'] ?? false);
        $data['isActive'] = (bool) ($data['isActive'] ?? true);

        return $data;
    }

    private function hasOverlap($excludeId, $min, $max, $isActive): bool
    {
        if (!$isActive) {
            return false;
        }

        $q = CommissionTier::where('isActive', true);
        if ($excludeId) {
            $q->where('id', '!=', $excludeId);
        }

        // Overlap condition: existing.min <= new.max AND (existing.max IS NULL OR existing.max >= new.min)
        // When new max is null, treat as infinity
        $q->where(function ($qq) use ($min, $max) {
            if ($max === null) {
                $qq->whereNull('maxPrice')
                   ->orWhere('maxPrice', '>=', $min);
            } else {
                $qq->where('minPrice', '<=', $max)
                   ->where(function ($qqq) use ($min) {
                       $qqq->whereNull('maxPrice')->orWhere('maxPrice', '>=', $min);
                   });
            }
        });

        return $q->exists();
    }
}



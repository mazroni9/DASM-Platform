<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SubscriptionPlanController extends Controller
{
    public function index(Request $request)
    {
        $query = SubscriptionPlan::query();

        // Filter by userType
        if ($request->has('userType') && $request->userType !== 'all') {
            $query->where('userType', $request->userType);
        }

        // Filter by isActive
        if ($request->has('isActive') && $request->isActive !== 'all') {
            $isActive = $request->isActive === 'active';
            $query->where('isActive', $isActive);
        }

        $plans = $query->orderBy('orderIndex')->orderBy('price')->get();
        return response()->json($plans);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        
        $plan = SubscriptionPlan::create($data);
        return response()->json($plan, 201);
    }

    public function show($id)
    {
        $plan = SubscriptionPlan::findOrFail($id);
        return response()->json($plan);
    }

    public function update(Request $request, $id)
    {
        $plan = SubscriptionPlan::findOrFail($id);
        $data = $this->validateData($request, $plan->id);

        $plan->update($data);
        return response()->json($plan);
    }

    public function destroy($id)
    {
        $plan = SubscriptionPlan::findOrFail($id);
        $plan->delete();
        return response()->json(['message' => 'تم حذف خطة الاشتراك بنجاح']);
    }

    public function toggleStatus($id)
    {
        $plan = SubscriptionPlan::findOrFail($id);
        $plan->update(['isActive' => !$plan->isActive]);
        
        $status = $plan->isActive ? 'تم تفعيل' : 'تم إلغاء تفعيل';
        return response()->json([
            'message' => $status . ' خطة الاشتراك بنجاح',
            'plan' => $plan
        ]);
    }

    public function getByUserType($userType)
    {
        $plans = SubscriptionPlan::getActiveForUserType($userType);
        return response()->json($plans);
    }

    private function validateData(Request $request, $id = null): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'userType' => ['required', 'string', Rule::in(array_keys(SubscriptionPlan::getUserTypes()))],
            'price' => ['required', 'numeric', 'min:0'],
            'durationMonths' => ['required', 'integer', 'between:1,12'],
            'isActive' => ['boolean'],
            'orderIndex' => ['nullable', 'integer', 'min:0'],
        ];

        $messages = [
            'name.required' => 'اسم الخطة مطلوب',
            'name.max' => 'اسم الخطة لا يمكن أن يتجاوز 255 حرف',
            'userType.required' => 'نوع المستخدم مطلوب',
            'userType.in' => 'نوع المستخدم غير صحيح',
            'price.required' => 'السعر مطلوب',
            'price.numeric' => 'السعر يجب أن يكون رقماً',
            'price.min' => 'السعر لا يمكن أن يكون سالباً',
            'durationMonths.required' => 'مدة الاشتراك مطلوبة',
            'durationMonths.integer' => 'مدة الاشتراك يجب أن تكون رقماً صحيحاً',
            'durationMonths.between' => 'مدة الاشتراك يجب أن تكون بين 1 و 12 شهراً',
            'orderIndex.integer' => 'ترتيب العرض يجب أن يكون رقماً صحيحاً',
            'orderIndex.min' => 'ترتيب العرض لا يمكن أن يكون سالباً',
        ];

        $data = $request->validate($rules, $messages);

        $data['isActive'] = (bool) ($data['isActive'] ?? true);
        $data['orderIndex'] = (int) ($data['orderIndex'] ?? 0);

        return $data;
    }
}

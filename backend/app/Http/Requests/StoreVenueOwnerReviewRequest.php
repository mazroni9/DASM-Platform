<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVenueOwnerReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'venue_owner_id' => ['required', 'exists:venue_owners,id'],
            'rating' => ['required', 'numeric', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:2000'],
            // ❌ تم حذف 'verified' - لا يجب للمستخدم تحديدها
        ];
    }

    public function messages(): array
    {
        return [
            'venue_owner_id.required' => 'المعرف مطلوب.',
            'venue_owner_id.exists' => 'صاحب المعرض غير موجود.',
            'rating.required' => 'قيمة التقييم مطلوبة.',
            'rating.numeric' => 'قيمة التقييم يجب أن تكون رقمية.',
            'rating.min' => 'التقييم الأدنى هو 1.',
            'rating.max' => 'التقييم الأقصى هو 5.',
        ];
    }
}

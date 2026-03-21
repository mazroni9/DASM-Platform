<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class PlaceBidRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'auction_id' => 'required|integer|exists:auctions,id',
            'bid_amount' => [
                'required',
                'numeric',
                'min:1',
                'max:999999999.99',
                'regex:/^\d+(\.\d{1,2})?$/',
            ],
            'user_id' => 'required|numeric|exists:users,id',
            'client_ts' => 'nullable|string|max:64',
            'client_session_id' => 'nullable|string|max:128',
            'session_location' => 'nullable|array',
            'session_location.permission_state' => 'nullable|string|max:32',
            'session_location.geolocation_source' => 'nullable|string|max:32',
            'session_location.latitude' => 'nullable|numeric',
            'session_location.longitude' => 'nullable|numeric',
            'session_location.accuracy_meters' => 'nullable|numeric',
            'session_location.city' => 'nullable|string|max:191',
            'session_location.region' => 'nullable|string|max:191',
            'session_location.captured_at' => 'nullable|date',
            'session_location.risk_flags' => 'nullable|array',
            'session_location.metadata' => 'nullable|array',
            'session_location.online_status' => 'nullable|string|in:online,offline|max:16',
            'session_location.network_effective_type' => 'nullable|string|max:32',
            'session_location.network_downlink' => 'nullable|numeric|min:0|max:9999.99',
        ];
    }

    public function messages(): array
    {
        return [
            'auction_id.required' => 'معرف المزاد مطلوب',
            'auction_id.exists'   => 'المزاد غير موجود',
            'bid_amount.required' => 'مبلغ المزايدة مطلوب',
            'bid_amount.numeric'  => 'مبلغ المزايدة يجب أن يكون رقماً',
            'bid_amount.min'      => 'مبلغ المزايدة يجب أن يكون أكبر من صفر',
            'bid_amount.max'      => 'مبلغ المزايدة كبير جداً',
            'bid_amount.regex'    => 'تنسيق مبلغ المزايدة غير صحيح',
            'user_id.required'    => 'معرف المستخدم مطلوب',
            'user_id.exists'      => 'المستخدم غير موجود',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'status'  => 'error',
            'message'  => 'بيانات غير صالحة',
            'errors'   => $validator->errors(),
        ], 422));
    }
}

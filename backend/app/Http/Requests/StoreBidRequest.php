<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreBidRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'bid_amount' => [
                'required',
                'numeric',
                'min:1',
                'max:999999999.99',
                'regex:/^\d+(\.\d{1,2})?$/',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'bid_amount.required' => 'مبلغ المزايدة مطلوب',
            'bid_amount.numeric'  => 'مبلغ المزايدة يجب أن يكون رقماً',
            'bid_amount.min'      => 'مبلغ المزايدة يجب أن يكون أكبر من صفر',
            'bid_amount.max'      => 'مبلغ المزايدة كبير جداً',
            'bid_amount.regex'    => 'تنسيق مبلغ المزايدة غير صحيح (حد أقصى خانتان عشريتان)',
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

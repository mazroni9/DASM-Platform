<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckTimeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // public
    }

    public function rules(): array
    {
        return [
            'page' => ['required', 'string', 'in:live_auction,instant_auction,late_auction'],
        ];
    }

    public function messages(): array
    {
        return [
            'page.required' => 'page مطلوب',
            'page.in' => 'page غير صحيح',
        ];
    }
}

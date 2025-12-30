<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SuggestSimilarCarsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // public route
    }

    public function rules(): array
    {
        return [
            'make'       => ['required', 'string', 'max:60'],
            'model'      => ['required', 'string', 'max:80'],
            'year'       => ['required', 'integer', 'min:1950', 'max:2100'],
            'price'      => ['required', 'numeric', 'min:0'],
            'odometer'   => ['nullable', 'integer', 'min:0'],
            'exclude_id' => ['nullable', 'integer', 'min:1'],
            'limit'      => ['nullable', 'integer', 'min:1', 'max:10'],
        ];
    }

    public function messages(): array
    {
        return [
            'make.required'  => 'make مطلوب',
            'model.required' => 'model مطلوب',
            'year.required'  => 'year مطلوب',
            'price.required' => 'price مطلوب',
            'limit.max'      => 'limit أقصى قيمة 10',
        ];
    }
}

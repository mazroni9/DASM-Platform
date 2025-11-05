<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVenueOwnerReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'rating' => ['sometimes', 'numeric', 'min:1', 'max:5'],
            'comment' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'is_approved' => ['sometimes', 'boolean'],
            'verified' => ['sometimes', 'boolean'],
        ];
    }
}

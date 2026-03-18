<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class UpdateUserProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // route already protected (auth:sanctum)
    }

    protected function prepareForValidation(): void
    {
        $email = $this->has('email') ? Str::lower(trim((string) $this->input('email'))) : null;
        $phone = $this->has('phone') ? preg_replace('/\s+/', '', (string) $this->input('phone')) : null;

        $this->merge(array_filter([
            'email' => $email,
            'phone' => $phone,
            'first_name' => $this->has('first_name') ? trim((string) $this->input('first_name')) : null,
            'last_name'  => $this->has('last_name')  ? trim((string) $this->input('last_name'))  : null,
        ], fn ($v) => $v !== null));
    }

    public function rules(): array
    {
        $user = $this->user();

        $rules = [
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name'  => ['sometimes', 'string', 'max:255'],

            // ✅ email مسموح يتغير لكن لو اتغير هنطلب verify من جديد (في الـ Controller)
            'email' => [
                'sometimes',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user?->id),
            ],

            'phone' => [
                'sometimes',
                'string',
                'max:20',
                Rule::unique('users', 'phone')->ignore($user?->id),
            ],

            'area_id' => ['sometimes', 'exists:areas,id'],
        ];

        // Dealer fields (اختياري)
        if ($user && method_exists($user, 'isDealer') && $user->isDealer()) {
            $rules = array_merge($rules, [
                'address'       => ['sometimes', 'nullable', 'string', 'max:255'],
                'company_name'  => ['sometimes', 'nullable', 'string', 'max:255'],
                'trade_license' => ['sometimes', 'nullable', 'string', 'max:255'],
            ]);
        }

        // VenueOwner fields (اختياري)
        if ($user && method_exists($user, 'isVenueOwner') && $user->isVenueOwner()) {
            $rules = array_merge($rules, [
                'venue_name'    => ['sometimes', 'nullable', 'string', 'max:255'],
                'venue_address' => ['sometimes', 'nullable', 'string', 'max:255'],
                'description'   => ['sometimes', 'nullable', 'string', 'max:1000'],
            ]);
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'البريد الإلكتروني مستخدم بالفعل',
            'phone.unique' => 'رقم الهاتف مستخدم بالفعل',
            'area_id.exists' => 'المنطقة غير صالحة',
        ];
    }
}

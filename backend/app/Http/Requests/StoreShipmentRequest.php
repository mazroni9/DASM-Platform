<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreShipmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            // المشتري
            'buyer_id'        => ['required','integer','exists:users,id'],

            // لو أدمن/مشرف، ممكن يحدد مالك المعرض صراحة
            'venue_owner_id'  => ['nullable','integer','exists:venue_owners,id'],

            'recipient_name'  => ['required','string','max:120'],
            'address'         => ['required','string','max:255'],
            'city'            => ['nullable','string','max:120'],
            'region'          => ['nullable','string','max:120'],
            'country'         => ['nullable','string','max:3'],
            'postal_code'     => ['nullable','string','max:20'],

            'carrier_code'    => ['nullable','string','max:30'],
            'tracking_number' => ['nullable','string','max:64'],

            'shipping_status' => ['nullable','integer','min:0','max:3'],
            'payment_status'  => ['nullable','string','max:20'],

            'items'           => ['required','array','min:1'],
            'items.*.name'    => ['required','string','max:160'],
            'items.*.qty'     => ['nullable','integer','min:1','max:100'],
        ];
    }
}

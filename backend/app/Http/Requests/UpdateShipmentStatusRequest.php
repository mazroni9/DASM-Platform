<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateShipmentStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'shipping_status' => ['nullable','integer','min:0','max:3'],
            'tracking_number' => ['nullable','string','max:64'],
            'carrier_code'    => ['nullable','string','max:30'],
            'delivered_at'    => ['nullable','date'],
            'payment_status'  => ['nullable','string','max:20'],
        ];
    }
}

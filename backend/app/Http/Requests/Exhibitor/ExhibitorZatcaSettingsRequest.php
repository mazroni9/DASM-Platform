<?php

namespace App\Http\Requests\Exhibitor;

use Illuminate\Foundation\Http\FormRequest;

class ExhibitorZatcaSettingsRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'environment' => 'required|string|in:local,simulation,production',
            'common_name' => 'required|string',
            'organization_name' => 'required|string',
            'organizational_unit_name' => 'required|string',
            'tax_number' => 'required|string|size:15',
            'business_category' => 'required|string',
            'egs_serial_number' => 'nullable|string',
            'registration_number' => 'required|string|size:10',
            'registered_address' => 'required|string|size:8',
            'street_name' => 'required|string',
            'building_number' => 'required|string|size:4',
            'plot_identification' => 'required|string|size:4',
            'city_sub_division' => 'required|string',
            'postal_number' => 'required|string|size:5',
            'email' => 'required|string',
            'city' => 'required|string',
            'invoice_report_type' => 'required|string|in:0100,1000,1100',
            'report_method' => 'required|string|in:auto,manual',
        ];
    }
}

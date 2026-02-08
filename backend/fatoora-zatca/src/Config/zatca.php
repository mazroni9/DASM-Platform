<?php

use Bl\FatooraZatca\Exemptions\Exempt;
use Bl\FatooraZatca\Exemptions\ZeroRate;
use Bl\FatooraZatca\Exemptions\OutOfScope;
use Bl\FatooraZatca\Classes\TaxCategoryCode;

return [

    /**
     * Zatca Phase 2
     *
     * we will consider some config data for zatca v2 in this file.
     * the mode of zatca app is by default the same as app environment.
     */
    'portals'       => [
        'local'         => env('ZATCA_LOCAL', 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal'),
        'simulation'    => env('ZATCA_SIMULATION', 'https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation'),
        'production'    => env('ZATCA_PRODUCTION', 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core'),
    ],
    'app' => [
        'environment'   => env('ZATCA_ENVIRONMENT', env('APP_ENV', 'local')), # local|simulation|production
        'key'           => env('ZATCA_APP_KEY'),
    ],
    'exemptions' => [
        TaxCategoryCode::ZERO_RATE => [
            'code' => ZeroRate::EXPORT_OF_GOODS,
            'reason' => 'Export of goods',
        ],
        TaxCategoryCode::EXEMPT => [
            'code' => Exempt::MEDICAL_INSURANCE,
            'reason' => 'Financial services mentioned in Article 29 of the VAT Regulations',
        ],
        TaxCategoryCode::OUT_OF_SCOPE => [
            'code' => OutOfScope::DEFAULT_CODE,
            'reason' => 'Exempt',
        ],
    ],

];

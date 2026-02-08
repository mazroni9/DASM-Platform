<?php

namespace Bl\FatooraZatca\Exemptions;

use Bl\FatooraZatca\Traits\Exemption;

class Exempt
{
    use Exemption;
    
    const FINANCIAL_SERVICES = 'VATEX-SA-29';
    const MEDICAL_INSURANCE = 'VATEX-SA-29-7';
    const REAL_ESTATE_TRANSACTIONS = 'VATEX-SA-30';
}

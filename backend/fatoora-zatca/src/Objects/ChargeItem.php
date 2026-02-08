<?php

namespace Bl\FatooraZatca\Objects;

use Bl\FatooraZatca\Classes\TaxCategoryCode;

class ChargeItem
{
    public $charge_reason_code;

    public $charge_reason;

    public $charge_amount;

    public $tax_percent;

    public $tax_category_code;

    public function __construct(
        string  $charge_reason_code,
        string  $charge_reason,
        float   $charge_amount,
        float   $tax_percent = 15,
        string  $tax_category_code = TaxCategoryCode::STANDARD_RATE
    )
    {
        $this->charge_reason_code       = $charge_reason_code;
        $this->charge_reason            = $charge_reason;
        $this->charge_amount            = $charge_amount;
        $this->tax_percent              = $tax_percent;
        $this->tax_category_code        = $tax_category_code;
    }
}

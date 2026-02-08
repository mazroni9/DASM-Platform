<?php

namespace Bl\FatooraZatca\Objects;

use Bl\FatooraZatca\Classes\TaxCategoryCode;

class DiscountItem
{
    public $discount_reason;

    public $discount_amount;

    public $tax_percent;

    public $tax_category_code;

    public function __construct(
        string  $discount_reason,
        float   $discount_amount,
        float   $tax_percent = 15,
        string  $tax_category_code = TaxCategoryCode::STANDARD_RATE
    )
    {
        $this->discount_reason          = $discount_reason;
        $this->discount_amount          = $discount_amount;
        $this->tax_percent              = $tax_percent;
        $this->tax_category_code        = $tax_category_code;
    }
}

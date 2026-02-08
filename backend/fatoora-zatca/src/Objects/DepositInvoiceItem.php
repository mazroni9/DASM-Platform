<?php

namespace Bl\FatooraZatca\Objects;

use Bl\FatooraZatca\Classes\InvoiceType;
use Bl\FatooraZatca\Classes\TaxCategoryCode;

class DepositInvoiceItem
{
    public $id;

    /**
     * the serial number of invoice.
     *
     * @var string
     */
    public $invoice_number;

    /**
     * invoice date in Y-m-d format.
     *
     * @var mixed
     */
    public $invoice_date;

    /**
     * invoice time in H:i:s format
     *
     * @var mixed
     */
    public $invoice_time;

    public $description;

    public $price;

    public $tax;

    public $discount;

    public function __construct(
        int     $id,
        string  $invoice_number,
        string  $invoice_date,
        string  $invoice_time,
        string  $description,
        float   $price,
        float   $tax
    )
    {
        $this->id                       = $id;
        $this->invoice_number           = $invoice_number;
        $this->invoice_date             = $invoice_date;
        $this->invoice_time             = $invoice_time;
        $this->description              = $description;
        $this->price                    = $price;
        $this->tax                      = $tax;
        $this->discount                 = 0;
    }
}

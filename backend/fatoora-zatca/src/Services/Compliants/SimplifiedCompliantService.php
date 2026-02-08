<?php

namespace Bl\FatooraZatca\Services\Compliants;

use Bl\FatooraZatca\Objects\Setting;

class SimplifiedCompliantService
{
    public static function verify(Setting $setting, $privateKey, $certificate, $secret)
    {
        $seller  = new \Bl\FatooraZatca\Objects\Seller(
            $setting->registrationNumber, 'Al Sahafa Street Riyadh', '1234', '1234', 'Financial District', 'Riyadh', '12643',
            $setting->taxNumber, $setting->organizationName, $privateKey, $certificate, $secret
        );

        $invoiceType = \Bl\FatooraZatca\Classes\InvoiceType::TAX_INVOICE;
        $paymentType = \Bl\FatooraZatca\Classes\PaymentType::CASH;

        $invoiceItems = [
            new \Bl\FatooraZatca\Objects\InvoiceItem(1, 'Compliance Product', 1, 50, 0, 7.5, 15, 57.5),
        ];

        $invoice = new \Bl\FatooraZatca\Objects\Invoice(
            1, 'INV100', '42156fac-991b-4a12-a6f0-54c024edd29e', date('Y-m-d'), date('H:i:s'),
            $invoiceType, $paymentType, 50, [], 7.5, 57.5, $invoiceItems
        );

        return \Bl\FatooraZatca\Zatca::reportSimplifiedInvoiceCompliance($seller, $invoice);
    }
}

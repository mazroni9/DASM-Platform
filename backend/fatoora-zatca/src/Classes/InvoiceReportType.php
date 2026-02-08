<?php

namespace Bl\FatooraZatca\Classes;

class InvoiceReportType
{
    const SIMPLIFIED    = '0100';
    const STANDARD      = '1000';
    const BOTH          = '1100';

    /**
     * check the invoice if standard or both.
     *
     * @param  \Bl\FatooraZatca\Classes\InvoiceReportType $invoiceType
     * @return bool
     */
    public static function isStandard($invoiceType): bool
    {
        return in_array($invoiceType, [self::STANDARD, self::BOTH]);
    }

    /**
     * check the invoice if simplified or both.
     *
     * @param  \Bl\FatooraZatca\Classes\InvoiceReportType $invoiceType
     * @return bool
     */
    public static function isSimplified($invoiceType): bool
    {
        return in_array($invoiceType, [self::SIMPLIFIED, self::BOTH]);
    }
}

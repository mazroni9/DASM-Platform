<?php

namespace Bl\FatooraZatca\Objects;

use Bl\FatooraZatca\Classes\InvoiceReportType;
use Bl\FatooraZatca\Helpers\EgsSerialNumber;

/**
 * @param string $otp One-Time Password (OTP) used for certificate issuance or ZATCA API authentication.
 * @param string $emailAddress The official email address associated with the organization (used for certificate and correspondence).
 * @param string $commonName The common name (CN) used in the digital certificate, usually formatted as `TST-{OTP}-{VATNumber}` for test environments.
 * @param string $organizationalUnitName The name of the branch or department within the organization (e.g., "Riyadh Branch").
 * @param string $organizationName The legal name of the business or organization as registered in official records.
 * @param string $taxNumber The VAT number (or TIN) assigned to the business, used for ZATCA e-invoicing.
 * @param string $registeredAddress The address or identifier of the registered location (can be a CR number, building number, etc.).
 * @param string $businessCategory Description of the nature of the business activities (e.g., "Supply activities").
 * @param string|null $egsSerialNumber (Optional) The serial number(s) of the Electronic Generation System (EGS) used, pipe-separated for multiple (e.g., "1-TST|2-TST").
 * @param string $registrationNumber The registration or commercial number of the organization (e.g., CR or ZATCA-issued ID).
 * @param string $invoiceType Type of invoices to generate. Use constants from `InvoiceReportType` (e.g., `InvoiceReportType::BOTH`, `::BASIC`, `::SIMPLIFIED`). Defaults to `BOTH`.
 * @param string $countryName Country code where the business is located, using ISO 3166-1 alpha-2 format (e.g., "SA" for Saudi Arabia). Defaults to `'SA'`.
 */

 class Setting
{
    public $otp;

    public $emailAddress;

    public $commonName;

    public $organizationalUnitName;

    public $organizationName;

    public $taxNumber;

    public $registeredAddress;

    public $businessCategory;

    public $egsSerialNumber;

    public $registrationNumber;

    /**
     * the invoice type
     * 0100 for Simplified Tax Invoice|Simplified Debit Note|Simplified Credit Note
     * 1000 for Standard Tax Invoice|Standard Debit Note|Standard Credit Note.
     * 1100 for all six sample invoices.
     *
     * @var \Bl\FatooraZatca\Classes\InvoiceReportType
     */
    public $invoiceType;

    /**
     * the country is default SA.
     *
     * @var string
     */
    public $countryName;

    public function __construct(
        string $otp,
        string $emailAddress,
        string $commonName,
        string $organizationalUnitName,
        string $organizationName,
        string $taxNumber,
        string $registeredAddress,
        string $businessCategory,
        string $egsSerialNumber = NULL,
        string $registrationNumber,
        string $invoiceType = InvoiceReportType::BOTH,
        string $countryName = 'SA'
    )
    {
        $this->otp                          = $otp;
        $this->emailAddress                 = $emailAddress;
        $this->commonName                   = $commonName;
        $this->organizationalUnitName       = $organizationalUnitName;
        $this->organizationName             = $organizationName;
        $this->taxNumber                    = $taxNumber;
        $this->registeredAddress            = $registeredAddress;
        $this->businessCategory             = $businessCategory;
        $this->egsSerialNumber              = $egsSerialNumber ?? EgsSerialNumber::generate();
        $this->registrationNumber           = $registrationNumber;
        $this->invoiceType                  = $invoiceType;
        $this->countryName                  = $countryName;
    }
}

<?php

namespace Bl\FatooraZatca\Invoices;

use Bl\FatooraZatca\Actions\GetQrFromInvoice;

class Invoiceable
{
    private $result;

    public function setResult($result): void
    {
        $this->result = $result;
    }

    public function getResult(): array
    {
        return $this->result;
    }

    public function getClearedInvoice(): string
    {
        return $this->getResult()['clearedInvoice'];
    }

    public function getXmlInvoice(): string
    {
        return base64_decode($this->getClearedInvoice());
    }

    public function getInvoiceHash(): string
    {
        return $this->getResult()['invoiceHash'];
    }

    public function getReportingStatus(): string
    {
        return $this->getResult()['reportingStatus'];
    }

    public function getValidationResults(): array
    {
        return (array) $this->getResult()['validationResults'];
    }

    public function getInfoMessages(): array
    {
        return $this->getValidationResults()['infoMessages'];
    }

    public function getWarningMessages(): array
    {
        return $this->getValidationResults()['warningMessages'];
    }

    public function hasWarningMessages(): bool
    {
        return count($this->getWarningMessages()) > 0;
    }

    public function getErrorMessages(): array
    {
        return $this->getValidationResults()['errorMessages'];
    }

    public function getValidationResultStatus(): string
    {
        return $this->getValidationResults()['status'];
    }

    public function getQr(): string
    {
        return (new GetQrFromInvoice)->handle($this->getClearedInvoice());
    }

    public function getQrImage($size = 300): string
    {
        return \SimpleSoftwareIO\QrCode\Facades\QrCode::size($size)->generate($this->getQr())->toHtml();
    }

    public function getQrImageNatively(): string
    {
        return \Endroid\QrCode\Builder\Builder::create()
        ->writer(new \Endroid\QrCode\Writer\PngWriter())
        ->writerOptions([])
        ->data($this->getQr())
        ->encoding(new \Endroid\QrCode\Encoding\Encoding('UTF-8'))
        ->errorCorrectionLevel(new \Endroid\QrCode\ErrorCorrectionLevel\ErrorCorrectionLevelLow)
        ->size(150)
        ->margin(0)
        ->roundBlockSizeMode(new \Endroid\QrCode\RoundBlockSizeMode\RoundBlockSizeModeNone)
        ->build()
        ->getDataUri();
    }

    public function getQrImageNativelyDeprecated(): string
    {
        // Create a basic QR code
        $qrCode = new \Endroid\QrCode\QrCode($this->getQr());
        $qrCode->setSize(150);
        return "data:" . $qrCode->getContentType() . ";base64,". base64_encode($qrCode->writeString());
    }
}

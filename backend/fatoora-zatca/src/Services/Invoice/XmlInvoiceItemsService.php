<?php

namespace Bl\FatooraZatca\Services\Invoice;

use Bl\FatooraZatca\Actions\GetXmlFileAction;
use Bl\FatooraZatca\Helpers\InvoiceHelper;
use Bl\FatooraZatca\Objects\DepositInvoiceItem;
use Bl\FatooraZatca\Objects\InvoiceItem;
use Bl\FatooraZatca\Transformers\PriceFormat;

class XmlInvoiceItemsService
{
    /**
     * the invoice data.
     *
     * @var object
     */
    protected $invoice;

    /**
     * the invoice items.
     *
     * @var array
     */
    protected $invoiceItems;

    /**
     * __construct
     *
     * @param  object $invoice
     * @return void
     */
    public function __construct(object $invoice)
    {
        $this->invoice      = $invoice;

        $this->invoiceItems = array_values($invoice->invoice_items);
    }

    /**
     * generate the xml of invoice items.
     *
     * @param  string $invoice_content
     * @return void
     */
    public function generate(string &$invoice_content): void
    {
        $invoice_content = str_replace('SET_ALLOWANCE_CHARGE', $this->getInvoiceAllowanceCharge(), $invoice_content);

        $invoice_content = str_replace('SET_CHARGES', $this->getInvoiceCharges(), $invoice_content);

        $invoice_content = str_replace('SET_TAX_TOTALS', $this->getTaxTotalXmlContent(), $invoice_content);

        // ? total tax of invoice itself.
        $invoice_content = str_replace(
            'TOTAL_TAX_AMOUNT',
            PriceFormat::transform($this->invoice->tax),
            $invoice_content
        );

        // <cac:LegalMonetaryTotal>
        $totalLinesDiscount = InvoiceHelper::getArrayKeySum($this->invoice->invoice_items, 'discount');
        $invoice_content = str_replace(
            'SET_EXTENSION_AMOUNT',
            PriceFormat::transform($this->invoice->price - $totalLinesDiscount),
            $invoice_content
        );
        $invoice_content = str_replace(
            'SET_TAX_EXCLUSIVE_AMOUNT',
            PriceFormat::transform($this->invoice->total - $this->invoice->tax),
            $invoice_content
        );
        $invoice_content = str_replace(
            'SET_INCLUSIVE_AMOUNT',
            PriceFormat::transform($this->invoice->total),
            $invoice_content
        );
        
        $invoice_content = str_replace(
            'SET_ALLOWANCE_TOTAL_AMOUNT',
            PriceFormat::transform(
                InvoiceHelper::getArrayKeySum($this->invoice->discount_items, 'discount_amount')
            ),
            $invoice_content
        );

        $invoice_content = str_replace(
            'SET_CHARGE_TOTAL_AMOUNT',
            PriceFormat::transform(
                InvoiceHelper::getArrayKeySum($this->invoice->charge_items, 'charge_amount')
            ),
            $invoice_content
        );

        $invoice_content = str_replace(
            'SET_PREPAID_AMOUNT',
            PriceFormat::transform($this->invoice->prepaid_amount),
            $invoice_content
        );
        $invoice_content = str_replace(
            'SET_PAYABLE_ROUNDING_AMOUNT',
            PriceFormat::transform($this->invoice->rounding_amount),
            $invoice_content
        );
        $invoice_content = str_replace(
            'SET_PAYABLE_AMOUNT',
            PriceFormat::transform($this->invoice->total + $this->invoice->rounding_amount - $this->invoice->prepaid_amount),
            $invoice_content
        );

        $invoice_content = str_replace('SET_INVOICE_LINES', $this->getInvoiceLinesXmlContent(), $invoice_content);

        // dd($invoice_content);
    }

    /**
     * get the tax total xml content.
     *
     * @return string
     */
    protected function getTaxTotalXmlContent(): string
    {
        $xml = GetXmlFileAction::handle('xml_tax_totals');

        $totalTax = PriceFormat::transform($this->invoice->tax);

        $xml = str_replace("SET_TAX_AMOUNT", $totalTax, $xml);

        $xml = str_replace("SET_TAX_LINES", $this->getTaxSubtotalXmlContent(), $xml);

        return $xml;
    }

    /**
     * get the tax subtotal items xml content.
     *
     * @return string
     */
    protected function getTaxSubtotalXmlContent(): string
    {
        $taxSubtotalXml = '';

        foreach(InvoiceHelper::getTaxSubTotalGroups($this->invoiceItems) as $group) {

            $taxSubtotalXmlItem = GetXmlFileAction::handle('xml_tax_line');

            // filter discount items against the same tax category code...
            $discountables = array_filter(
                $this->invoice->discount_items,
                function($i) use ($group) {return $i->tax_category_code === $group['tax_category_code'] && $i->tax_percent == $group['tax_percentage'];}
            );
            $discountables = array_values($discountables);

            // filter charge items against the same tax category code...
            $charges = array_filter(
                $this->invoice->charge_items,
                function($i) use ($group) {return $i->tax_category_code === $group['tax_category_code'] && $i->tax_percent == $group['tax_percentage'];}
            );
            $charges = array_values($charges);

            // when discount item exists subtract the discount amount from the sub total...
            if(! empty($discountables)) {
                $listItemsSubTotal = InvoiceHelper::getArrayKeySum($group['list_items'], 'sub_total');
                $totalDiscountAmount = InvoiceHelper::getArrayKeySum($discountables, 'discount_amount');
                $subTotal = $listItemsSubTotal - $totalDiscountAmount;
                $taxAmount = $subTotal * ($discountables[0]->tax_percent / 100);
            }
            else {
                $subTotal = InvoiceHelper::getArrayKeySum($group['list_items'], 'sub_total');
                $taxAmount = InvoiceHelper::getArrayKeySum($group['list_items'], 'tax');
            }

            // add charges if exists to subtotal & tax...
            if(! empty($charges)) {
                $chargeSubTotal  = InvoiceHelper::getArrayKeySum($charges, 'charge_amount');
                $chargeTaxAmount = $chargeSubTotal * ($charges[0]->tax_percent / 100); 
                $subTotal += $chargeSubTotal;
                $taxAmount += $chargeTaxAmount;
            }


            $taxSubtotalXmlItem = str_replace(
                'INVOICE_TAXABLE_AMOUNT',
                PriceFormat::transform($subTotal),
                $taxSubtotalXmlItem
            );

            $taxSubtotalXmlItem = str_replace(
                'INVOICE_TOTAL_TAX',
                PriceFormat::transform($taxAmount),
                $taxSubtotalXmlItem
            );

            $taxSubtotalXmlItem = str_replace(
                'INVOICE_TAX_CODE',
                $group['tax_category_code'],
                $taxSubtotalXmlItem
            );

            $taxSubtotalXmlItem = str_replace(
                'INVOICE_TAX_PERCENT',
                PriceFormat::transform(
                    $group['tax_percentage']
                ),
                $taxSubtotalXmlItem
            );

            $exemptionReasonAndCodeXml = '';

            // add reason and code for exemption tax category...
            if(InvoiceHelper::isExemptTaxCategoryCode($group['tax_category_code'])) {

                $exemptionCode = $group['tax_exemption_code'];
                $exemptionReason = $group['tax_exemption_reason'];

                $exemptionReasonAndCodeXml = "\n" . GetXmlFileAction::handle('xml_tax_exemption_reason');

                $exemptionReasonAndCodeXml = str_replace(
                    'INVOICE_TAX_EXEMPTION_REASON_CODE',
                    htmlspecialchars($exemptionCode, ENT_XML1, 'UTF-8'),
                    $exemptionReasonAndCodeXml
                );

                $exemptionReasonAndCodeXml = str_replace(
                    'INVOICE_TAX_EXEMPTION_REASON',
                    htmlspecialchars($exemptionReason, ENT_XML1, 'UTF-8'),
                    $exemptionReasonAndCodeXml
                );

            }

            $taxSubtotalXmlItem = str_replace(
                'SET_EXEMPTION_REASON_AND_CODE',
                $exemptionReasonAndCodeXml,
                $taxSubtotalXmlItem
            );

            $taxSubtotalXml .= $taxSubtotalXmlItem;

            $taxSubtotalXml .= "\n";
        }

        $taxSubtotalXml = rtrim($taxSubtotalXml, "\n");

        return $taxSubtotalXml;
    }

    /**
     * get the invoice lines xml content.
     *
     * @return string
     */
    protected function getInvoiceLinesXmlContent(): string
    {
        $invoiceLineXml = '';

        foreach($this->invoiceItems as $index => $item) {

            $xml = $item instanceof InvoiceItem
            ? $this->getInvoiceLineXmlContent($item, $index)
            : $this->getDepositInvoiceLineXmlContent($item);

            $invoiceLineXml .= $xml;

        }

        $invoiceLineXml = rtrim($invoiceLineXml, '\n');

        return $invoiceLineXml;
    }
    
    /**
     * get the invoice line for InvoiceItem class.
     *
     * @param  InvoiceItem $item
     * @param  int $index
     * @return string
     */
    protected function getInvoiceLineXmlContent($item, $index)
    {
        $xml = GetXmlFileAction::handle('xml_line_item');

        $xml = str_replace('ITEM_ID', $item->id, $xml);

        $xml = str_replace('ITEM_QTY', $item->quantity, $xml);

        $xml = str_replace('UNIT_CODE', $item->unit_code, $xml);

        $itemNetPrice = ($item->price - $item->discount) / $item->quantity;

        $xml = str_replace('ITEM_NET_PRICE', PriceFormat::transform($itemNetPrice), $xml);

        $xml = str_replace('ITEM_NAME', htmlspecialchars(preg_replace('/[\r\n\t]+/', ' ', $item->product_name), ENT_XML1, 'UTF-8'), $xml);

        $xml = str_replace('ITEM_NET_AMOUNT', PriceFormat::transform($item->sub_total), $xml);

        $xml = str_replace('ITEM_TOTAL_TAX', PriceFormat::transform($item->tax), $xml);

        $xml = str_replace('ITEM_TOTAL_INCLUDE_TAX', PriceFormat::transform($item->total), $xml);

        $isLastItem = $index == count($this->invoiceItems);

        $xml = str_replace(
            'ITEM_TAX_CATEGORY',
            $this->getClassifiedTaxCategoryXmlContent($item, $isLastItem),
            $xml
        );
        $xml = str_replace(
            'ITEM_DISCOUNT',
            $this->getItemAllowanceCharge($item, $isLastItem),
            $xml
        );

        return $xml;
    }

    /**
     * get the invoice line for DepositInvoiceItem class.
     *
     * @param  DepositInvoiceItem $item
     * @return string
     */
    protected function getDepositInvoiceLineXmlContent($item)
    {
        $xml = GetXmlFileAction::handle('xml_deposit_line_item');

        $xml = str_replace('ITEM_ID', $item->id, $xml);

        $xml = str_replace('SET_INVOICE_SERIAL_NUMBER', htmlspecialchars($item->invoice_number, ENT_XML1, 'UTF-8'), $xml);
        
        $xml = str_replace('SET_ISSUE_DATE', $item->invoice_date, $xml);

        $xml = str_replace('SET_ISSUE_TIME', $item->invoice_time, $xml);
        
        $xml = str_replace('SET_TAXABLE_AMOUNT', PriceFormat::transform($item->price), $xml);

        $xml = str_replace('SET_TAX_AMOUNT', PriceFormat::transform($item->tax), $xml);

        $xml = str_replace('ITEM_NAME', htmlspecialchars($item->description, ENT_XML1, 'UTF-8'), $xml);

        return $xml;
    }

    /**
     * get the classified tax category xml content.
     *
     * @param  \Bl\FatooraZatca\Objects\InvoiceItem    $item
     * @param  bool     $new_line
     * @return string
     */
    protected function getClassifiedTaxCategoryXmlContent(InvoiceItem $item, bool $new_line): string
    {
        $xml = GetXmlFileAction::handle('xml_line_item_tax_category');

        $xml = str_replace(
            'TAX_CATEGORY_ID',
            $item->tax_category_code,
            $xml
        );

        $xml = str_replace(
            'PERCENT_VALUE',
            PriceFormat::transform($item->tax_percent),
            $xml
        );

        $xml .= $new_line ? '\n' : '';

        return $xml;
    }

    /**
     * get the discount items xml content.
     *
     * @param  \Bl\FatooraZatca\Objects\InvoiceItem    $item
     * @param  bool     $new_line
     * @return string
     */
    protected function getItemAllowanceCharge(InvoiceItem $item, bool $new_line): string
    {
            $xml = GetXmlFileAction::handle('xml_line_item_discount');

            $discountReason = '';
            if($item->discount > 0) {
                $discountReason = ! empty($item->discount_reason)
                ? htmlspecialchars($item->discount_reason, ENT_XML1, 'UTF-8')
                : 'Discount on goods or services';
            }

            $xml  = str_replace(
                'ITEM_DISCOUNT_REASON',
                $discountReason,
                $xml
            );

            $xml = str_replace(
                'ITEM_DISCOUNT_VALUE',
                PriceFormat::transform($item->discount),
                $xml
            );

            $xml .= $new_line ? '\n' : '';

        return $xml;
    }

    protected function getInvoiceAllowanceCharge(): string 
    {
        if(empty($this->invoice->discount_items)) {
            return '';
        }

        $invoiceAllowanceChargeXml = '';

        foreach($this->invoice->discount_items as $discountItem) {
            $xml = GetXmlFileAction::handle('xml_invoice_discount');

            $xml = str_replace(
                'SET_DISCOUNT_REASON', 
                $discountItem->discount_reason, 
                $xml
            );

            $xml = str_replace(
                'SET_DISCOUNT_AMOUNT', 
                PriceFormat::transform($discountItem->discount_amount), 
                $xml
            );

            $xml = str_replace(
                'SET_TAX_CATEGORY_CODE', 
                $discountItem->tax_category_code, 
                $xml
            );

            $xml = str_replace(
                'SET_TAX_PERCENTAGE', 
                PriceFormat::transform($discountItem->tax_percent), 
                $xml
            );

            $invoiceAllowanceChargeXml .= $xml;

            $invoiceAllowanceChargeXml .= "\n";
        }

        $invoiceAllowanceChargeXml = rtrim($invoiceAllowanceChargeXml, "\n");

        return  $invoiceAllowanceChargeXml;
    }

    protected function getInvoiceCharges(): string 
    {
        if(empty($this->invoice->charge_items)) {
            return '';
        }

        $invoiceChargesXml = '';

        foreach($this->invoice->charge_items as $chargeItem) {
            $xml = GetXmlFileAction::handle('xml_invoice_charge');

            $xml = str_replace(
                'SET_CHARGE_REASON_CODE', 
                $chargeItem->charge_reason_code, 
                $xml
            );

            $xml = str_replace(
                'SET_CHARGE_REASON', 
                $chargeItem->charge_reason, 
                $xml
            );

            $xml = str_replace(
                'SET_CHARGE_AMOUNT', 
                PriceFormat::transform($chargeItem->charge_amount), 
                $xml
            );

            $xml = str_replace(
                'SET_TAX_CATEGORY_CODE', 
                $chargeItem->tax_category_code, 
                $xml
            );

            $xml = str_replace(
                'SET_TAX_PERCENTAGE', 
                PriceFormat::transform($chargeItem->tax_percent), 
                $xml
            );

            $invoiceChargesXml .= $xml;

            $invoiceChargesXml .= "\n";
        }

        $invoiceChargesXml = rtrim($invoiceChargesXml, "\n");

        return  $invoiceChargesXml;
    }
}

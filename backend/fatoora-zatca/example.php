<?php 

// you need to add this code within your controller.

use Bl\FatooraZatca\Objects\Setting;
use Bl\FatooraZatca\Objects\Seller;
use Bl\FatooraZatca\Objects\Invoice;
use Bl\FatooraZatca\Objects\InvoiceItem;
use Bl\FatooraZatca\Objects\Client;
use Bl\FatooraZatca\Classes\InvoiceType;
use Bl\FatooraZatca\Classes\PaymentType;
use Bl\FatooraZatca\Invoices\B2C;
use Bl\FatooraZatca\Invoices\B2B;
use Bl\FatooraZatca\Zatca;

// Step 1: Setup the main ZATCA Settings
$settings = new Setting(
    123456,
    'Support@fatoorazatca.com',
    'TST-886431145-399999999900003',
    'Riyadh Branch',
    'Maximum Speed Tech Supply LTD',
    '399999999900003',
    'RRRD2929',
    'Supply activities',
    '1-TST|2-TST|3-ed22f1d8-e6a2-1118-9b58-d9a8f11e445f',
    '2252039485'
);

// Step 2: Generate ZATCA Credentials
$result = Zatca::generateZatcaSetting($settings);

// Save credentials from result
// Setting::update(['zatca_settings' => json_encode($result)]);

// Read credentials from database
// $result = json_decode(Setting::value('zatca_settings'));
$privateKey  = $result->private_key;
$certificate = $result->cert_production;
$secret      = $result->secret_production;

// Step 3: Prepare Seller Info
$seller = new Seller(
    $settings->registrationNumber,
    'King Abdulaziz Road',
    '1234',
    '1234',
    'Assuwayriqiyah',
    'Riyadh',
    '12643',
    $settings->taxNumber,
    $settings->organizationName,
    $privateKey,
    $certificate,
    $secret
);

// Step 4: Create Invoice Items
$invoiceItems = [
    new InvoiceItem(
        1,
        'Product A',
        1,
        100,
        0,
        15,
        15,
        115
    )
];


// Step 5: Build Invoice Object
$invoice = new Invoice(
    1,
    'INV100',
    '42156fac-991b-4a12-a6f0-54c024edd29e',
    date('Y-m-d'),
    date('H:i:s'),
    InvoiceType::TAX_INVOICE,
    PaymentType::CASH,
    100,
    [],
    15,
    115,
    $invoiceItems,
    // Setting::value('zatca_invoice_hash')
);

// Step 6: Generate B2C Invoice
$b2c = B2C::make($seller, $invoice)->report();

// Save B2C Result
// save_to_invoice(json_encode($b2c->getResult())); 
// or you can use our \Bl\FatooraZatca\Casts\ZatcaCast to save it directly in your model.

// Step 7: (Optional) Generate B2B Invoice
$client = new Client(
    'Salon X',
    '300385711800003',
    '12345',
    'King Abdulaziz Road',
    'C23',
    '1234',
    '123',
    'Riyadh'
);

$b2b = B2B::make($seller, $invoice, $client)->report();

// Save B2B Result
// save_to_invoice(json_encode($b2b->getResult()));
// or you can use our \Bl\FatooraZatca\Casts\ZatcaCast to save it directly in your model.

// Step 8: Save invoice hash
// Setting::update(['zatca_invoice_hash' => $b2c->getInvoiceHash()]);
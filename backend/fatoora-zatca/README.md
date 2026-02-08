# Fatoora ZATCA V1.0

This package handles Phase 2 compliance of the Zakat, Tax and Customs Authority (ZATCA) in Saudi Arabia.  
Built with native PHP, it works seamlessly with any PHP system or framework, including Laravel, Symfony, CodeIgniter, Yii, Zend Framework, CakePHP, and more.

---

## Supported Environments
- `local`
- `simulation`
- `production`

---

## Installation

1. Install **phpseclib v3** via Composer:
    ```bash
    composer require phpseclib/phpseclib:~3.0
    ```

2. (Optional) Install **Simple QR Code** package for QR code generation:
    ```bash
    composer require simplesoftwareio/simple-qrcode
    ```

3. Extract the package into your project root directory.

4. Open `composer.json`, locate the `autoload` section, and add the following under `psr-4`:
    ```json
    "Bl\\FatooraZatca\\": "fatoora-zatca/src/"
    ```

5. Run the following to regenerate the Composer autoloader:
    ```bash
    composer dump-autoload
    ```

---

## Configuration

1. Register the service provider by adding it to the `providers` array in your `config/app.php`:
    ```php
    'providers' => [
        // Other providers...
        Bl\FatooraZatca\FatooraZatcaServiceProvider::class,
    ],
    ```

2. Publish the package config file:
    ```bash
    php artisan vendor:publish --tag=fatoora-zatca
    ```
    > **Note:** If publishing does not work, manually copy  
    > `fatoora-zatca/src/Config/zatca.php` to your project’s `config` directory.

---

## Environment Variables

Add these to your `.env` file:

```
ZATCA_ENVIRONMENT=local   # Options: local | simulation | production
ZATCA_APP_KEY="1eb9b1937955b9ac4d24e0e0c25f7a9d0d62045a8daa043dd73f60c5f2645074"
```

### 🔧 Generate ZATCA Credentials
Before authenticating with ZATCA, generate your credentials:
```
use Bl\FatooraZatca\Objects\Setting;
use Bl\FatooraZatca\Zatca;

// 1. Create and configure settings
$settings = new Setting();
// Fill in the required properties of $settings

// 2. Generate ZATCA credentials
$result = Zatca::generateZatcaSetting($settings);

// 3. Save the $result (JSON or as needed) to your database for future use
save_to_settings(json_encode($result));
```

### 🧾 Prepare Invoice Data
📄 Supported Invoice Types:
Use constants from:
```
\Bl\FatooraZatca\Classes\InvoiceType
// Options: TAX_INVOICE | PREPAID_INVOICE | DEBIT_NOTE | CREDIT_NOTE
```
💳 Supported Payment Types:
Use constants from:
```
\Bl\FatooraZatca\Classes\PaymentType
// Options: CASH | CREDIT | BANK_ACCOUNT | BANK_CARD | MULTIPLE
```

✅ Required Instances:
- $seller — instance of \Bl\FatooraZatca\Objects\Seller::class
- $invoice — instance of \Bl\FatooraZatca\Objects\Invoice::class
- $client — instance of \Bl\FatooraZatca\Objects\Client::class (required for B2B only)

### 🏢 B2B (Business to Business) Invoice
Use when issuing tax invoices that include client details:
```
$invoice = \Bl\FatooraZatca\Invoices\B2B::make($seller, $invoice, $client)->report();
```

### 🛍️ B2C (Business to Consumer) Invoice
Use when issuing invoices for end consumers (client details optional):
- To generate and report:
    ```
    $invoice = \Bl\FatooraZatca\Invoices\B2C::make($seller, $invoice)->report();
    ```
- Or just to calculate without reporting:
    ```
    $invoice = \Bl\FatooraZatca\Invoices\B2C::make($seller, $invoice)->calculate();
    ```
### 📤 Access Invoice Response Data
Once the invoice is processed, you can retrieve various parts of the response using the following methods on the $invoice object:
| Method                                   | Description                                                    |
| ---------------------------------------- | -------------------------------------------------------------- |
| `$invoice->getQr();`                     | Returns the QR code text (Base64-encoded).                     |
| `$invoice->getQrImage();`                | Returns the QR code image (Base64-encoded PNG).                |
| `$invoice->getInvoiceHash();`            | Returns the invoice hash (used for verification).              |
| `$invoice->getClearedInvoice();`         | Returns the cleared invoice in Base64 format.                  |
| `$invoice->getXmlInvoice();`             | Returns the full XML format of the invoice.                    |
| `$invoice->getReportingStatus();`        | Returns the clearance/reporting status from ZATCA.             |
| `$invoice->getValidationResultStatus();` | Returns the overall validation status (e.g., SUCCESS, FAILED). |
| `$invoice->getValidationResults();`      | Returns all validation messages (info, warning, error).        |
| `$invoice->getInfoMessages();`           | Returns only informational messages.                           |
| `$invoice->getWarningMessages();`        | Returns only warning messages.                                 |
| `$invoice->getErrorMessages();`          | Returns only error messages.                                   |
| `$invoice->hasWarningMessages();`        | Returns `true` if there are warning messages.                  |
| `$invoice->getResult();`                 | Returns an array containing all the above response data.       |

## Licensing & Ownership

All files, scripts, and assets included in this package were either:

- Created by [AbdelrahmanBl/Fatoora-Zatca]
- Sourced from properly licensed open-source libraries

No third-party assets that violate Envato’s license policy are included.

If any third-party libraries are used, they are listed below with their respective licenses:

- `guzzlehttp/guzzle` – MIT License – https://github.com/guzzle/guzzle
- `endroid/qr-code` – MIT License – https://github.com/endroid/qr-code

You may use this package in accordance with the Envato Regular or Extended License depending on your purchase.


> **_Note:_** If you have any questions feel free to contact me on WhatsApp: [📱WhatsApp](https://wa.me/201270115241) or [ 📧 abdelrahmangamal990@gmail.com](mailto:abdelrahmangamal990@gmail.com).

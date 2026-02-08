# Changelog

All notable changes to this project will be documented in this file.

## [1.0] - 2025-05-26

### Added
- Full support for ZATCA Phase 2 E-Invoicing integration.
- Environment configuration support (`local`, `simulation`, `production`).
- QR code generation (text + image) in Base64 format.
- Invoice clearance and reporting through B2B and B2C modes.
- Support for multiple invoice types:
  - TAX_INVOICE
  - PREPAID_INVOICE
  - DEBIT_NOTE
  - CREDIT_NOTE
- Support for multiple payment types:
  - CASH
  - CREDIT
  - BANK_ACCOUNT
  - BANK_CARD
  - MULTIPLE
- Ability to generate ZATCA credentials via `generateZatcaSetting`.
- Config file publishing via `php artisan vendor:publish`.
- Full Laravel service provider support.
- Class autoloading via Composer PSR-4.
- Response access helpers:
  - `getQr`, `getQrImage`, `getInvoiceHash`, `getXmlInvoice`, etc.
  - `getInfoMessages`, `getWarningMessages`, `getErrorMessages`, `hasWarningMessages`.

### Improved
- Developer-friendly structure using native PHP (no Laravel dependency required).
- Modular design compatible with other PHP frameworks (CodeIgniter, Yii, Symfony, etc.).

---
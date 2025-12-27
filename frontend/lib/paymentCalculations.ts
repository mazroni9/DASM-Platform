/**
 * DASM Dual-Page Model - Payment Calculations
 *
 * This utility handles all fee calculations for the checkout process.
 * Following the 600 SAR fixed admin fee rule.
 */

// Constants
export const FIXED_ADMIN_FEE = 600.0;
export const VAT_RATE = 0.15;
export const GATEWAY_FEE_RATE = 0.022;
export const GATEWAY_FEE_FIXED = 1;

// DASM Escrow Bank Details
export const BANK_DETAILS = {
  iban: "SA0380000000608010167519",
  bankName: "Riyad Bank",
  accountName: "DASM للمزادات الرقمية",
} as const;

/**
 * Service fees breakdown for Step 1 (Online Payment)
 */
export interface ServiceFeesBreakdown {
  commission: number;
  commissionVat: number;
  adminFee: number;
  subtotal: number;
  gatewayFee: number;
  gatewayFeeVat: number;
  total: number;
}

/**
 * Bank transfer details for Step 2 (Offline Transfer)
 */
export interface BankTransferDetails {
  amount: number;
  iban: string;
  bankName: string;
  accountName: string;
  verificationCode: string;
}

/**
 * Complete checkout data structure from API
 */
export interface CheckoutData {
  carPrice: number;
  serviceFees: ServiceFeesBreakdown;
  bankTransfer: BankTransferDetails;
  verificationCode: string;
}

/**
 * Calculate service fees for online payment (Step 1)
 *
 * Formula:
 * - Commission from tiers
 * - Commission VAT = Commission * 15%
 * - Admin Fee = 600 SAR (fixed)
 * - Subtotal = Commission + VAT + Admin Fee
 * - Gateway Fee = (Subtotal * 2.2%) + 1 SAR
 * - Gateway VAT = Gateway Fee * 15%
 * - Total = Subtotal + Gateway Fee + Gateway VAT
 */
export function calculateServiceFees(commission: number): ServiceFeesBreakdown {
  const commissionVat = Math.round(commission * VAT_RATE * 100) / 100;
  const adminFee = FIXED_ADMIN_FEE;
  const subtotal = commission + commissionVat + adminFee;

  const gatewayFee =
    Math.round((subtotal * GATEWAY_FEE_RATE + GATEWAY_FEE_FIXED) * 100) / 100;
  const gatewayFeeVat = Math.round(gatewayFee * VAT_RATE * 100) / 100;

  const total = Math.round((subtotal + gatewayFee + gatewayFeeVat) * 100) / 100;

  return {
    commission,
    commissionVat,
    adminFee,
    subtotal,
    gatewayFee,
    gatewayFeeVat,
    total,
  };
}

/**
 * Generate a verification code for bank transfer
 */
export function generateVerificationCode(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `DASM-${randomNum}`;
}

/**
 * Format currency in SAR
 */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString("ar-SA");
}

/**
 * Format currency with SAR suffix
 */
export function formatCurrencyWithUnit(amount: number): string {
  return `${formatCurrency(amount)} ر.س`;
}

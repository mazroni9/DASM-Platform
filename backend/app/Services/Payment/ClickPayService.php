<?php

namespace App\Services\Payment;

use App\Models\Settlement;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ClickPayService
{
    protected string $baseUrl;
    protected string $profileId;
    protected string $serverKey;

    public function __construct()
    {
        $this->baseUrl = config('clickpay.base_url', 'https://secure.clickpay.com.sa');
        $this->profileId = config('clickpay.profile_id');
        $this->serverKey = config('clickpay.server_key');
    }

    /**
     * Initiate a payment request to ClickPay Hosted Payment Page
     *
     * @param Settlement $settlement
     * @param User $user
     * @return array ['success' => bool, 'redirect_url' => string|null, 'tran_ref' => string|null, 'error' => string|null]
     */
    public function initiatePayment(Settlement $settlement, User $user): array
    {
        try {
            $payload = $this->buildPaymentPayload($settlement, $user);

            Log::info('ClickPay: Initiating payment', [
                'settlement_id' => $settlement->id,
                'amount' => $payload['cart_amount'],
                'cart_id' => $payload['cart_id'],
            ]);

            $response = Http::withHeaders([
                'Authorization' => $this->serverKey,
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}/payment/request", $payload);

            $data = $response->json();
            Log::info('ClickPay: data payment', [
                $data
            ]);

            if ($response->successful() && isset($data['redirect_url'])) {
                // Update settlement with transaction reference
                $settlement->update([
                    'service_fees_payment_ref' => $data['tran_ref'] ?? null,
                    'service_fees_gateway' => 'CLICKPAY',
                ]);

                Log::info('ClickPay: Payment initiated successfully', [
                    'settlement_id' => $settlement->id,
                    'tran_ref' => $data['tran_ref'] ?? null,
                ]);

                return [
                    'success' => true,
                    'redirect_url' => $data['redirect_url'],
                    'tran_ref' => $data['tran_ref'] ?? null,
                ];
            }

            Log::error('ClickPay: Payment initiation failed', [
                'settlement_id' => $settlement->id,
                'response' => $data,
            ]);

            return [
                'success' => false,
                'redirect_url' => null,
                'tran_ref' => null,
                'error' => $data['message'] ?? 'Payment initiation failed',
            ];
        } catch (\Throwable $e) {
            Log::error('ClickPay: Exception during payment initiation', [
                'settlement_id' => $settlement->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'redirect_url' => null,
                'tran_ref' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Verify a payment transaction by transaction reference
     *
     * @param string $tranRef
     * @return array
     */
    public function verifyPayment(string $tranRef): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => $this->serverKey,
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}/payment/query", [
                'profile_id' => $this->profileId,
                'tran_ref' => $tranRef,
            ]);

            $data = $response->json();

            if ($response->successful()) {
                $isAuthorized = ($data['payment_result']['response_status'] ?? '') === 'A';

                return [
                    'success' => true,
                    'authorized' => $isAuthorized,
                    'response_status' => $data['payment_result']['response_status'] ?? null,
                    'response_code' => $data['payment_result']['response_code'] ?? null,
                    'response_message' => $data['payment_result']['response_message'] ?? null,
                    'tran_ref' => $data['tran_ref'] ?? null,
                    'cart_id' => $data['cart_id'] ?? null,
                    'cart_amount' => $data['cart_amount'] ?? null,
                    'raw' => $data,
                ];
            }

            return [
                'success' => false,
                'authorized' => false,
                'error' => $data['message'] ?? 'Verification failed',
            ];
        } catch (\Throwable $e) {
            Log::error('ClickPay: Exception during payment verification', [
                'tran_ref' => $tranRef,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'authorized' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Build the payment request payload for ClickPay API
     *
     * @param Settlement $settlement
     * @param User $user
     * @return array
     */
    protected function buildPaymentPayload(Settlement $settlement, User $user): array
    {
        $cartId = 'DASM-' . $settlement->id . '-' . Str::random(6);

        return [
            'profile_id' => $this->profileId,
            'tran_type' => 'sale',
            'tran_class' => 'ecom',
            'cart_id' => $cartId,
            'cart_description' => "Service Fees for Auction #{$settlement->auction_id}",
            'cart_currency' => config('clickpay.currency', 'SAR'),
            'cart_amount' => number_format($settlement->service_fees_total, 2, '.', ''),
            'callback' => route('payment.webhook'),
            'return' => route('payment.return'),
            
            'customer_details' => [
                'name' => trim("{$user->first_name} {$user->last_name}"),
                'email' => $user->email,
                'phone' => $user->phone ?? '',
                'street1' => $user->address ?? 'N/A',
                'city' => $user->city ?? 'Riyadh',
                'state' => $user->state ?? 'Riyadh',
                'country' => 'SA',
                'ip' => request()->ip(),
            ],
        ];
    }

    /**
     * Calculate service fees based on DASM Dual-Page Model
     * 
     * Business Decision (2025-12-22): Platform absorbs payment gateway fees.
     * Customer is NOT charged for payment processing fees anymore.
     *
     * @param float $carPrice The car bid/purchase price
     * @param float $commission Platform commission
     * @param string $sellerType 'individual' or 'partner'
     * @return array
     */
    public static function calculateServiceFees(float $carPrice, float $commission, string $sellerType = 'individual'): array
    {
        // Partner gets 80% discount on commission
        $effectiveCommission = $sellerType === 'partner' ? $commission * 0.20 : $commission;

        // VAT at 15% on commission
        $commissionVat = $effectiveCommission * 0.15;

        // Fixed admin fee
        $adminFee = 600.00;

        // Subtotal before gateway fees
        $subtotal = $effectiveCommission + $commissionVat + $adminFee;

        // Gateway fees: Platform absorbs these - customer pays 0
        $gatewayFee = 0.00;
        $gatewayVat = 0.00;

        // Total service fees = Commission + VAT + Admin Fee (no gateway fees)
        $total = $subtotal;

        return [
            'commission' => round($effectiveCommission, 2),
            'commission_vat' => round($commissionVat, 2),
            'admin_fee' => $adminFee,
            'subtotal' => round($subtotal, 2),
            'gateway_fee' => $gatewayFee,
            'gateway_vat' => $gatewayVat,
            'total' => round($total, 2),
        ];
    }
}

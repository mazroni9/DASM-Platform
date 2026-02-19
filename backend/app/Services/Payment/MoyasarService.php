<?php

namespace App\Services\Payment;

use App\Models\Settlement;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MoyasarService
{
    protected string $baseUrl;
    protected ?string $secretKey;
    protected ?string $publishableKey;

    public function __construct()
    {
        $this->baseUrl = 'https://api.moyasar.com/v1';
        $this->secretKey = config('services.moyasar.secret_key')
            ?? env('MOYASAR_SECRET_KEY');
        $this->publishableKey = config('services.moyasar.publishable_key')
            ?? env('MOYASAR_PUBLISHABLE_KEY');
    }

    /**
     * Verify a payment by its ID
     * Fetches payment from Moyasar API and validates status, amount, and currency
     *
     * @param string $paymentId The Moyasar payment ID
     * @param float $expectedAmount The expected amount in SAR
     * @param string $currency Expected currency (default: SAR)
     * @return array
     */
    public function verifyPayment(string $paymentId, float $expectedAmount = 0, string $currency = 'SAR'): array
    {
        try {
            if (empty($this->secretKey)) {
                return [
                    'success' => false,
                    'authorized' => false,
                    'error' => 'Moyasar secret key is not configured',
                ];
            }

            Log::info('Moyasar: Verifying payment', [
                'payment_id' => $paymentId,
                'expected_amount' => $expectedAmount,
            ]);

            $response = Http::timeout(15)
                ->withBasicAuth($this->secretKey, '')
                ->get("{$this->baseUrl}/payments/{$paymentId}");
            

            if (!$response->successful()) {
                Log::error('Moyasar: API request failed', [
                    'payment_id' => $paymentId,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [
                    'success' => false,
                    'authorized' => false,
                    'error' => 'Failed to fetch payment from Moyasar',
                ];
            }

            $data = $response->json();

            // Validate payment status
            $status = $data['status'] ?? '';
            $isPaid = $status === 'paid';

            // Amount from Moyasar is in Halalas (smallest unit)
            $amountInHalalas = $data['amount'] ?? 0;
            $amountInSar = $amountInHalalas / 100;
            $responseCurrency = strtoupper($data['currency'] ?? '');

            // Validate amount if provided
            $amountValid = true;
            if ($expectedAmount > 0) {
                // Allow small tolerance for rounding
                $amountValid = abs($amountInSar - $expectedAmount) < 0.01;
            }

            // Validate currency
            $currencyValid = $responseCurrency === strtoupper($currency);

            $authorized = $isPaid && $amountValid && $currencyValid;

            Log::info('Moyasar: Payment verification result', [
                'payment_id' => $paymentId,
                'status' => $status,
                'is_paid' => $isPaid,
                'amount_sar' => $amountInSar,
                'expected_amount' => $expectedAmount,
                'amount_valid' => $amountValid,
                'currency' => $responseCurrency,
                'currency_valid' => $currencyValid,
                'authorized' => $authorized,
            ]);

            return [
                'success' => true,
                'authorized' => $authorized,
                'status' => $status,
                'amount' => $amountInSar,
                'amount_halalas' => $amountInHalalas,
                'currency' => $responseCurrency,
                'payment_id' => $data['id'] ?? $paymentId,
                'source_type' => $data['source']['type'] ?? null,
                'source_company' => $data['source']['company'] ?? null,
                'description' => $data['description'] ?? null,
                'metadata' => $data['metadata'] ?? [],
                'raw' => $data,
            ];
        } catch (\Throwable $e) {
            Log::error('Moyasar: Exception during payment verification', [
                'payment_id' => $paymentId,
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
     * Get the publishable API key for frontend use
     *
     * @return string
     */
    public function getPublishableKey(): string
    {
        return $this->publishableKey;
    }
}

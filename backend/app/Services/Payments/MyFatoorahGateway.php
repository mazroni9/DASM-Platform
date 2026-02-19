<?php

namespace App\Services\Payments;

use App\Models\ExhibitorPaymentIntent;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MyFatoorahGateway implements PaymentGateway
{
    public function createCheckout(ExhibitorPaymentIntent $intent): string
    {
        $apiKey = (string) config('payments.myfatoorah.key');
        if ($apiKey === '') {
            throw new \RuntimeException('MyFatoorah API key is not configured');
        }

        $baseUrl = rtrim((string) env('MYFATOORAH_BASE_URL', 'https://api.myfatoorah.com'), '/');
        $amountSar = round(((int) $intent->amount) / 100, 2);

        $payload = [
            'CustomerName' => 'DASM Exhibitor',
            'NotificationOption' => 'LNK',
            'InvoiceValue' => $amountSar,
            'DisplayCurrencyIso' => 'SAR',
            'CallBackUrl' => $intent->callback_url,
            'ErrorUrl' => $intent->return_url ?: url('/exhibitor/wallet'),
            'CustomerReference' => (string) $intent->id,
            'Language' => 'en',
            'UserDefinedField' => (string) $intent->id,
        ];

        $response = Http::withToken($apiKey)
            ->acceptJson()
            ->timeout(20)
            ->post("{$baseUrl}/v2/SendPayment", $payload);

        $data = $response->json();
        $invoiceData = $data['Data'] ?? [];

        if (!$response->successful() || empty($data['IsSuccess']) || empty($invoiceData['InvoiceURL'])) {
            Log::error('MyFatoorah createCheckout failed', [
                'payment_intent_id' => $intent->id,
                'status' => $response->status(),
                'message' => $data['Message'] ?? null,
            ]);
            throw new \RuntimeException('Failed to create MyFatoorah checkout');
        }

        $providerRef = (string) ($invoiceData['InvoiceId'] ?? $intent->id);

        $intent->update([
            'provider_ref' => $providerRef,
            'status' => 'requires_action',
            'meta' => array_merge($intent->meta ?? [], [
                'invoice_url' => $invoiceData['InvoiceURL'],
                'invoice_id' => $invoiceData['InvoiceId'] ?? null,
            ]),
        ]);

        return $invoiceData['InvoiceURL'];
    }

    public function validateWebhook(array $payload, array $headers = []): array
    {
        $this->assertValidSignature($payload, $headers);

        $status = strtolower((string) (
            $payload['status']
            ?? $payload['InvoiceStatus']
            ?? data_get($payload, 'Data.InvoiceStatus')
            ?? data_get($payload, 'Data.PaymentStatus')
            ?? ''
        ));

        $providerRef = (string) (
            $payload['provider_ref']
            ?? $payload['InvoiceId']
            ?? data_get($payload, 'Data.InvoiceId')
            ?? ''
        );

        if (in_array($status, ['paid', 'success', 'succeeded'], true) && $providerRef !== '') {
            return ['success' => true, 'provider_ref' => $providerRef];
        }

        throw new \RuntimeException('invalid webhook');
    }

    private function assertValidSignature(array $payload, array $headers): void
    {
        $secret = (string) config('payments.myfatoorah.callback_secret');
        if ($secret === '') {
            throw new \RuntimeException('missing webhook secret');
        }

        $provided = (string) (
            $headers['x-myfatoorah-signature'][0]
            ?? $headers['myfatoorah-signature'][0]
            ?? ''
        );

        if ($provided === '') {
            throw new \RuntimeException('missing webhook signature');
        }

        $encoded = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $computed = hash_hmac('sha256', (string) $encoded, $secret);

        if (!hash_equals($computed, $provided)) {
            throw new \RuntimeException('invalid webhook signature');
        }
    }
}

<?php

namespace App\Services\Payments;

use App\Models\ExhibitorPaymentIntent;
use Illuminate\Support\Str;

class MyFatoorahGateway implements PaymentGateway
{
    public function createCheckout(ExhibitorPaymentIntent $intent): string
    {
        $fakeRef = 'MF-' . Str::uuid()->toString();
        $intent->update([
            'provider_ref' => $fakeRef,
            'status' => 'requires_action',
        ]);
        return $intent->return_url ?: url('/exhibitor/wallet?ref='.$fakeRef);
    }

    public function validateWebhook(array $payload, array $headers = []): array
    {
        if (($payload['status'] ?? null) === 'succeeded' && !empty($payload['provider_ref'])) {
            return ['success' => true, 'provider_ref' => $payload['provider_ref']];
        }
        throw new \RuntimeException('invalid webhook');
    }
}

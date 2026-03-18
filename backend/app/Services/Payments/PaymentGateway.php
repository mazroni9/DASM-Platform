<?php

namespace App\Services\Payments;

use App\Models\ExhibitorPaymentIntent;

interface PaymentGateway
{
    public function createCheckout(ExhibitorPaymentIntent $intent): string;

    public function validateWebhook(array $payload, array $headers = []): array;
}

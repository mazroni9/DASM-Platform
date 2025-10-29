<?php

namespace App\Services\Payments;

class PaymentGatewayFactory
{
    public static function make(?string $provider = null): PaymentGateway
    {
        $provider = $provider ?: config('payments.default', 'myfatoorah');

        return match ($provider) {
            'myfatoorah' => new MyFatoorahGateway(),
            default => new MyFatoorahGateway(),
        };
    }
}

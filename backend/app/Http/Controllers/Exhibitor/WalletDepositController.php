<?php

namespace App\Http\Controllers\Exhibitor;

use App\Http\Controllers\Controller;
use App\Models\ExhibitorPaymentIntent;
use App\Models\ExhibitorWallet;
use App\Services\Payments\PaymentGatewayFactory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WalletDepositController extends Controller
{
    public function initiate(Request $request)
    {
        $data = $request->validate([
            'amount_sar' => ['required','numeric','min:1'],
            'return_url' => ['nullable','url'],
        ]);

        $amount = (int) round($data['amount_sar'] * 100); // لو جدولك بالريال، خليه بدون *100

        $wallet = ExhibitorWallet::firstOrCreate(['user_id' => $request->user()->id]);

        $intent = ExhibitorPaymentIntent::create([
            'wallet_id' => $wallet->id,
            'amount' => $amount,
            'provider' => config('payments.default','myfatoorah'),
            'status' => 'pending',
            'return_url' => $data['return_url'] ?? url('/exhibitor/wallet'),
            'callback_url' => route('exhibitor.wallet.deposit.webhook'),
            'meta' => ['created_by' => $request->user()->id],
        ]);

        $gateway = PaymentGatewayFactory::make($intent->provider);
        $redirectUrl = $gateway->createCheckout($intent);

        return response()->json([
            'success' => true,
            'data' => [
                'payment_intent_id' => $intent->id,
                'redirect_url' => $redirectUrl,
            ],
        ], 201);
    }

    // Webhook عام (من بوابة الدفع)
    public function webhook(Request $request)
    {
        $gateway = PaymentGatewayFactory::make();
        $payload = $request->all();

        try {
            $verified = $gateway->validateWebhook($payload, $request->headers->all());
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'invalid webhook'], 400);
        }

        $providerRef = $verified['provider_ref'] ?? null;
        if (!$providerRef) {
            return response()->json(['success' => false, 'message' => 'missing provider_ref'], 422);
        }

        $intent = ExhibitorPaymentIntent::where('provider_ref', $providerRef)->first();
        if (!$intent) {
            return response()->json(['success' => false, 'message' => 'intent not found'], 404);
        }

        if ($intent->status === 'succeeded') {
            return response()->json(['success' => true]); // معالجة مسبقة
        }

        DB::transaction(function () use ($intent) {
            $wallet = $intent->wallet()->lockForUpdate()->first();
            $wallet->credit($intent->amount, 'Deposit via gateway', null);
            $intent->update(['status' => 'succeeded']);
        });

        return response()->json(['success' => true]);
    }
}

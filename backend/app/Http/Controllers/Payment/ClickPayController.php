<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\CommissionTier;
use App\Models\Setting;
use App\Models\Settlement;
use App\Services\Payment\ClickPayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ClickPayController extends Controller
{
    protected ClickPayService $clickPayService;

    public function __construct(ClickPayService $clickPayService)
    {
        $this->clickPayService = $clickPayService;
    }

    /**
     * Initiate a payment for service fees
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function initiatePayment(Request $request): JsonResponse
    {
        $request->validate([
            'settlement_id' => 'required|exists:settlements,id',
        ]);

        try {
            $user = Auth::user();
            $settlement = Settlement::with(['auction', 'car'])
                ->where('id', $request->settlement_id)
                ->where('buyer_id', $user->id)
                ->firstOrFail();

            // Check if already paid
            if ($settlement->service_fees_payment_status === 'PAID') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Service fees already paid',
                ], 400);
            }

            // Calculate service fees if not set
            if (!$settlement->service_fees_total) {
                $fees = $this->calculateAndUpdateServiceFees($settlement);
                $settlement->refresh();
            }

            // Generate verification code if not set
            if (!$settlement->verification_code) {
                $settlement->update([
                    'verification_code' => 'DASM-' . strtoupper(Str::random(6)),
                ]);
            }

            // Initiate payment with ClickPay
            $result = $this->clickPayService->initiatePayment($settlement, $user);

            if ($result['success']) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Payment initiated successfully',
                    'redirect_url' => $result['redirect_url'],
                    'tran_ref' => $result['tran_ref'],
                ]);
            }

            return response()->json([
                'status' => 'error',
                'message' => $result['error'] ?? 'Payment initiation failed',
            ], 500);
        } catch (\Throwable $e) {
            Log::error('ClickPay initiatePayment error', [
                'error' => $e->getMessage(),
                'settlement_id' => $request->settlement_id,
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to initiate payment',
            ], 500);
        }
    }

    /**
     * Handle return from ClickPay after payment
     * User is redirected here after completing payment on ClickPay hosted page
     * 
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function handleReturn(Request $request)
    {
        $tranRef = $request->input('tranRef');
        $respStatus = $request->input('respStatus');
        $respMessage = $request->input('respMessage');
        $cartId = $request->input('cartId');

        Log::info('ClickPay return callback', [
            'tranRef' => $tranRef,
            'respStatus' => $respStatus,
            'respMessage' => $respMessage,
            'cartId' => $cartId,
            'ip' => $request->ip(),
        ]);

        // Find settlement by transaction reference
        $settlement = Settlement::where('service_fees_payment_ref', $tranRef)->first();

        if (!$settlement) {
            // Try to find by cart_id (format: DASM-{settlement_id}-{random})
            if ($cartId && preg_match('/^DASM-(\d+)-/', $cartId, $matches)) {
                $settlement = Settlement::find($matches[1]);
            }
        }

        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');

        if (!$settlement) {
            return redirect("{$frontendUrl}/payment/callback?status=error&message=Settlement not found");
        }

        // Verify payment with ClickPay API (don't trust URL params alone)
        if ($tranRef) {
            $verification = $this->clickPayService->verifyPayment($tranRef);

            if ($verification['success'] && $verification['authorized']) {
                // Payment successful
                $this->markPaymentSuccess($settlement, $tranRef, $verification);

                return redirect("{$frontendUrl}/auctions/purchase-confirmation/{$settlement->auction_id}?step=3&paid=true");
            }
        }

        // Payment failed or cancelled
        if ($respStatus === 'C') {
            return redirect("{$frontendUrl}/auctions/purchase-confirmation/{$settlement->auction_id}?status=cancelled");
        }

        return redirect("{$frontendUrl}/auctions/purchase-confirmation/{$settlement->auction_id}?status=failed&message=" . urlencode($respMessage ?? 'Payment failed'));
    }

    /**
     * Handle webhook/callback from ClickPay (server-to-server)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function handleWebhook(Request $request): JsonResponse
    {
        $payload = $request->all();

        Log::info('ClickPay webhook received', [
            'tran_ref' => $payload['tran_ref'] ?? null,
            'response_status' => $payload['payment_result']['response_status'] ?? null,
            'cart_id' => $payload['cart_id'] ?? null,
        ]);

        $tranRef = $payload['tran_ref'] ?? null;
        $responseStatus = $payload['payment_result']['response_status'] ?? null;

        if (!$tranRef) {
            return response()->json(['status' => 'error', 'message' => 'Missing transaction reference'], 400);
        }

        $settlement = Settlement::where('service_fees_payment_ref', $tranRef)->first();

        if (!$settlement) {
            Log::warning('ClickPay webhook: Settlement not found', ['tran_ref' => $tranRef]);
            return response()->json(['status' => 'error', 'message' => 'Settlement not found'], 404);
        }

        // Verify with ClickPay API
        $verification = $this->clickPayService->verifyPayment($tranRef);

        if ($verification['success'] && $verification['authorized']) {
            $this->markPaymentSuccess($settlement, $tranRef, $verification);
            return response()->json(['status' => 'success', 'message' => 'Payment confirmed'], 200);
        }

        Log::warning('ClickPay webhook: Payment not authorized', [
            'tran_ref' => $tranRef,
            'response_status' => $verification['response_status'] ?? null,
            'response_code' => $verification['response_code'] ?? null,
        ]);

        return response()->json(['status' => 'error', 'message' => 'Payment not authorized'], 400);
    }

    /**
     * Mark payment as successful and log transaction
     */
    protected function markPaymentSuccess(Settlement $settlement, string $tranRef, array $verification): void
    {
        DB::transaction(function () use ($settlement, $tranRef, $verification) {
            // Update settlement status
            $settlement->update([
                'service_fees_payment_status' => 'PAID',
                'service_fees_payment_ref' => $tranRef,
                'service_fees_gateway' => 'CLICKPAY',
            ]);

            // Log transaction (optional - depends on your Transaction model structure)
            // Transaction::create([
            //     'wallet_id' => null,
            //     'type' => 'settlement',
            //     'amount' => $settlement->service_fees_total,
            //     'related_auction' => $settlement->auction_id,
            //     'description' => "Service fees payment for auction #{$settlement->auction_id}",
            // ]);

            Log::info('ClickPay: Payment marked as successful', [
                'settlement_id' => $settlement->id,
                'tran_ref' => $tranRef,
                'amount' => $settlement->service_fees_total,
            ]);
        });
    }

    /**
     * Calculate and update service fees on settlement
     */
    protected function calculateAndUpdateServiceFees(Settlement $settlement): array
    {
        $carPrice = $settlement->final_price ?? $settlement->car_price ?? 0;
        $commission = CommissionTier::getCommissionForPrice($carPrice);

        // Determine seller type
        $sellerType = $settlement->seller_type ?? 'individual';

        $fees = ClickPayService::calculateServiceFees($carPrice, $commission, $sellerType);

        $settlement->update([
            'car_price' => $carPrice,
            'platform_commission' => $fees['commission'],
            'service_fees_total' => $fees['total'],
            'vehicle_price_total' => $carPrice,
        ]);

        return $fees;
    }

    /**
     * Handle callback from Moyasar after payment
     * Moyasar redirects to callback_url?id=xxx&status=paid
     * 
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function handleMoyasarCallback(Request $request)
    {
        $paymentId = $request->input('id');
        $status = $request->input('status');
        $settlementId = $request->input('settlement_id');

        Log::info('Moyasar callback received', [
            'payment_id' => $paymentId,
            'status' => $status,
            'settlement_id' => $settlementId,
        ]);

        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');

        if (!$paymentId) {
            return redirect("{$frontendUrl}/payment/callback?status=error&message=Missing payment ID");
        }

        // Find settlement
        $settlement = null;
        if ($settlementId) {
            $settlement = Settlement::find($settlementId);
        }

        if (!$settlement) {
            // Try to find by payment reference
            $settlement = Settlement::where('service_fees_payment_ref', $paymentId)->first();
        }

        if (!$settlement) {
            Log::warning('Moyasar callback: Settlement not found', [
                'payment_id' => $paymentId,
                'settlement_id' => $settlementId,
            ]);
            return redirect("{$frontendUrl}/payment/callback?status=error&message=Settlement not found");
        }

        // Verify payment with Moyasar API
        $moyasarService = app(\App\Services\Payment\MoyasarService::class);
        $verification = $moyasarService->verifyPayment($paymentId, $settlement->service_fees_total);

        if ($verification['success'] && $verification['authorized']) {
            // Payment successful
            $this->markMoyasarPaymentSuccess($settlement, $paymentId, $verification);

            return redirect("{$frontendUrl}/auctions/purchase-confirmation/{$settlement->auction_id}?step=3&paid=true&gateway=moyasar");
        }

        // Payment failed
        Log::warning('Moyasar callback: Payment not authorized', [
            'payment_id' => $paymentId,
            'status' => $verification['status'] ?? null,
            'authorized' => $verification['authorized'] ?? false,
        ]);

        return redirect("{$frontendUrl}/auctions/purchase-confirmation/{$settlement->auction_id}?status=failed&message=" . urlencode('Payment verification failed'));
    }

    /**
     * Mark Moyasar payment as successful
     */
    protected function markMoyasarPaymentSuccess(Settlement $settlement, string $paymentId, array $verification): void
    {
        DB::transaction(function () use ($settlement, $paymentId, $verification) {
            $settlement->update([
                'service_fees_payment_status' => 'PAID',
                'service_fees_payment_ref' => $paymentId,
                'service_fees_gateway' => 'MOYASAR',
            ]);

            Log::info('Moyasar: Payment marked as successful', [
                'settlement_id' => $settlement->id,
                'payment_id' => $paymentId,
                'amount' => $settlement->service_fees_total,
            ]);
        });
    }
}

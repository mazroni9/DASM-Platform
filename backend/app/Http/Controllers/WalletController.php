<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use MyFatoorah\Library\API\Payment\MyFatoorahPayment;
use MyFatoorah\Library\API\Payment\MyFatoorahPaymentStatus;

class WalletController extends Controller
{
    private $mfObj;
    public  $config ;
    public function __construct() {
        $this->config = [
            'apiKey' => config('myfatoorah.apiKey'),
            'vcCode' => config('myfatoorah.vcCode'),
            'isTest' => config('myfatoorah.isTest'),
        ];
        $this->mfObj = new MyFatoorahPayment($this->config);
    }
    /**
     * Display the user's wallet
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function show()
    {
        $wallet = Auth::user()->wallet;

        if (!$wallet) {
            // Create wallet if doesn't exist
            $wallet = new Wallet();
            $wallet->user_id = Auth::id();
            $wallet->available_balance = 0;
            $wallet->funded_balance = 0;
            $wallet->save();
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'available_balance' => $wallet->available_balance,
                'funded_balance' => $wallet->funded_balance,
                'total_balance' => $wallet->available_balance + $wallet->funded_balance
            ]
        ]);
    }

    /**
     * Add funds to the user's wallet (simulated)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function deposit(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:10',
            'payment_method' => 'required|string|in:credit_card,bank_transfer'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $wallet = Auth::user()->wallet;

        if (!$wallet) {
            // Create wallet if doesn't exist
            $wallet = new Wallet();
            $wallet->user_id = Auth::id();
            $wallet->available_balance = 0;
            $wallet->funded_balance = 0;
            $wallet->save();
        }

        if ($request->payment_method === 'credit_card') {
            $paymentUrl = $this->initiateRecharge(Auth::id(), $request->amount);
            return response()->json([
                'status' => 'success',
                'payment_url' => $paymentUrl
            ]);
        } else {
            $transaction = new WalletTransaction();
            $transaction->wallet_id = $wallet->id;
            $transaction->amount = $request->amount;
            $transaction->type = 'deposit';
            $transaction->status = 'completed';
            $transaction->reference = 'DEP-'.Str::random(10);
            $transaction->payment_method = $request->payment_method;
            //$transaction->payment_gateway_invoice_id = $request->payment_gateway_invoice_id;
            $transaction->save();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Deposit successful',
            'data' => [
                'transaction_id' => $transaction->id,
                'amount' => $request->amount,
                'new_balance' => [
                    'available_balance' => $wallet->available_balance,
                    'funded_balance' => $wallet->funded_balance,
                    'total_balance' => $wallet->available_balance + $wallet->funded_balance
                ]
            ]
        ]);
    }

    public function recharge(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:10',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $paymentUrl = $this->initiateRecharge(Auth::id(), $request->amount);
            return response()->json(['payment_url' => $paymentUrl]);
        } catch (Exception $ex) {
            return response()->json(['error' => $ex->getMessage()], 500);
        }
    }

    public function initiateRecharge($userId, $amount) {
        $user = User::find($userId);
        $wallet = $user->wallet;

        $postFields = [
            'CustomerName' => $user->first_name ,
            'CustomerEmail' => $user->email,
            'NotificationOption'=>"LNK",
            'InvoiceValue' => $amount,
            'DisplayCurrencyIso' => 'SAR',
            'CallBackUrl' => config('app.frontend_url') . '/wallet/callback?userId=' . $userId,
            'ErrorUrl' => config('app.frontend_url') . '/wallet/error?userId=' . $userId,
            'Language' => 'ar',
            'CustomerReference' => $userId, // لربط الدفع بالمستخدم
        ];
        //return($postFields);
        try {
            $data = $this->mfObj->sendPayment($postFields);
            // حفظ معلومات الفاتورة مؤقتاً
            $transaction = new WalletTransaction();
            $transaction->wallet_id = $wallet->id;
            $transaction->amount = $amount;
            $transaction->type = 'deposit';
            $transaction->status = 'pending';
            $transaction->reference = 'DEP-'.Str::random(10);
            $transaction->payment_method = 'myfatoorah';
            $transaction->payment_gateway_invoice_id = $data->InvoiceId;
            $transaction->save();

            return $data->InvoiceURL;

        } catch (Exception $ex) {
            throw new Exception('خطأ في إنشاء الفاتورة: ' . $ex->getMessage());
        }
    }

    public function handleCallback(Request $request) {
        try {

            $keyId   = $request->paymentId;
            $KeyType = 'PaymentId';

            $data = new MyFatoorahPaymentStatus($this->config);
            $data = $data->getPaymentStatus($keyId, $KeyType);

            if($data->InvoiceStatus == 'Paid') {
                $this->processSuccessfulPayment($data);
                return response()->json(['status' => 'success', 'message' => 'Payment successful']);
            }

            return response()->json(['status' => 'error', 'message' => 'Payment failed']);

        } catch (Exception $ex) {
            Log::error('MyFatoorah callback error: ' . $ex->getMessage());
            return 'error';
        }
    }

    public function handleError(Request $request)
    {
        Log::error('MyFatoorah payment failed', ['request' => $request->all()]);
        // Here you can redirect the user to a specific page showing the error
        // Or return a view, or a JSON response
        return response()->json(['status' => 'error', 'message' => 'Payment failed or was cancelled.'], 400);
    }

    private function processSuccessfulPayment($paymentData) {
        $invoiceId = $paymentData->InvoiceId;
        $amount = $paymentData->InvoiceValue;

        $transaction = WalletTransaction::where('payment_gateway_invoice_id', $invoiceId)->first();

        if($transaction && $transaction->status == 'pending') {
            DB::transaction(function() use ($transaction, $amount) {
                // Update wallet balance
                $wallet = Wallet::find($transaction->wallet_id);

                $wallet->available_balance += $amount;
                $wallet->funded_balance += $amount;
                $wallet->save();


                // Update transaction status
                $transaction->status = 'completed';
                $transaction->save();
            });
            return $transaction;
        }
    }

    /**
     * Get wallet transaction history
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function transactions(Request $request)
    {
        $wallet = Auth::user()->wallet;

        if (!$wallet) {
            return response()->json([
                'status' => 'error',
                'message' => 'Wallet not found'
            ], 404);
        }

        $query = $wallet->walletTransactions();

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $transactions = $query->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'status' => 'success',
            'data' => $transactions,
            'balance' => [
                'available_balance' => $wallet->available_balance,
                'funded_balance' => $wallet->funded_balance,
                'total_balance' => $wallet->available_balance + $wallet->funded_balance
            ]
        ]);
    }
}

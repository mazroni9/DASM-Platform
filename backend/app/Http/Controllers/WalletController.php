<?php

namespace App\Http\Controllers;

use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class WalletController extends Controller
{
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
            'payment_method' => 'required|string|in:credit_card,bank_transfer,paypal'
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
        
        // Create a transaction record
        $transaction = new WalletTransaction();
        $transaction->wallet_id = $wallet->id;
        $transaction->amount = $request->amount;
        $transaction->type = 'deposit';
        $transaction->status = 'completed';
        $transaction->reference = 'DEP-'.Str::random(10);
        $transaction->payment_method = $request->payment_method;
        $transaction->save();
        
        // Update wallet balance
        $wallet->available_balance += $request->amount;
        $wallet->save();
        
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
        
        $query = $wallet->transactions();
        
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
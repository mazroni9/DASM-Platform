<?php

namespace App\Http\Controllers\Dealer;

use App\Http\Controllers\Controller;
use App\Models\Wallet;
use App\Models\Transcation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WalletController extends Controller
{
    /**
     * GET /api/dealer/wallet/transactions
     * Returns the last 5 transactions for the Settlement Modal.
     */
    public function transactions(Request $request)
    {
        $user = Auth::user();
        $wallet = Wallet::where('user_id', $user->id)->first();

        if (!$wallet) {
            return response()->json([
                'status' => 'error',
                'message' => 'Wallet not found',
            ], 404);
        }

        $transactions = Transcation::where('wallet_id', $wallet->id)
            ->orderBy('created_at', 'desc')
            ->limit($request->input('limit', 5))
            ->get(['id', 'type', 'amount', 'description', 'created_at']);

        return response()->json([
            'status' => 'success',
            'data' => [
                'transactions' => $transactions,
                'wallet_summary' => [
                    'available_balance' => $wallet->available_balance,
                    'funded_balance' => $wallet->funded_balance,
                ],
            ],
        ]);
    }
}

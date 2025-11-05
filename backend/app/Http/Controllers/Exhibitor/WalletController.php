<?php

namespace App\Http\Controllers\Exhibitor;

use App\Http\Controllers\Controller;
use App\Models\ExhibitorWallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WalletController extends Controller
{
    public function show(Request $request)
    {
        $wallet = ExhibitorWallet::firstOrCreate(
            ['user_id' => $request->user()->id],
            ['currency' => 'SAR', 'balance' => 0]
        );

        return response()->json([
            'success' => true,
            'data' => [
                'balance' => $wallet->balance,
                'balance_sar' => $wallet->balance / 100, // لو بالريال، استخدم $wallet->balance
                'currency' => $wallet->currency,
            ],
        ]);
    }

    public function transactions(Request $request)
    {
        try {
            $wallet = ExhibitorWallet::firstOrCreate(['user_id' => $request->user()->id]);

            $tx = $wallet->transactions()   // << كان transcations()
                ->orderByDesc('created_at')
                ->paginate(15);

            return response()->json([
                'success' => true,
                'data' => $tx,
            ]);
        } catch (\Throwable $e) {
            Log::error('EXHIBITOR_TX_LIST_FAILED', [
                'userId' => $request->user()->id,
                'error'  => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'تعذر قراءة سجل المعاملات',
                'code'    => 'EW-TX-500',
            ], 500);
        }
    }
}

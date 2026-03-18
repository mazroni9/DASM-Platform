<?php

namespace App\Http\Controllers\Exhibitor;

use App\Http\Controllers\Controller;
use App\Models\ExhibitorPayoutRequest;
use App\Models\ExhibitorWallet;
use Illuminate\Http\Request;

class WalletWithdrawController extends Controller
{
    public function requestPayout(Request $request)
    {
        $data = $request->validate([
            'amount_sar' => ['required','numeric','min:1'],
            'method' => ['nullable','string'],
            'details' => ['nullable','array'],
        ]);

        $amount = (int) round($data['amount_sar'] * 100); // لو بالريال، اشطب *100

        $wallet = ExhibitorWallet::firstOrCreate(['user_id' => $request->user()->id]);

        if ($wallet->balance < $amount) {
            return response()->json(['success' => false, 'message' => 'الرصيد غير كافٍ'], 422);
        }

        // بننشئ طلب سحب "pending" (الخصم الفعلي عند موافقة الأدمن)
        $payout = ExhibitorPayoutRequest::create([
            'wallet_id' => $wallet->id,
            'amount' => $amount,
            'method' => $data['method'] ?? 'bank_transfer',
            'details' => $data['details'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'data' => $payout,
            'message' => 'تم إنشاء طلب السحب وجارٍ المراجعة.',
        ], 201);
    }
}

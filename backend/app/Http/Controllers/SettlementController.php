<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Auction;
use App\Models\Setting;
use App\Models\Settlement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Notifications\NewSaleNotification;

class SettlementController extends Controller
{
    //ConfirmSale
    public function confirmSale(Request $request)
    {
        DB::beginTransaction();
        try {
            $auction = Auction::with('car','bids')->find($request->auction_id);
            $auction->status = 'ended';
            $auction->save();

            $highestBid = $auction->bids()->select('user_id', DB::raw('MAX(bid_amount) as highest_bid'))
            ->groupBy('user_id','bid_amount')
            ->orderBy('bid_amount', 'desc')
            ->first();

            $buyer = User::find($highestBid->user_id);
            $seller = $auction->car?->owner;

            $platformFeeSetting = Setting::where('key', 'platformFee')->first();
            $tamFeeSetting = Setting::where('key', 'tamFee')->first();
            $platformFee = $platformFeeSetting->value;
            $tamFee = $tamFeeSetting->value;

            $netAmount = $highestBid->highest_bid - $platformFee - $tamFee;

            $settlements = Settlement::create([
                'auction_id' => $auction->id,
                'seller_id' => $seller->id,
                'buyer_id' => $buyer->id,
                'car_id' => $auction->car_id,
                'final_price'=> $highestBid->highest_bid,
                'platform_fee'=> $platformFee,
                'tam_fee'=> $tamFee,
                'net_amount'=> $netAmount,
                'status'=> 'pending'
            ]);

            $buyer->notify(new NewSaleNotification($settlements));

            DB::commit();
            return response()->json([
                'message' => 'Sale confirmed successfully'
            ]);
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }
    }
}

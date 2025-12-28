<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Auction;
use App\Models\Setting;
use App\Models\Settlement;
use App\Enums\AuctionStatus;
use Illuminate\Http\Request;
use App\Models\CommissionTier;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Notifications\NewSaleNotification;

class SettlementController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        $user = Auth::user();

        // Eager load relationships for efficiency
        $settlements = Settlement::with(['car', 'auction', 'buyer', 'seller'])
            ->select([
                'auction_id',
                'seller_id',
                'buyer_id',
                'car_id',
                'buyer_net_amount',
                'status'
            ])
            ->where('buyer_id', $user->id)
            ->orWhere('seller_id', $user->id)
            ->latest()
            ->paginate(15);

        return response()->json([
            'status' => 'success',
            'data' => $settlements
        ]);
    }

    public function calculateSettlement(Request $request)
    {
        $user = Auth::user();
        $auction = Auction::where('status', AuctionStatus::ACTIVE->value)
            ->where('car_id', $request->car_id)
            ->whereHas('car', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            //->where('user_id', $user->id)
            ->first();
        if (!$auction) {
            return response()->json([
                'status' => 'error',
                'message' => 'Auction not found',
                'error' => 'Auction not found',
                'data' => null
            ], 404);
        }

        $auctionPrice = $auction->current_bid;
        $seller = $auction->car?->owner;
        $isPartner = $seller?->isVenueOwner() ?? false;

        // Calculate fees based on seller type
        if ($isPartner) {
            // Partner Showroom: 0% commission
            $platformFee = 0;
            $platformFeeVat = 0;
            $totalDeduction = 0;
            $netAmount = $auctionPrice;
        } else {
            // Individual Seller: Commission + 15% VAT
            $platformFee = CommissionTier::getCommissionForPrice($auctionPrice);
            $platformFeeVat = round($platformFee * 0.15, 2);
            $totalDeduction = $platformFee + $platformFeeVat;
            $netAmount = $auctionPrice - $totalDeduction;
        }

        // Get highest bidder info
        $highestBid = $auction->bids()
            ->orderBy('bid_amount', 'desc')
            ->first();
        $buyer = $highestBid?->user;

        return response()->json([
            'status' => 'success',
            'message' => 'Settlement calculated successfully',
            'data' => [
                'car' => $auction->car,
                'active_auction' => $auction,

                // Seller info
                'seller' => [
                    'id' => $seller?->id,
                    'name' => trim(($seller?->first_name ?? '') . ' ' . ($seller?->last_name ?? '')),
                    'is_partner' => $isPartner,
                ],

                // Buyer info
                'buyer' => $buyer ? [
                    'id' => $buyer->id,
                    'name' => trim(($buyer->first_name ?? '') . ' ' . ($buyer->last_name ?? '')),
                ] : null,

                // Financial breakdown
                'auction_price' => $auctionPrice,
                'platform_fee' => $platformFee,
                'platform_fee_vat' => $platformFeeVat,
                'total_deduction' => $totalDeduction,
                'net_amount' => $netAmount,

                // Legacy fields (for backward compatibility)
                'myfatoorah_fee' => 0,
            ]
        ]);
    }

    //ConfirmSale
    public function confirmSale(Request $request)
    {
        DB::beginTransaction();
        try {
            $user = Auth::user();
            $auction = Auction::with('car', 'bids')
                ->whereHas('car', function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                })
                ->where('status', AuctionStatus::ACTIVE->value)
                ->find($request->auction_id);


            if (!$auction) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Auction not found',
                    'error' => 'Auction not found',
                    'data' => null
                ], 404);
            }

            $auction->status = AuctionStatus::ENDED->value;
            $auction->save();

            $highestBid = $auction->bids()->select('user_id', DB::raw('MAX(bid_amount) as highest_bid'))
                ->groupBy('user_id', 'bid_amount')
                ->orderBy('bid_amount', 'desc')
                ->first();

            $buyer = User::find($highestBid->user_id);
            $seller = $auction->car?->owner;

            $platformFee = CommissionTier::getCommissionForPrice($highestBid->highest_bid);
            $tamFeeSetting = Setting::where('key', 'tamFee')->first();
            $tamFee = $tamFeeSetting->value;
            $muroorFee = Setting::where('key', 'muroorFee')->first()->value;
            //$myfatoorahFee = 200;
            $netAmount = $highestBid->highest_bid - ($platformFee);
            $buyerNetAmount = $highestBid->highest_bid + $platformFee + $tamFee + $muroorFee;

            $settlements = Settlement::create([
                'auction_id' => $auction->id,
                'seller_id' => $seller->id,
                'buyer_id' => $buyer->id,
                'car_id' => $auction->car_id,
                'final_price' => $highestBid->highest_bid,
                'platform_fee' => $platformFee,
                'tam_fee' => $tamFee,
                'muroor_fee' => $muroorFee,
                'net_amount' => $netAmount,
                'buyer_net_amount' => $buyerNetAmount,
                'status' => 'pending'
            ]);

            $buyer->notify(new NewSaleNotification($settlements));

            DB::commit();
            return response()->json([
                'status' => 'success',
                'message' => 'Sale confirmed successfully',
                'data' => $settlements
            ]);
        } catch (\Throwable $th) {
            Log::error('Sale confirmation failed: ' . $th->getMessage());
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Sale confirmation failed',
                'error' => $th->getMessage()
            ], 500);
        }
    }
    //confirm-purchase
    public function confirmPurchase(Request $request)
    {
        try {
            $user = Auth::user();
            $settlement = Settlement::where('auction_id', $request->auction_id)
                ->where('status', 'pending')
                ->where('buyer_id', $user->id)
                ->first();
        } catch (\Throwable $th) {
            Log::error('Purchase confirmation failed: ' . $th->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Purchase confirmation failed',
                'error' => $th->getMessage()
            ], 500);
        }

        if (!$settlement) {
            return response()->json([
                'status' => 'error',
                'message' => 'Purchase confirmation not found',
                'error' => 'Purchase confirmation not found',
                'data' => null
            ], 404);
        }
        $settlement->status = 'confirmed';
        return response()->json([
            'status' => 'success',
            'message' => 'Purchase confirmed successfully',
            'data' => $settlement
        ]);
    }
}

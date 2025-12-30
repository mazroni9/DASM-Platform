<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Settlement extends Model
{
    use HasFactory;

    protected $fillable = [
        'auction_id',
        'seller_id',
        'buyer_id',
        'car_id',
        'final_price',
        'platform_fee',
        'tam_fee',
        'net_amount',
        'muroor_fee',
        'buyer_net_amount',
        'status',
        // DASM Dual-Page Payment Model - Multi-Gateway Support
        'car_price',
        'platform_commission',
        'service_fees_total',
        'service_fees_payment_status',
        'service_fees_payment_ref',      // Generic reference (was clickpay_transaction_ref)
        'service_fees_gateway',           // MOYASAR | CLICKPAY
        'vehicle_price_total',
        'escrow_payment_status',
        'seller_type',
        'seller_commission_deduction',
        'partner_incentive',
        'escrow_release_status',
        'verification_code',
    ];

    // ✅ created_at فقط
    public $timestamps = true;
    const UPDATED_AT = null;

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function auction()
    {
        return $this->belongsTo(Auction::class);
    }

    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function car()
    {
        return $this->belongsTo(Car::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transcation extends Model
{
    // الجدول الحقيقي في Postgres
    protected $table = 'transactions';

    // عندك created_at فقط (مفيش updated_at)
    public $timestamps = false;

    protected $fillable = [
        'wallet_id',
        'type',
        'amount',
        'related_auction',
        'description',
        'created_at',
        // DASM Dual-Page Model fields
        'transaction_ref',
        'car_price',
        'platform_commission',
        'vat_amount',
        'transfer_fee',           // Fixed 600 SAR admin fee
        'gateway_fee',
        'service_fees_total',     // Total for Step 1 online payment
        'service_fees_status',    // PENDING, PAID, FAILED
        'vehicle_price_total',    // Car price for Step 2
        'escrow_payment_status',  // PENDING, VERIFIED, FAILED
        'escrow_iban',
        'verification_code',      // e.g., DASM-1234
    ];

    protected $casts = [
        'amount' => 'integer',      // لو عندك المبلغ بالريال مش بالهللة، غيرها لاحقًا لـ float
        'created_at' => 'datetime',
    ];

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(ExhibitorWallet::class, 'wallet_id');
    }
}

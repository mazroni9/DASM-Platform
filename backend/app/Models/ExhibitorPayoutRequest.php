<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExhibitorPayoutRequest extends Model
{
    protected $table = 'exhibitor_payout_requests';

    protected $fillable = [
        'wallet_id','amount','method','details','status','processed_by','processed_at'
    ];

    protected $casts = [
        'amount' => 'integer',
        'details' => 'array',
        'processed_at' => 'datetime',
    ];

    public function wallet(): BelongsTo {
        return $this->belongsTo(ExhibitorWallet::class, 'wallet_id');
    }
}

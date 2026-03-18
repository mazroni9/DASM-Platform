<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExhibitorPaymentIntent extends Model
{
    protected $table = 'exhibitor_payment_intents';

    protected $fillable = [
        'wallet_id','amount','provider','provider_ref','status','return_url','callback_url','meta'
    ];

    protected $casts = [
        'amount' => 'integer',
        'meta' => 'array',
    ];

    public function wallet(): BelongsTo {
        return $this->belongsTo(ExhibitorWallet::class, 'wallet_id');
    }
}

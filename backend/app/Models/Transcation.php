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
        'wallet_id', 'type', 'amount', 'related_auction', 'description', 'created_at'
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

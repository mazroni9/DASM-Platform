<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WalletTransaction extends Model
{
    protected $fillable = [
        'wallet_id',
        'amount',
        'type',
        'status',
        'reference',
        'payment_gateway_invoice_id',
        'payment_method',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    /**
     * Relationship to Wallet.
     */
    public function wallet()
    {
        return $this->belongsTo(Wallet::class);
    }

    /**
     * Scope for credit transactions (deposits, sales).
     */
    public function scopeCredit($query)
    {
        return $query->where('type', 'credit');
    }

    /**
     * Scope for debit transactions (withdrawals, purchases, fees).
     */
    public function scopeDebit($query)
    {
        return $query->where('type', 'debit');
    }

    /**
     * Scope for completed transactions.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Wallet extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'available_balance',
        'funded_balance'
    ];


    public $timestamps = false;
    const CREATED_AT = 'created_at';

    // A Wallet belongs to a User.
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // A Wallet has many Transactions.
    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }
    public function walletTransactions()
    {
        return $this->hasMany(WalletTransaction::class, 'wallet_id', 'id');
    }
}

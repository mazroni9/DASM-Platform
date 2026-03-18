<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class ExhibitorWallet extends Model
{
    protected $table = 'exhibitor_wallets';

    protected $fillable = ['user_id','balance','currency'];

    protected $casts = ['balance' => 'integer'];

    public function user(): BelongsTo {
        return $this->belongsTo(User::class);
    }

    // علاقة صحيحة على جدول transactions
    public function transactions(): HasMany {
        return $this->hasMany(Transcation::class, 'wallet_id');
    }

    public function credit(int $amount, string $description = 'Deposit', ?int $relatedAuction = null): Transcation
    {
        return DB::transaction(function () use ($amount, $description, $relatedAuction) {
            $wallet = self::where('id', $this->id)->lockForUpdate()->first();
            $wallet->balance += $amount;
            $wallet->save();

            return $wallet->transactions()->create([
                'type'            => 'credit',
                'amount'          => $amount,
                'related_auction' => $relatedAuction,
                'description'     => $description,
                'created_at'      => now(), // مهم لأن $timestamps=false
            ]);
        });
    }

    public function debit(int $amount, string $description = 'Payout', ?int $relatedAuction = null): Transcation
    {
        return DB::transaction(function () use ($amount, $description, $relatedAuction) {
            $wallet = self::where('id', $this->id)->lockForUpdate()->first();
            if ($wallet->balance < $amount) {
                throw new \RuntimeException('الرصيد غير كافٍ');
            }
            $wallet->balance -= $amount;
            $wallet->save();

            return $wallet->transactions()->create([
                'type'            => 'debit',
                'amount'          => $amount,
                'related_auction' => $relatedAuction,
                'description'     => $description,
                'created_at'      => now(), // مهم
            ]);
        });
    }

    public function getBalanceSarAttribute(): float {
        return $this->balance / 100.0; // لو بالريال فعليًا، احذف القسمة
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AuctionSession extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'session_date',
        'status',
        'type',
        'description',
        'user_id',
    ];

    protected $casts = [
        'session_date' => 'datetime',
        'user_id'      => 'integer',
    ];

    public function auctions(): HasMany
    {
        return $this->hasMany(Auction::class, 'session_id');
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

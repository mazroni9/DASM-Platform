<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BidEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'auction_id',
        'bid_id',
        'bidder_id',
        'bid_amount',
        'currency',
        'channel',
        'event_type',
        'reason_code',
        'server_ts_utc',
        'client_ts',
        'server_nano_seq',
        'ip_addr',
        'user_agent',
        'session_id',
        'hash_prev',
        'hash_curr',
    ];
    public $timestamps = false;
    const CREATED_AT = 'server_ts_utc';
    public function auction()
    {
        return $this->belongsTo(Auction::class);
    }

    public function bidder()
    {
        return $this->belongsTo(User::class, 'bidder_id');
    }
}

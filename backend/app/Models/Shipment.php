<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shipment extends Model
{
    use HasFactory;

    protected $fillable = [
        'venue_owner_id', 'buyer_id',
        'recipient_name', 'address_line', 'city', 'region', 'country', 'postal_code',
        'carrier_code', 'tracking_number', 'shipping_status', 'delivered_at',
        'payment_status', 'items_count', 'items_summary',
    ];

    protected $casts = [
        'delivered_at' => 'datetime',
        'shipping_status' => 'integer',
    ];

    public function venueOwner()
    {
        return $this->belongsTo(VenueOwner::class);
    }

    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function items()
    {
        return $this->hasMany(ShipmentItem::class);
    }

    public function recomputeItemsAggregates(): void
    {
        $count = (int) $this->items()->sum('qty');
        $first = $this->items()->orderBy('id')->first();
        $summary = $first ? sprintf('%s x%s', $first->name, $first->qty) : null;
        if ($first && $this->items()->count() > 1) {
            $summary .= ' + أخرى';
        }
        $this->items_count = $count;
        $this->items_summary = $summary;
        $this->saveQuietly();
    }
}

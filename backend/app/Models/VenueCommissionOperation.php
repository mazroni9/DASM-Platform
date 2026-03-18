<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class VenueCommissionOperation extends Model
{
    use HasFactory;

    protected $table = 'venue_commission_operations';

    protected $fillable = [
        'venue_owner_id',
        'car_id',
        'car_title',
        'amount',
        'currency',
        'description',
    ];

    protected $casts = [
        'amount' => 'float',
    ];

    public function venueOwner()
    {
        return $this->belongsTo(VenueOwner::class);
    }
}

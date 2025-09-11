<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VenueOwner extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'venue_name',
        'commercial_registry',
        'description',
        'status',
        'is_active',
        'rating',
        'address',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'rating' => 'decimal:2',
    ];

    /**
     * Get the user that owns the venue.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

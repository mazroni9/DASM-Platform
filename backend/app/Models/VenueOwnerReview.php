<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VenueOwnerReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'venue_owner_id',
        'user_id',
        'rating',
        'comment',
        'is_approved',
        'verified',
    ];

    protected $casts = [
        'rating' => 'decimal:2',
        'is_approved' => 'boolean',
        'verified' => 'boolean',
    ];

    public function venueOwner()
    {
        return $this->belongsTo(VenueOwner::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class); // صاحب التعليق
    }
}

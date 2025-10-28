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

    public function reviews()
{
    return $this->hasMany(VenueOwnerReview::class);
}

/**
 * أعد حساب المتوسط وخزّنه في عمود venue_owners.rating
 * - يأخذ فقط المراجعات المعتمدة is_approved = true
 */
public function recalcRating(): void
{
    $avg = (float) $this->reviews()
        ->where('is_approved', true)
        ->avg('rating');

    // خزّنه بمنزلتين
    $this->rating = number_format($avg ?: 0, 2, '.', '');
    $this->save();
}

}

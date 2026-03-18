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
        // ✅ إضافة الحقول للـ commission
        'commission_value',
        'commission_currency',
        'commission_note',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'rating' => 'decimal:2',
        'commission_value' => 'decimal:2',
    ];

    /**
     * Get the user that owns the venue.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Reviews relation
     */
    public function reviews()
    {
        return $this->hasMany(VenueOwnerReview::class);
    }

    /**
     * Commission operations relation
     */
    public function commissionOperations()
    {
        return $this->hasMany(VenueCommissionOperation::class);
    }

    /**
     * Shipments relation
     */
    public function shipments()
    {
        return $this->hasMany(Shipment::class);
    }

    /**
     * Service requests relation
     */
    public function serviceRequests()
    {
        return $this->hasMany(ServiceRequest::class);
    }

    /**
     * أعد حساب المتوسط وخزّنه في عمود venue_owners.rating
     */
    public function recalcRating(): void
    {
        $avg = (float) $this->reviews()
            ->where('is_approved', true)
            ->avg('rating');

        $this->rating = number_format($avg ?: 0, 2, '.', '');
        $this->save();
    }
}

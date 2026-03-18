<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceRequest extends Model
{
    use HasFactory;

    protected $table = 'service_requests';

    protected $fillable = [
        'venue_owner_id',
        'user_id',
        'extra_service_id',
        'car',
        'notes',
        'price',
        'currency',
        'status',
        'requested_at',
        'completed_at',
    ];

    protected $casts = [
        'price'        => 'decimal:2',
        'requested_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public const STATUS_PENDING     = 'pending';
    public const STATUS_APPROVED    = 'approved';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_COMPLETED   = 'completed';
    public const STATUS_CANCELED    = 'canceled';

    public static function allowedStatuses(): array
    {
        return [
            self::STATUS_PENDING,
            self::STATUS_APPROVED,
            self::STATUS_IN_PROGRESS,
            self::STATUS_COMPLETED,
            self::STATUS_CANCELED,
        ];
    }

    public function service()
    {
        return $this->belongsTo(ExtraService::class, 'extra_service_id');
    }

    public function venueOwner()
    {
        return $this->belongsTo(\App\Models\VenueOwner::class, 'venue_owner_id');
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }
}

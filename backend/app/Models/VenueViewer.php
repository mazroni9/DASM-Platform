<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VenueViewer extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'venue_id',
        'session_id',
        'last_active_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'last_active_at' => 'datetime',
    ];

    /**
     * Get the venue that owns the viewer.
     */
    public function venue()
    {
        return $this->belongsTo(Venue::class);
    }
}

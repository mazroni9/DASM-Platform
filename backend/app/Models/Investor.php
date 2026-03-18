<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Investor extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'company_name',
        'commercial_registry',
        'investment_description',
        'investment_capacity',
        'status',
        'is_active',
        'rating',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'rating' => 'decimal:2',
        'investment_capacity' => 'decimal:2',
    ];

    /**
     * Get the user that owns the investment company.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
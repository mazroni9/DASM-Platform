<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CarAttribute extends Model
{
    protected $fillable = [
        'car_id',
        'key',
        'value',
    ];

    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }
}

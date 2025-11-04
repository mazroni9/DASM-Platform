<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExtraService extends Model
{
    use HasFactory;

    protected $table = 'extra_services';

    protected $fillable = [
        'name',
        'description',
        'details',
        'icon',
        'base_price',
        'currency',
        'is_active',
    ];

    protected $casts = [
        'base_price' => 'decimal:2',
        'is_active'  => 'boolean',
    ];

    public function scopeActive($q)
    {
        return $q->where('is_active', true);
    }

    public function requests()
    {
        return $this->hasMany(ServiceRequest::class, 'extra_service_id');
    }
}

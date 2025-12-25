<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShipmentItem extends Model
{
    use HasFactory;

    protected $fillable = ['shipment_id', 'name', 'qty'];

    public function shipment()
    {
        return $this->belongsTo(Shipment::class);
    }
}

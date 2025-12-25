<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CarReportImage extends Model
{
    protected $fillable = ['car_id', 'image_path', 'file_size'];

    public function car()
    {
        return $this->belongsTo(Car::class);
    }
}

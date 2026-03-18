<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Exhibitor extends Model
{
     protected $fillable = [
        'name',
        'email',
        'password',
        'showroom_name',
        'showroom_address',
        'phone',
    ];

    protected $hidden = ['password'];
}

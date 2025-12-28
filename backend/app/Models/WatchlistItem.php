<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WatchlistItem extends Model
{
    protected $fillable = ['watchlist_menu_id', 'car_id'];

    public function menu()
    {
        return $this->belongsTo(WatchlistMenu::class, 'watchlist_menu_id');
    }

    public function car()
    {
        return $this->belongsTo(Car::class);
    }
}

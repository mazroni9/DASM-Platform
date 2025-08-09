<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MarketCategory extends Model
{
    protected $fillable =[
        'name','slug','is_active','description','sort_order'];

    // Define relationship to markets
    public function markets()
    {
        return $this->hasMany(Market::class, 'category_id');
    }

}

<?php

namespace App\Models;

use App\Enums\MarketLayoutType;
use Illuminate\Database\Eloquent\Model;

class Market extends Model
{
    protected $fillable = [
        'name',
        'category_id',
        'slug',
        'description',
        'icon',
        'color',
        'bg_color',
        'layout_type',
    ];

    protected $casts = [
        'layout_type' => MarketLayoutType::class,
    ];

    protected $appends = ['layout_type_value'];

    public function getLayoutTypeValueAttribute()
    {
        return $this->layout_type?->value;
    }

    public function category()
    {
        return $this->belongsTo(MarketCategory::class, 'category_id');
    }

    public function auctions()
    {
        return $this->hasMany(Auction::class);
    }
}

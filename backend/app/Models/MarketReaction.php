<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MarketReaction extends Model
{
    protected $table = 'market_reactions';

    public const TYPES = ['like', 'save', 'helpful'];

    protected $fillable = ['article_id', 'user_id', 'type'];

    public function article(): BelongsTo
    {
        return $this->belongsTo(MarketArticle::class, 'article_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }
}

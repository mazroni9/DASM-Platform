<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MarketArticleContext extends Model
{
    protected $table = 'market_article_contexts';

    protected $fillable = [
        'article_id',
        'context_type',
        'context_key',
    ];

    public function article(): BelongsTo
    {
        return $this->belongsTo(MarketArticle::class, 'article_id');
    }
}

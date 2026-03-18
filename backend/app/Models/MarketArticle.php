<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MarketArticle extends Model
{
    protected $table = 'market_articles';

    protected $fillable = [
        'category_id',
        'created_by_user_id',
        'title_ar',
        'title_en',
        'slug',
        'excerpt_ar',
        'excerpt_en',
        'content_ar',
        'content_en',
        'cover_image',
        'author_name',
        'read_time',
        'views_count',
        'likes_count',
        'comments_count',
        'saves_count',
        'helpful_count',
        'is_featured',
        'status',
        'published_at',
    ];

    protected $casts = [
        'read_time'     => 'integer',
        'views_count'   => 'integer',
        'likes_count'   => 'integer',
        'comments_count'=> 'integer',
        'saves_count'   => 'integer',
        'helpful_count' => 'integer',
        'is_featured'   => 'boolean',
        'published_at'  => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(MarketCategory::class, 'category_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(MarketComment::class, 'article_id');
    }

    public function contexts(): HasMany
    {
        return $this->hasMany(MarketArticleContext::class, 'article_id');
    }

    public function reactions(): HasMany
    {
        return $this->hasMany(MarketReaction::class, 'article_id');
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }
}

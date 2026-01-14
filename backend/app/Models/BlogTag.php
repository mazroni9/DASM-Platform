<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class BlogTag extends Model
{
    protected $table = 'blog_tags';

    protected $fillable = [
        'name',
    ];

    public function posts(): BelongsToMany
    {
        return $this->belongsToMany(
            BlogPost::class,
            'blog_post_tags',
            'blog_tag_id',
            'blog_post_id'
        );
    }
}

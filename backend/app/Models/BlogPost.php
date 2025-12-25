<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BlogPost extends Model
{
  protected $table = 'blog_posts';

  protected $fillable = [
    'category_id','title','slug','excerpt','content',
    'cover_image','is_published','published_at',
    'seo_title','seo_description'
  ];

  protected $casts = [
    'is_published' => 'boolean',
    'published_at' => 'datetime',
  ];

  public function category(): BelongsTo
  {
    return $this->belongsTo(BlogCategory::class, 'category_id');
  }
}

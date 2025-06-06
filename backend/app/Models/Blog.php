<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BlogPost extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'blogs';

    protected $fillable = [
        'title',
        'slug',
        'excerpt',
        'content',
        'status',
        'image',
        'user_id',
        'published_at',
        'views'
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    /**
     * Get the user who authored the blog post
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the tags for the blog post
     */
    public function tags()
    {
        return $this->belongsToMany(BlogTag::class, 'blog_post_tags', 'post_id', 'tag_id');
    }
    
    /**
     * Set the status attribute and update published_at date if status is published
     */
    public function setStatusAttribute($value)
    {
        $this->attributes['status'] = $value;
        
        // Set published_at date when status is set to published for the first time
        if ($value === 'published' && is_null($this->published_at)) {
            $this->attributes['published_at'] = now();
        }
    }
}
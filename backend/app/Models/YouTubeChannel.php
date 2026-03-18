<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class YouTubeChannel extends Model
{
    protected $table = 'youtube_channels';

    protected $fillable = [
        'organization_id',
        'name',
        'channel_id',
        'subscriber_count',
        'video_count',
        'last_video_date',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'subscriber_count' => 'integer',
        'video_count' => 'integer',
        'last_video_date' => 'datetime',
        'is_active' => 'boolean',
    ];
}

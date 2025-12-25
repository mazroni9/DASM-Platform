<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Venue extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'id',
        'name',
        'location',
        'thumbnail',
        'youtube_video_id',
        'viewers_count',
        'is_live',
        'details_url',
        'description',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'is_live' => 'boolean',
        'viewers_count' => 'integer',
    ];

    /**
     * Get the viewers for the venue.
     */
    public function viewers()
    {
        return $this->hasMany(VenueViewer::class);
    }

    /**
     * Get real-time count of active viewers within the last 5 minutes.
     */
    public function getActiveViewersCountAttribute()
    {
        // اعتبار المشاهد نشطا إذا كان آخر نشاط له خلال الـ 5 دقائق الماضية
        $activeTimeWindow = now()->subMinutes(5);

        return $this->viewers()
            ->where('last_active_at', '>=', $activeTimeWindow)
            ->count();
    }
}

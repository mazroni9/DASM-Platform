<?php

namespace Modules\Test\Entities;

use Modules\Test\Entities\Enums\TestCategory;
use Modules\Test\Entities\Enums\TestStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class AuctionTestResult extends Model
{
    use HasFactory;

    protected $table = 'auction_test_results';

    protected $fillable = [
        'test_name',
        'test_category',
        'status',
        'message',
        'details',
        'errors',
        'execution_time_ms',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'test_category' => TestCategory::class,
        'status' => TestStatus::class,
        'details' => 'array',
        'errors' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function scopeByCategory(Builder $query, string|TestCategory $category): Builder
    {
        $categoryValue = $category instanceof TestCategory ? $category->value : $category;
        return $query->where('test_category', $categoryValue);
    }

    public function scopeByStatus(Builder $query, string|TestStatus $status): Builder
    {
        $statusValue = $status instanceof TestStatus ? $status->value : $status;
        return $query->where('status', $statusValue);
    }

    public function scopeRecent(Builder $query, int $limit = 50): Builder
    {
        return $query->orderBy('created_at', 'desc')->limit($limit);
    }
}

<?php

namespace App\Console\Commands;

use App\Models\AuctionActivityLog;
use Carbon\Carbon;
use Illuminate\Console\Command;

/**
 * حذف سجلات auction_activity_logs الأقدم من keep_days (من config) أو من معامل --days.
 * يُنصح بتشغيله يوميًا أو أسبوعيًا عبر الـ Scheduler.
 */
class PruneAuctionActivityLogs extends Command
{
    protected $signature = 'auction-log:prune
                            {--days= : عدد الأيام (افتراضي: من config auction_log.keep_days)}
                            {--dry-run : عرض عدد السجلات التي ستُحذف دون تنفيذ}';

    protected $description = 'حذف سجلات نشاط المزادات الأقدم من X يوم (استبقاء حسب السياسة)';

    public function handle(): int
    {
        $days = (int) $this->option('days') ?: (int) config('auction_log.keep_days', 30);
        if ($days < 1) {
            $this->warn('يجب أن يكون عدد الأيام ≥ 1. استخدام 30.');

            $days = 30;
        }

        $before = Carbon::now()->subDays($days);

        $count = AuctionActivityLog::query()->where('occurred_at', '<', $before)->count();

        if ($count === 0) {
            $this->info("لا توجد سجلات أقدم من {$days} يوم.");

            return self::SUCCESS;
        }

        if ($this->option('dry-run')) {
            $this->info("[Dry run] سيتم حذف {$count} سجلًا أقدم من {$before->toDateString()}.");

            return self::SUCCESS;
        }

        $deleted = AuctionActivityLog::query()->where('occurred_at', '<', $before)->delete();
        $this->info("تم حذف {$deleted} سجلًا من auction_activity_logs.");

        return self::SUCCESS;
    }
}

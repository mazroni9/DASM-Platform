<?php

namespace Modules\Test\Services;

use App\Models\AuctionActivityLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Modules\Test\Entities\AuctionTestEvent;
use Modules\Test\Entities\AuctionTestResult;
use Modules\Test\Entities\AuctionTestRun;
use Modules\Test\Entities\Enums\TestStatus;

/**
 * تجميع KPIs لوحة تحليلية واحدة: runs + events + activity_logs + test_results.
 */
class AuctionTestingAnalyticsService
{
    /**
     * @param  int  $days  عدد الأيام للنطاق الزمني (افتراضي 30)
     * @return array{kpis: array, scenario_runs: array, test_suite_summary: array, activity_log_summary: array, charts: array}
     */
    public static function getAnalytics(int $days = 30): array
    {
        $since = Carbon::now()->subDays($days);

        $scenarioRuns = self::scenarioRunsKpis($since);
        $testSuiteSummary = self::testSuiteSummary();
        $activityLogSummary = self::activityLogSummary($since);
        $charts = self::chartsData($since);

        $kpis = [
            'scenario_runs_total' => $scenarioRuns['total_runs'],
            'scenario_runs_completed' => $scenarioRuns['completed_runs'],
            'scenario_runs_failed' => $scenarioRuns['failed_runs'],
            'scenario_success_rate_percent' => $scenarioRuns['success_rate_percent'],
            'scenario_avg_latency_ms' => $scenarioRuns['avg_latency_ms'],
            'scenario_avg_bids_per_minute' => $scenarioRuns['avg_bids_per_minute'],
            'scenario_total_bids' => $scenarioRuns['total_bids'],
            'test_suite_total' => $testSuiteSummary['total'],
            'test_suite_passed' => $testSuiteSummary['passed'],
            'test_suite_failed' => $testSuiteSummary['failed'],
            'test_suite_success_rate_percent' => $testSuiteSummary['success_rate_percent'],
            'activity_logs_total' => $activityLogSummary['total'],
            'activity_logs_by_type' => $activityLogSummary['by_event_type'],
        ];

        return [
            'kpis' => $kpis,
            'scenario_runs' => $scenarioRuns,
            'test_suite_summary' => $testSuiteSummary,
            'activity_log_summary' => $activityLogSummary,
            'charts' => $charts,
            'period_days' => $days,
        ];
    }

    protected static function scenarioRunsKpis(Carbon $since): array
    {
        $runs = AuctionTestRun::query()
            ->where('started_at', '>=', $since)
            ->get();

        $total = $runs->count();
        $completed = $runs->filter(fn ($r) => in_array($r->status, ['completed', 'passed'], true))->count();
        $failed = $runs->where('status', 'failed')->count();
        $successRate = $total > 0 ? round(($completed / $total) * 100, 1) : null;

        $withLatency = $runs->filter(fn ($r) => $r->avg_latency_ms !== null);
        $avgLatency = $withLatency->isNotEmpty()
            ? (int) round($withLatency->avg('avg_latency_ms'))
            : null;

        $totalBids = $runs->sum('total_bids');
        $bidsPerMinuteList = $runs->filter(fn ($r) => $r->duration_seconds > 0 && $r->total_bids > 0)
            ->map(fn ($r) => $r->total_bids / ($r->duration_seconds / 60));
        $avgBidsPerMinute = $bidsPerMinuteList->isNotEmpty()
            ? round($bidsPerMinuteList->avg(), 1)
            : null;

        $byScenario = $runs->groupBy('scenario_key')->map(fn ($group) => [
            'count' => $group->count(),
            'completed' => $group->filter(fn ($r) => in_array($r->status, ['completed', 'passed'], true))->count(),
            'avg_latency_ms' => $group->avg('avg_latency_ms') ? (int) round($group->avg('avg_latency_ms')) : null,
        ])->all();

        return [
            'total_runs' => $total,
            'completed_runs' => $completed,
            'failed_runs' => $failed,
            'success_rate_percent' => $successRate,
            'avg_latency_ms' => $avgLatency,
            'avg_bids_per_minute' => $avgBidsPerMinute,
            'total_bids' => $totalBids,
            'by_scenario_key' => $byScenario,
        ];
    }

    protected static function testSuiteSummary(): array
    {
        $total = AuctionTestResult::count();
        $passed = AuctionTestResult::where('status', TestStatus::PASSED->value)->count();
        $failed = AuctionTestResult::where('status', TestStatus::FAILED->value)->count();
        $successRate = $total > 0 ? round(($passed / $total) * 100, 1) : null;

        $byCategory = AuctionTestResult::query()
            ->select('test_category', DB::raw('count(*) as total'), DB::raw('sum(case when status = \'passed\' then 1 else 0 end) as passed'))
            ->groupBy('test_category')
            ->get()
            ->mapWithKeys(fn ($r) => [$r->test_category => ['total' => $r->total, 'passed' => $r->passed]])
            ->all();

        return [
            'total' => $total,
            'passed' => $passed,
            'failed' => $failed,
            'success_rate_percent' => $successRate,
            'by_category' => $byCategory,
        ];
    }

    protected static function activityLogSummary(Carbon $since): array
    {
        $total = AuctionActivityLog::query()->where('occurred_at', '>=', $since)->count();

        $byType = AuctionActivityLog::query()
            ->where('occurred_at', '>=', $since)
            ->select('event_type', DB::raw('count(*) as count'))
            ->groupBy('event_type')
            ->orderByDesc('count')
            ->get()
            ->pluck('count', 'event_type')
            ->all();

        return [
            'total' => $total,
            'by_event_type' => $byType,
        ];
    }

    protected static function chartsData(Carbon $since): array
    {
        $runsPerDay = AuctionTestRun::query()
            ->where('started_at', '>=', $since)
            ->select(DB::raw('date(started_at) as day'), DB::raw('count(*) as runs'), DB::raw('sum(total_bids) as bids'))
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(fn ($r) => [
                'date' => $r->day,
                'runs' => $r->runs,
                'bids' => (int) $r->bids,
            ])
            ->values()
            ->all();

        $activityPerDay = AuctionActivityLog::query()
            ->where('occurred_at', '>=', $since)
            ->select(DB::raw('date(occurred_at) as day'), DB::raw('count(*) as events'))
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(fn ($r) => ['date' => $r->day, 'events' => $r->events])
            ->values()
            ->all();

        return [
            'scenario_runs_per_day' => $runsPerDay,
            'activity_log_events_per_day' => $activityPerDay,
        ];
    }
}

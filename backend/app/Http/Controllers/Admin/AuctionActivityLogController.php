<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuctionActivityLog;
use App\Models\Setting;
use App\Services\AuctionActivityAnalyticsService;
use App\Services\AuctionRealtimeLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuctionActivityLogController extends Controller
{
    /**
     * قائمة سجلات النشاط (مع pagination وفلترة).
     */
    public function index(Request $request): JsonResponse
    {
        $query = AuctionActivityLog::query()->orderBy('occurred_at', 'desc');

        if ($request->filled('event_type')) {
            $query->where('event_type', $request->event_type);
        }
        if ($request->filled('subject_type')) {
            $query->where('subject_type', $request->subject_type);
        }
        if ($request->filled('subject_id')) {
            $query->where('subject_id', (int) $request->subject_id);
        }
        if ($request->filled('since')) {
            $query->where('occurred_at', '>=', $request->since);
        }

        $perPage = min(max((int) $request->get('per_page', 20), 1), 100);
        $logs = $query->paginate($perPage);

        $items = $logs->getCollection()->map(fn ($log) => [
            'id' => $log->id,
            'event_type' => $log->event_type,
            'subject_type' => $log->subject_type,
            'subject_id' => $log->subject_id,
            'payload' => $log->payload,
            'occurred_at' => $log->occurred_at?->toIso8601String(),
        ]);

        return response()->json([
            'status' => 'success',
            'data' => $items,
            'pagination' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'from' => $logs->firstItem(),
                'to' => $logs->lastItem(),
            ],
        ]);
    }

    /**
     * حالة تفعيل السجل الفوري (من الإعدادات).
     */
    public function config(): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => [
                'enabled' => AuctionRealtimeLogService::isEnabled(),
                'channel' => config('auction_log.channel'),
                'queue' => config('auction_log.queue'),
            ],
        ]);
    }

    /**
     * تفعيل أو إيقاف السجل الفوري.
     */
    public function updateConfig(Request $request): JsonResponse
    {
        $request->validate([
            'enabled' => 'required|boolean',
        ]);

        Setting::setValue('auction_realtime_log_enabled', $request->boolean('enabled') ? '1' : '0');
        AuctionRealtimeLogService::clearEnabledCache();

        return response()->json([
            'status' => 'success',
            'message' => $request->boolean('enabled') ? 'تم تفعيل السجل الفوري' : 'تم إيقاف السجل الفوري',
            'data' => [
                'enabled' => AuctionRealtimeLogService::isEnabled(),
            ],
        ]);
    }

    /**
     * تقرير تحليلي Business-ready: حركة الأسعار وسلوك المزايدة من auction_activity_logs.
     * مقاييس: عدد المزايدات، الزمن بين السومات، أنماط الأحداث، حركة السعر (أول/آخر مزايدة).
     *
     * Query: auction_id (optional), since (optional), until (optional), include_timeline (optional, default false), limit_auctions (optional, default 50)
     */
    public function analytics(Request $request): JsonResponse
    {
        $auctionId = $request->filled('auction_id')
            ? (is_array($request->auction_id) ? $request->auction_id : [(int) $request->auction_id])
            : null;
        $since = $request->filled('since') ? $request->since : null;
        $until = $request->filled('until') ? $request->until : null;
        $includeTimeline = $request->boolean('include_timeline', false);
        $limitAuctions = min(max((int) $request->get('limit_auctions', 50), 1), 200);

        $result = AuctionActivityAnalyticsService::analyze($auctionId, $since, $until, $limitAuctions);

        if (! $includeTimeline) {
            foreach ($result['by_auction'] as &$row) {
                unset($row['bid_timeline']);
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => $result,
        ]);
    }
}

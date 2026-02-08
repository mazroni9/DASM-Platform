<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuctionActivityLog;
use App\Models\Setting;
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
}

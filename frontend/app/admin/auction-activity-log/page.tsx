'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import Pusher from 'pusher-js';

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '';
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || 'ap2';
const CHANNEL = 'admin.auction-log';
const EVENT_NAME = 'AuctionActivityLogged';

interface LogEntry {
  id: number;
  event_type: string;
  subject_type: string | null;
  subject_id: number | null;
  payload: Record<string, unknown>;
  occurred_at: string;
}

interface ConfigState {
  enabled: boolean;
  channel: string;
  queue: string;
}

const EVENT_LABELS: Record<string, string> = {
  bid_placed: 'مزايدة مقبولة',
  bid_rejected: 'مزايدة مرفوضة',
  bid_auto_accepted: 'مزايدة مقبولة تلقائياً',
  auction_started: 'بدء المزاد',
  auction_ended: 'انتهاء المزاد',
  auction_failed: 'فشل المزاد (تحت السعر الاحتياطي)',
};

export default function AuctionActivityLogPage() {
  const [config, setConfig] = useState<ConfigState>({ enabled: false, channel: CHANNEL, queue: 'auction-log' });
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [liveLogs, setLiveLogs] = useState<LogEntry[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
    from: null as number | null,
    to: null as number | null,
  });
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [connected, setConnected] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const { data } = await axios.get<{ status: string; data: ConfigState }>('/api/admin/auction-activity-log/config');
      setConfig(data.data);
    } catch {
      toast.error('فشل تحميل الإعدادات');
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  const fetchLogs = useCallback(async (page = 1) => {
    setLoadingLogs(true);
    try {
      const { data } = await axios.get<{
        status: string;
        data: LogEntry[];
        pagination: typeof pagination;
      }>(`/api/admin/auction-activity-log?page=${page}&per_page=20`);
      setLogs(data.data || []);
      setPagination(data.pagination || pagination);
    } catch {
      toast.error('فشل تحميل السجلات');
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleToggle = async (enabled: boolean) => {
    setToggling(true);
    try {
      const { data } = await axios.put<{ status: string; message: string; data: { enabled: boolean } }>(
        '/api/admin/auction-activity-log/config',
        { enabled }
      );
      setConfig((c) => ({ ...c, enabled: data.data.enabled }));
      toast.success(data.message);
      if (data.data.enabled) fetchLogs(1);
    } catch {
      toast.error('فشل تحديث الإعداد');
    } finally {
      setToggling(false);
    }
  };

  // Real-time: subscribe to channel when config is enabled
  useEffect(() => {
    if (!config.enabled || !PUSHER_KEY) return;

    const pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER });
    const channel = pusher.subscribe(CHANNEL);

    channel.bind('pusher:subscription_succeeded', () => setConnected(true));
    channel.bind('pusher:error', () => setConnected(false));

    channel.bind(EVENT_NAME, (payload: Record<string, unknown>) => {
      const entry: LogEntry = {
        id: payload.id as number,
        event_type: (payload.event_type as string) || '',
        subject_type: (payload.subject_type as string) || null,
        subject_id: (payload.subject_id as number) || null,
        payload: (payload.payload as Record<string, unknown>) || {},
        occurred_at: (payload.occurred_at as string) || new Date().toISOString(),
      };
      setLiveLogs((prev) => [entry, ...prev].slice(0, 200));
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
      setConnected(false);
      setLiveLogs([]);
    };
  }, [config.enabled]);

  const displayLogs = config.enabled && liveLogs.length > 0 ? liveLogs : logs;
  const showLive = config.enabled && liveLogs.length > 0;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">سجل المزادات الفوري</h1>
        <p className="text-muted-foreground text-sm mt-1">
          مراقبة منطق المزادات: مزايدات، بدء/انتهاء المزاد. يعمل عبر Queue ولا يُفعّل افتراضياً لتفادي ضغط السيرفر.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">التفعيل</CardTitle>
          <p className="text-sm text-muted-foreground">
            عند التفعيل يتم تسجيل كل مزايدة وتغيير حالة المزاد وبثها هنا فوراً. أوقف التشغيل عندما لا تحتاج المراقبة.
          </p>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          {loadingConfig ? (
            <span className="text-sm text-muted-foreground">جاري التحميل...</span>
          ) : (
            <>
              <Switch
                id="realtime-log-enabled"
                checked={config.enabled}
                onCheckedChange={handleToggle}
                disabled={toggling}
              />
              <Label htmlFor="realtime-log-enabled" className="cursor-pointer">
                {config.enabled ? 'السجل الفوري مفعّل' : 'السجل الفوري متوقف'}
              </Label>
              {config.enabled && (
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-amber-500'}`} />
                  <span>{connected ? 'متصل بالبث المباشر' : 'جاري الاتصال...'}</span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{showLive ? 'البث المباشر (آخر 200)' : 'آخر السجلات'}</CardTitle>
          {!showLive && (
            <Button variant="outline" size="sm" onClick={() => fetchLogs(pagination.current_page)} disabled={loadingLogs}>
              تحديث
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loadingLogs && logs.length === 0 && !showLive ? (
            <p className="text-sm text-muted-foreground py-8 text-center">جاري التحميل...</p>
          ) : displayLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {config.enabled ? 'لا أحداث بعد. ستظهر هنا عند حدوث مزايدات أو تغيير حالة المزاد.' : 'فعّل السجل الفوري أو راجع السجلات المحفوظة من قبل.'}
            </p>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-2 px-2">الوقت</th>
                    <th className="text-right py-2 px-2">الحدث</th>
                    <th className="text-right py-2 px-2">الموضوع</th>
                    <th className="text-right py-2 px-2 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {displayLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border/50">
                      <td className="py-2 px-2 text-muted-foreground whitespace-nowrap">
                        {new Date(log.occurred_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'medium' })}
                      </td>
                      <td className="py-2 px-2">
                        <span className="font-medium">{EVENT_LABELS[log.event_type] || log.event_type}</span>
                      </td>
                      <td className="py-2 px-2">
                        {log.subject_type && (
                          <span>
                            {log.subject_type} #{log.subject_id}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                        >
                          {expandedId === log.id ? 'إخفاء' : 'تفاصيل'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {expandedId != null && (
                <div className="mt-2 p-3 bg-muted/50 rounded-lg text-xs font-mono overflow-x-auto">
                  <pre>{JSON.stringify(displayLogs.find((l) => l.id === expandedId)?.payload ?? {}, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
          {!showLive && pagination.last_page > 1 && (
            <div className="flex items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.current_page <= 1}
                onClick={() => fetchLogs(pagination.current_page - 1)}
              >
                السابق
              </Button>
              <span className="text-sm text-muted-foreground">
                {pagination.current_page} / {pagination.last_page} (إجمالي {pagination.total})
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => fetchLogs(pagination.current_page + 1)}
              >
                التالي
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

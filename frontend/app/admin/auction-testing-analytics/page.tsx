'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import toast from 'react-hot-toast';
import { BarChart3, RefreshCw, TestTube, Activity, Zap } from 'lucide-react';

interface AnalyticsData {
  kpis: {
    scenario_runs_total: number;
    scenario_runs_completed: number;
    scenario_runs_failed: number;
    scenario_success_rate_percent: number | null;
    scenario_avg_latency_ms: number | null;
    scenario_avg_bids_per_minute: number | null;
    scenario_total_bids: number;
    test_suite_total: number;
    test_suite_passed: number;
    test_suite_failed: number;
    test_suite_success_rate_percent: number | null;
    activity_logs_total: number;
    activity_logs_by_type: Record<string, number>;
  };
  scenario_runs: {
    by_scenario_key: Record<string, { count: number; completed: number; avg_latency_ms: number | null }>;
  };
  test_suite_summary: {
    by_category: Record<string, { total: number; passed: number }>;
  };
  charts: {
    scenario_runs_per_day: { date: string; runs: number; bids: number }[];
    activity_log_events_per_day: { date: string; events: number }[];
  };
  period_days: number;
}

export default function AuctionTestingAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await axios.get<{ status: string; data: AnalyticsData }>(
        `/api/admin/auction-testing-analytics?days=${days}`
      );
      setData(res.data);
    } catch {
      toast.error('فشل تحميل التحليلات');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading && !data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const kpis = data?.kpis;
  const charts = data?.charts;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <BarChart3 className="h-7 w-7" />
          تحليلات اختبارات المزادات
        </h1>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">الفترة:</Label>
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 أيام</SelectItem>
              <SelectItem value="30">30 يوم</SelectItem>
              <SelectItem value="90">90 يوم</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={() => fetchAnalytics()}
            disabled={loading}
            className="p-2 rounded-md border hover:bg-muted"
            title="تحديث"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {!data && !loading && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            لا توجد بيانات للفترة المحددة.
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {/* KPIs: سيناريوهات */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  إجمالي تشغيلات السيناريوهات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{kpis?.scenario_runs_total ?? 0}</p>
                <p className="text-xs text-muted-foreground">
                  نجح: {kpis?.scenario_runs_completed ?? 0} | فشل: {kpis?.scenario_runs_failed ?? 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">نسبة نجاح السيناريوهات</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {kpis?.scenario_success_rate_percent != null
                    ? `${kpis.scenario_success_rate_percent}%`
                    : '—'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">متوسط زمن الاستجابة (ms)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {kpis?.scenario_avg_latency_ms != null ? kpis.scenario_avg_latency_ms : '—'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">متوسط مزايدات/دقيقة</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {kpis?.scenario_avg_bids_per_minute != null
                    ? kpis.scenario_avg_bids_per_minute.toFixed(1)
                    : '—'}
                </p>
                <p className="text-xs text-muted-foreground">
                  إجمالي المزايدات: {kpis?.scenario_total_bids ?? 0}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* KPIs: اختبارات المنطق + سجل النشاط */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1">
                  <TestTube className="h-4 w-4" />
                  اختبارات المنطق (إجمالي التشغيلات)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{kpis?.test_suite_total ?? 0}</p>
                <p className="text-xs text-muted-foreground">
                  نجح: {kpis?.test_suite_passed ?? 0} | فشل: {kpis?.test_suite_failed ?? 0} —{' '}
                  {kpis?.test_suite_success_rate_percent != null
                    ? `${kpis.test_suite_success_rate_percent}%`
                    : '—'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  أحداث سجل النشاط (الفترة)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{kpis?.activity_logs_total ?? 0}</p>
                {kpis?.activity_logs_by_type &&
                  Object.keys(kpis.activity_logs_by_type).length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      حسب النوع:{' '}
                      {Object.entries(kpis.activity_logs_by_type)
                        .slice(0, 3)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' | ')}
                    </p>
                  )}
              </CardContent>
            </Card>
          </div>

          {/* جداول: تشغيلات حسب اليوم، أحداث السجل حسب اليوم */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">تشغيلات السيناريوهات حسب اليوم</CardTitle>
              </CardHeader>
              <CardContent>
                {charts?.scenario_runs_per_day?.length ? (
                  <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right py-2 px-2">التاريخ</th>
                          <th className="text-right py-2 px-2">عدد التشغيلات</th>
                          <th className="text-right py-2 px-2">المزايدات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {charts.scenario_runs_per_day.map((row) => (
                          <tr key={row.date} className="border-b">
                            <td className="py-1 px-2">{row.date}</td>
                            <td className="py-1 px-2">{row.runs}</td>
                            <td className="py-1 px-2">{row.bids}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">لا توجد بيانات في الفترة المحددة.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">أحداث سجل النشاط حسب اليوم</CardTitle>
              </CardHeader>
              <CardContent>
                {charts?.activity_log_events_per_day?.length ? (
                  <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right py-2 px-2">التاريخ</th>
                          <th className="text-right py-2 px-2">عدد الأحداث</th>
                        </tr>
                      </thead>
                      <tbody>
                        {charts.activity_log_events_per_day.map((row) => (
                          <tr key={row.date} className="border-b">
                            <td className="py-1 px-2">{row.date}</td>
                            <td className="py-1 px-2">{row.events}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">لا توجد بيانات في الفترة المحددة.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

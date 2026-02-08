'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { TestSummaryCard, TestDataTable, TestDetailsModal } from '@/modules/test';
import { useTestResults, useTestRunner, useTestWebSocket } from '@/modules/test';
import type {
  TestResult,
  ScenarioDefinition,
  ScenarioRunSummary,
  ScenarioRunDetail,
} from '@/modules/test/types';
import { TestCategory } from '@/modules/test/types';
import { auctionTestsApi } from '@/modules/test/api/auctionTestsApi';
import toast from 'react-hot-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function AuctionTestsPage() {
  const [selectedCategory, setSelectedCategory] = useState<TestCategory | undefined>();
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 15;

  // Scenario runs state
  const [scenarios, setScenarios] = useState<ScenarioDefinition[]>([]);
  const [scenarioRuns, setScenarioRuns] = useState<ScenarioRunSummary[]>([]);
  const [scenarioRunsPagination, setScenarioRunsPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: null as number | null,
    to: null as number | null,
  });
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<string>('');
  const [scenarioUserCount, setScenarioUserCount] = useState<string>('');
  const [scenarioDuration, setScenarioDuration] = useState<string>('');
  const [scenarioRunning, setScenarioRunning] = useState(false);
  const [scenarioRunsLoading, setScenarioRunsLoading] = useState(false);
  const [selectedRunDetail, setSelectedRunDetail] = useState<ScenarioRunDetail | null>(null);
  const [scenarioRunsPage, setScenarioRunsPage] = useState(1);

  const { results, summary, pagination, loading, error, refetch } = useTestResults({
    category: selectedCategory,
    page: currentPage,
    perPage,
  });

  const { running, runAll } = useTestRunner();
  const { connected, latestResult } = useTestWebSocket();

  useEffect(() => {
    if (latestResult) {
      refetch();
    }
  }, [latestResult, refetch]);

  // Load scenarios list once
  useEffect(() => {
    auctionTestsApi.getScenarios().then((res) => setScenarios(res.data || [])).catch(() => {});
  }, []);

  const fetchScenarioRuns = useCallback(async () => {
    setScenarioRunsLoading(true);
    try {
      const res = await auctionTestsApi.getScenarioRuns({
        page: scenarioRunsPage,
        per_page: 10,
      });
      setScenarioRuns(res.data || []);
      setScenarioRunsPagination(res.pagination || scenarioRunsPagination);
    } finally {
      setScenarioRunsLoading(false);
    }
  }, [scenarioRunsPage]);

  useEffect(() => {
    fetchScenarioRuns();
  }, [fetchScenarioRuns]);

  const handleRunScenario = useCallback(async () => {
    if (!selectedScenarioKey) {
      toast.error('اختر سيناريو');
      return;
    }
    setScenarioRunning(true);
    try {
      const body: { scenario_key: string; user_count?: number; duration_seconds?: number } = {
        scenario_key: selectedScenarioKey,
      };
      if (scenarioUserCount.trim()) body.user_count = parseInt(scenarioUserCount, 10);
      if (scenarioDuration.trim()) body.duration_seconds = parseInt(scenarioDuration, 10);
      const res = await auctionTestsApi.runScenario(body);
      toast.success(res.message || 'تم تشغيل السيناريو');
      await fetchScenarioRuns();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'فشل تشغيل السيناريو';
      toast.error(msg || 'فشل تشغيل السيناريو');
    } finally {
      setScenarioRunning(false);
    }
  }, [selectedScenarioKey, scenarioUserCount, scenarioDuration, fetchScenarioRuns]);

  const handleViewRunDetail = useCallback(async (id: number) => {
    try {
      const res = await auctionTestsApi.getScenarioRun(id);
      setSelectedRunDetail(res.data);
    } catch {
      toast.error('فشل تحميل التفاصيل');
    }
  }, []);

  const handleRunAll = useCallback(async () => {
    const results = await runAll();
    if (results) {
      await refetch();
      toast.success('تم تشغيل جميع الاختبارات بنجاح');
    }
  }, [runAll, refetch]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await auctionTestsApi.delete(id);
      toast.success('تم حذف نتيجة الاختبار بنجاح');
      await refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'فشل حذف نتيجة الاختبار');
    }
  }, [refetch]);

  const handleBulkDelete = useCallback(async (ids: number[]) => {
    try {
      const response = await auctionTestsApi.bulkDelete(ids);
      toast.success(response.message || `تم حذف ${ids.length} نتيجة بنجاح`);
      await refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'فشل حذف النتائج');
    }
  }, [refetch]);

  const categoryButtons = useMemo(() => {
    const categories = Object.values(TestCategory);
    return categories.map(cat => ({
      value: cat,
      label: cat === TestCategory.LOGIC ? 'منطق المزادات' :
             cat === TestCategory.TRANSITIONS ? 'الانتقال بين الأنواع' :
             cat === TestCategory.PRICE_UPDATES ? 'تحديثات الأسعار' :
             cat === TestCategory.STATE_CONSISTENCY ? 'استقرار الحالات' : cat
    }));
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">اختبارات المزادات</h1>
          <p className="text-gray-600 text-sm md:text-base">
            مراقبة واختبار منطق المزادات في الوقت الفعلي
          </p>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100">
            <div
              className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                connected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-xs md:text-sm text-gray-700 font-medium">
              {connected ? 'متصل' : 'غير متصل'}
            </span>
          </div>
          <Button 
            onClick={handleRunAll} 
            disabled={running}
            size="lg"
            className="shadow-md"
          >
            {running ? 'جاري التشغيل...' : 'تشغيل كل الاختبارات'}
          </Button>
        </div>
      </div>

      <TestSummaryCard summary={summary} />

      {/* تشغيل سيناريوهات الحمل */}
      <div className="rounded-xl border border-border bg-card p-4 md:p-6 space-y-4">
        <h2 className="text-xl font-bold text-foreground">تشغيل سيناريوهات الحمل</h2>
        <p className="text-sm text-muted-foreground">
          إنشاء مزاد تجريبي ومزايدين افتراضيين وضخ مزايدات حسب السيناريو لقياس الأداء (latency، نجاح/فشل).
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5 min-w-[180px]">
            <Label>السيناريو</Label>
            <Select value={selectedScenarioKey} onValueChange={setSelectedScenarioKey}>
              <SelectTrigger>
                <SelectValue placeholder="اختر سيناريو" />
              </SelectTrigger>
              <SelectContent>
                {scenarios.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.name_ar} ({s.name_en})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 w-28">
            <Label>عدد المزايدين (اختياري)</Label>
            <Input
              type="number"
              min={1}
              max={500}
              placeholder={scenarios.find((s) => s.key === selectedScenarioKey)?.default_users?.toString() ?? ''}
              value={scenarioUserCount}
              onChange={(e) => setScenarioUserCount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 w-28">
            <Label>المدة (ثانية، اختياري)</Label>
            <Input
              type="number"
              min={10}
              max={3600}
              placeholder={scenarios.find((s) => s.key === selectedScenarioKey)?.default_duration_seconds?.toString() ?? ''}
              value={scenarioDuration}
              onChange={(e) => setScenarioDuration(e.target.value)}
            />
          </div>
          <Button onClick={handleRunScenario} disabled={scenarioRunning}>
            {scenarioRunning ? 'جاري التشغيل...' : 'تشغيل السيناريو'}
          </Button>
        </div>
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">سجل التشغيلات</h3>
            <Button variant="ghost" size="sm" onClick={fetchScenarioRuns} disabled={scenarioRunsLoading}>
              تحديث
            </Button>
          </div>
          {scenarioRunsLoading ? (
            <p className="text-sm text-muted-foreground py-4">جاري التحميل...</p>
          ) : scenarioRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">لا توجد تشغيلات بعد.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-2 px-2">#</th>
                    <th className="text-right py-2 px-2">السيناريو</th>
                    <th className="text-right py-2 px-2">الحالة</th>
                    <th className="text-right py-2 px-2">المزايدات</th>
                    <th className="text-right py-2 px-2">متوسط التأخير</th>
                    <th className="text-right py-2 px-2">البداية</th>
                    <th className="text-right py-2 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {scenarioRuns.map((r) => (
                    <tr key={r.id} className="border-b border-border/50">
                      <td className="py-2 px-2">{r.id}</td>
                      <td className="py-2 px-2">{r.scenario_key}</td>
                      <td className="py-2 px-2">
                        <span
                          className={
                            r.status === 'completed'
                              ? 'text-green-600'
                              : r.status === 'failed'
                                ? 'text-red-600'
                                : 'text-amber-600'
                          }
                        >
                          {r.status === 'completed' ? 'مكتمل' : r.status === 'failed' ? 'فشل' : 'جاري'}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        {r.total_bids != null ? `${r.successful_bids ?? 0}/${r.total_bids}` : '—'}
                      </td>
                      <td className="py-2 px-2">
                        {r.avg_latency_ms != null ? `${r.avg_latency_ms} ms` : '—'}
                      </td>
                      <td className="py-2 px-2">
                        {r.started_at
                          ? new Date(r.started_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })
                          : '—'}
                      </td>
                      <td className="py-2 px-2">
                        <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => handleViewRunDetail(r.id)}>
                          تفاصيل
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {scenarioRunsPagination.last_page > 1 && (
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={scenarioRunsPage <= 1}
                onClick={() => setScenarioRunsPage((p) => Math.max(1, p - 1))}
              >
                السابق
              </Button>
              <span className="text-sm text-muted-foreground">
                {scenarioRunsPagination.current_page} / {scenarioRunsPagination.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={scenarioRunsPage >= scenarioRunsPagination.last_page}
                onClick={() => setScenarioRunsPage((p) => p + 1)}
              >
                التالي
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">نتائج الاختبارات</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === undefined ? 'default' : 'outline'}
              onClick={() => {
                setSelectedCategory(undefined);
                setCurrentPage(1);
              }}
              size="sm"
              className="shadow-sm"
            >
              الكل
            </Button>
            {categoryButtons.map((category) => (
              <Button
                key={category.value}
                variant={selectedCategory === category.value ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedCategory(category.value as TestCategory);
                  setCurrentPage(1);
                }}
                size="sm"
                className="shadow-sm"
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
              {error}
            </div>
          </div>
        ) : (
          <TestDataTable
            results={results}
            pagination={pagination}
            loading={loading}
            selectedCategory={selectedCategory}
            onPageChange={setCurrentPage}
            onViewDetails={setSelectedTest}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
          />
        )}
      </div>

      <TestDetailsModal
        test={selectedTest}
        open={!!selectedTest}
        onClose={() => setSelectedTest(null)}
      />

      <Dialog open={!!selectedRunDetail} onOpenChange={(open) => !open && setSelectedRunDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل تشغيل السيناريو #{selectedRunDetail?.id}</DialogTitle>
          </DialogHeader>
          {selectedRunDetail && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">السيناريو:</span>
                <span>{selectedRunDetail.scenario_key}</span>
                <span className="text-muted-foreground">الحالة:</span>
                <span>{selectedRunDetail.status}</span>
                <span className="text-muted-foreground">عدد المستخدمين:</span>
                <span>{selectedRunDetail.user_count}</span>
                <span className="text-muted-foreground">المدة (ثانية):</span>
                <span>{selectedRunDetail.duration_seconds}</span>
                <span className="text-muted-foreground">إجمالي المزايدات:</span>
                <span>{selectedRunDetail.total_bids ?? '—'}</span>
                <span className="text-muted-foreground">ناجحة / مرفوضة:</span>
                <span>{selectedRunDetail.successful_bids ?? 0} / {selectedRunDetail.failed_bids ?? 0}</span>
                <span className="text-muted-foreground">متوسط التأخير:</span>
                <span>{selectedRunDetail.avg_latency_ms != null ? `${selectedRunDetail.avg_latency_ms} ms` : '—'}</span>
                <span className="text-muted-foreground">أقصى تأخير:</span>
                <span>{selectedRunDetail.max_latency_ms != null ? `${selectedRunDetail.max_latency_ms} ms` : '—'}</span>
                {selectedRunDetail.error_message && (
                  <>
                    <span className="text-muted-foreground">رسالة الخطأ:</span>
                    <span className="text-red-600">{selectedRunDetail.error_message}</span>
                  </>
                )}
              </div>
              {selectedRunDetail.events?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-1">الأحداث ({selectedRunDetail.events.length})</h4>
                  <div className="max-h-48 overflow-y-auto rounded border p-2 space-y-1">
                    {selectedRunDetail.events.slice(0, 50).map((e) => (
                      <div key={e.id} className="flex gap-2 text-xs">
                        <span className="text-muted-foreground">{e.event_type}</span>
                        {e.latency_ms != null && <span>{e.latency_ms} ms</span>}
                        {e.bid_amount != null && <span>{e.bid_amount}</span>}
                        {e.message && <span className="text-amber-600">{e.message}</span>}
                      </div>
                    ))}
                    {selectedRunDetail.events.length > 50 && (
                      <p className="text-muted-foreground">... و {selectedRunDetail.events.length - 50} حدث آخر</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

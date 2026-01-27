'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { TestSummaryCard, TestDataTable, TestDetailsModal } from '@/modules/test';
import { useTestResults, useTestRunner, useTestWebSocket } from '@/modules/test';
import type { TestResult } from '@/modules/test/types';
import { TestCategory } from '@/modules/test/types';
import { auctionTestsApi } from '@/modules/test/api/auctionTestsApi';
import toast from 'react-hot-toast';

export default function AuctionTestsPage() {
  const [selectedCategory, setSelectedCategory] = useState<TestCategory | undefined>();
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 15;

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
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { auctionTestsApi } from '../api/auctionTestsApi';
import type { TestResult, TestSummary, TestFilters, TestPagination } from '../types';

interface UseTestResultsReturn {
  results: TestResult[];
  summary: TestSummary;
  pagination: TestPagination | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseTestResultsOptions extends TestFilters {
  page?: number;
  perPage?: number;
}

export function useTestResults(options?: UseTestResultsOptions): UseTestResultsReturn {
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<TestSummary>({
    total: 0,
    passed: 0,
    failed: 0,
    pending: 0,
    running: 0,
  });
  const [pagination, setPagination] = useState<TestPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await auctionTestsApi.getResults({
        category: options?.category,
        status: options?.status,
        page: options?.page || 1,
        per_page: options?.perPage || 15,
      });

      setResults(response.data);
      setSummary(response.summary);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'فشل تحميل نتائج الاختبارات');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [options?.category, options?.status, options?.page, options?.perPage]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return {
    results,
    summary,
    pagination,
    loading,
    error,
    refetch: fetchResults,
  };
}

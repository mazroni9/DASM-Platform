import { useState, useCallback } from 'react';
import { auctionTestsApi } from '../api/auctionTestsApi';
import type { TestResult } from '../types';

interface UseTestRunnerReturn {
  running: boolean;
  runningCategory: string | null;
  error: string | null;
  runAll: () => Promise<TestResult[] | null>;
  runCategory: (category: string) => Promise<TestResult | null>;
}

export function useTestRunner(): UseTestRunnerReturn {
  const [running, setRunning] = useState(false);
  const [runningCategory, setRunningCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAll = useCallback(async (): Promise<TestResult[] | null> => {
    try {
      setRunning(true);
      setRunningCategory(null);
      setError(null);

      const response = await auctionTestsApi.runAll();
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'فشل تشغيل الاختبارات');
      return null;
    } finally {
      setRunning(false);
      setRunningCategory(null);
    }
  }, []);

  const runCategory = useCallback(async (category: string): Promise<TestResult | null> => {
    try {
      setRunningCategory(category);
      setError(null);

      const response = await auctionTestsApi.runCategory(category);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'فشل تشغيل الاختبار');
      return null;
    } finally {
      setRunningCategory(null);
    }
  }, []);

  return {
    running,
    runningCategory,
    error,
    runAll,
    runCategory,
  };
}

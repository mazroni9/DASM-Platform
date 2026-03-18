'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { X, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TestResult, TestCaseResult } from '../types';

interface TestDetailsModalProps {
  test: TestResult | null;
  open: boolean;
  onClose: () => void;
}

export function TestDetailsModal({ test, open, onClose }: TestDetailsModalProps) {
  if (!test) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300';
      case 'failed':
        return 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300';
      case 'running':
        return 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'passed':
        return 'نجح';
      case 'failed':
        return 'فشل';
      case 'running':
        return 'قيد التشغيل';
      default:
        return 'في الانتظار';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="text-xl font-bold text-foreground">{test.test_name}</DialogTitle>
            <Badge className={getStatusColor(test.status)}>
              {getStatusLabel(test.status)}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-0 h-6 w-6 rounded-full"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <h3 className="font-semibold mb-2 text-foreground">الرسالة</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 bg-muted/50 p-3 rounded-lg">
              {test.message}
            </p>
          </div>

          {test.details?.cases && Array.isArray(test.details.cases) && test.details.cases.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-foreground">
                مصفوفة الاختبار (Test Cases)
                {(test.details.cases_passed != null || test.details.cases_total != null) && (
                  <span className="mr-2 text-sm font-normal text-muted-foreground">
                    ({test.details.cases_passed ?? '-'}/{test.details.cases_total ?? '-'})
                  </span>
                )}
              </h3>
              <ul className="space-y-2">
                {(test.details.cases as TestCaseResult[]).map((c) => (
                  <li
                    key={c.id}
                    className={`flex items-start gap-2 p-2 rounded-lg border ${
                      c.passed
                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                    }`}
                  >
                    {c.passed ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-foreground">{c.name}</span>
                      {c.message && (
                        <p className="text-sm text-muted-foreground mt-0.5">{c.message}</p>
                      )}
                    </div>
                    <Badge
                      variant={c.passed ? 'default' : 'destructive'}
                      className="shrink-0"
                    >
                      {c.passed ? 'نجح' : 'فشل'}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {test.details && Object.keys(test.details).length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-foreground">التفاصيل (خام)</h3>
              <pre className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded text-xs overflow-x-auto text-gray-800 dark:text-gray-200 border border-border max-h-48 overflow-y-auto">
                {JSON.stringify(test.details, null, 2)}
              </pre>
            </div>
          )}

          {test.errors && test.errors.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-red-600 dark:text-red-400">
                الأخطاء ({test.errors.length})
              </h3>
              <ul className="space-y-1">
                {test.errors.map((error, index) => (
                  <li
                    key={index}
                    className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30 p-2 rounded border border-red-200 dark:border-red-800"
                  >
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-foreground">
              <span className="font-semibold">وقت التنفيذ:</span>{' '}
              <span className="text-muted-foreground">{test.execution_time_ms}ms</span>
            </div>
            {test.started_at && (
              <div className="text-foreground">
                <span className="font-semibold">وقت البدء:</span>{' '}
                <span className="text-muted-foreground">
                  {new Date(test.started_at).toLocaleString('ar-SA')}
                </span>
              </div>
            )}
            {test.completed_at && (
              <div className="text-foreground">
                <span className="font-semibold">وقت الانتهاء:</span>{' '}
                <span className="text-muted-foreground">
                  {new Date(test.completed_at).toLocaleString('ar-SA')}
                </span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

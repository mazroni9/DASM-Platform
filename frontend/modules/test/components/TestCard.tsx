'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TestResult } from '../types';

interface TestCardProps {
  test: TestResult;
  onViewDetails?: (id: number) => void;
}

export const TestCard = memo(function TestCard({ test, onViewDetails }: TestCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
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
    <Card
      className="cursor-pointer transition-all duration-200 hover:shadow-lg border-l-4 border-l-gray-300 hover:border-l-blue-500"
      onClick={() => onViewDetails?.(test.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold line-clamp-2">{test.test_name}</CardTitle>
          <Badge variant="outline" className={getStatusColor(test.status) + ' shrink-0'}>
            {getStatusLabel(test.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-700 leading-relaxed min-h-[3rem] line-clamp-3">
          {test.message}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
          <span className="font-medium">الوقت: {test.execution_time_ms}ms</span>
          {test.completed_at && (
            <span className="text-xs">
              {new Date(test.completed_at).toLocaleString('ar-SA', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}
        </div>
        {test.errors && test.errors.length > 0 && (
          <div className="mt-2 text-xs text-red-600 font-medium bg-red-50 p-2 rounded">
            {test.errors.length} خطأ
          </div>
        )}
      </CardContent>
    </Card>
  );
});

'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import type { LatestTestResult } from '../types';

interface CategoryCardProps {
  category: LatestTestResult;
  onRun?: (category: string) => void;
  running?: boolean;
}

export const CategoryCard = memo(function CategoryCard({ category, onRun, running }: CategoryCardProps) {
  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-200';
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-lg border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{category.category_label}</CardTitle>
          {category.latest_result && (
            <Badge variant="outline" className={getStatusColor(category.latest_result.status)}>
              {category.latest_result.status_label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {category.latest_result ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed min-h-[3rem]">
              {category.latest_result.message}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
              <span className="font-medium">الوقت: {category.latest_result.execution_time_ms}ms</span>
              {category.latest_result.completed_at && (
                <span className="text-xs">
                  {new Date(category.latest_result.completed_at).toLocaleString('ar-SA', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">لا توجد نتائج سابقة</p>
        )}
        <Button
          className="w-full mt-4"
          onClick={() => onRun?.(category.category)}
          disabled={running}
          variant={running ? 'secondary' : 'default'}
        >
          {running ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              جاري التشغيل...
            </>
          ) : (
            'تشغيل الاختبار'
          )}
        </Button>
      </CardContent>
    </Card>
  );
});

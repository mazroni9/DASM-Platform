'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Clock, BarChart3 } from 'lucide-react';
import type { TestSummary } from '../types';

interface TestSummaryCardProps {
  summary: TestSummary;
}

export function TestSummaryCard({ summary }: TestSummaryCardProps) {
  const stats = [
    {
      label: 'إجمالي',
      value: summary.total,
      color: 'text-blue-700 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800',
      icon: BarChart3,
    },
    {
      label: 'نجح',
      value: summary.passed,
      color: 'text-green-700 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-950/30',
      border: 'border-green-200 dark:border-green-800',
      icon: CheckCircle2,
    },
    {
      label: 'فشل',
      value: summary.failed,
      color: 'text-red-700 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800',
      icon: XCircle,
    },
    {
      label: 'قيد التشغيل',
      value: summary.running,
      color: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800',
      icon: Clock,
    },
  ];

  return (
    <Card className="border-l-4 border-l-blue-500 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold">ملخص الاختبارات</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`${stat.bg} ${stat.border} border-2 p-4 rounded-xl text-center transition-all duration-200 hover:shadow-md`}
              >
                <Icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                <div className={`text-3xl font-bold ${stat.color} mb-1`}>
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

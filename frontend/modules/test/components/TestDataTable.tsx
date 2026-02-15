'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2, Eye, Loader2 } from 'lucide-react';
import type { TestResult, TestPagination } from '../types';
import { TestCategory } from '../types';

interface TestDataTableProps {
  results: TestResult[];
  pagination: TestPagination | null;
  loading: boolean;
  selectedCategory?: TestCategory;
  onPageChange: (page: number) => void;
  onViewDetails: (test: TestResult) => void;
  onDelete: (id: number) => Promise<void>;
  onBulkDelete: (ids: number[]) => Promise<void>;
}

export function TestDataTable({
  results,
  pagination,
  loading,
  selectedCategory,
  onPageChange,
  onViewDetails,
  onDelete,
  onBulkDelete,
}: TestDataTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const selectAll = useMemo(() => {
    return results.length > 0 && selectedIds.size === results.length;
  }, [results.length, selectedIds.size]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(results.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteTarget(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      setDeleting(true);
      try {
        await onDelete(deleteTarget);
        setSelectedIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(deleteTarget);
          return newSet;
        });
      } finally {
        setDeleting(false);
        setDeleteDialogOpen(false);
        setDeleteTarget(null);
      }
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedIds.size > 0) {
      setBulkDeleteDialogOpen(true);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.size > 0) {
      setDeleting(true);
      try {
        await onBulkDelete(Array.from(selectedIds));
        setSelectedIds(new Set());
      } finally {
        setDeleting(false);
        setBulkDeleteDialogOpen(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'failed':
        return 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'running':
        return 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
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

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'logic':
        return 'منطق المزادات';
      case 'transitions':
        return 'الانتقال بين الأنواع';
      case 'price_updates':
        return 'تحديثات الأسعار';
      case 'state_consistency':
        return 'استقرار الحالات';
      default:
        return category;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600" />
        <p className="mt-3 text-gray-600">جاري التحميل...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">لا توجد نتائج اختبارات</div>
        <p className="text-sm text-gray-500">قم بتشغيل الاختبارات لعرض النتائج</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
              تم تحديد {selectedIds.size} نتيجة
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDeleteClick}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  حذف المحدد ({selectedIds.size})
                </>
              )}
            </Button>
          </div>
        )}

        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                  />
                </TableHead>
                <TableHead className="text-right min-w-[200px]">اسم الاختبار</TableHead>
                <TableHead className="text-right min-w-[150px]">النوع</TableHead>
                <TableHead className="text-right min-w-[100px]">الحالة</TableHead>
                <TableHead className="text-right min-w-[80px]">الحالات</TableHead>
                <TableHead className="text-right min-w-[250px]">الرسالة</TableHead>
                <TableHead className="text-right min-w-[100px]">الوقت</TableHead>
                <TableHead className="text-right min-w-[150px]">التاريخ</TableHead>
                <TableHead className="text-right min-w-[120px]">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((test) => (
                <TableRow key={test.id} className="hover:bg-muted/50">
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(test.id)}
                      onChange={(e) => handleSelectOne(test.id, e.target.checked)}
                      className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{test.test_name}</TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{getCategoryLabel(test.test_category)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(test.status)}>
                      {getStatusLabel(test.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {test.details?.cases_total != null ? (
                      <span
                        className={
                          test.details?.cases_passed === test.details?.cases_total
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }
                      >
                        {test.details?.cases_passed ?? 0}/{test.details.cases_total}
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 max-w-xs">{test.message}</p>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                    {test.execution_time_ms}ms
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                    {test.completed_at
                      ? new Date(test.completed_at).toLocaleString('ar-SA', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(test)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(test.id)}
                        disabled={deleting}
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {pagination && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              عرض {pagination.from} إلى {pagination.to} من {pagination.total} نتيجة
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
              >
                السابق
              </Button>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                صفحة {pagination.current_page} من {pagination.last_page}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
              >
                التالي
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف نتيجة الاختبار هذه؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? 'جاري الحذف...' : 'حذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف الجماعي</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف {selectedIds.size} نتيجة اختبار؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmBulkDelete}
              disabled={deleting}
            >
              {deleting ? 'جاري الحذف...' : `حذف ${selectedIds.size}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

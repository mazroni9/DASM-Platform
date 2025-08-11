"use client";
import { useEffect, useState } from "react";
import { commissionTierService } from "@/services/commission-tier-service";
import { formatCurrency } from "@/utils/formatCurrency";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

export default function CommissionTierTable({ onView, onEdit, onDelete }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      setLoading(true);
      const data = await commissionTierService.list();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="text-center py-6">جارٍ التحميل...</div>;

  if (error)
    return (
      <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-md p-3">
        <span>{error}</span>
        <Button size="sm" variant="secondary" onClick={load}>
          إعادة المحاولة
        </Button>
      </div>
    );

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead>اسم الفئة</TableHead>
            <TableHead>من سعر</TableHead>
            <TableHead>إلى سعر</TableHead>
            <TableHead>العمولة</TableHead>
            <TableHead>تدريجية؟</TableHead>
            <TableHead>مفعلة؟</TableHead>
            <TableHead>الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} className="hover:bg-muted/40">
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell>
                {formatCurrency(r.minPrice, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell>
                {r.maxPrice === null
                  ? "غير محدد"
                  : formatCurrency(r.maxPrice, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
              </TableCell>
              <TableCell>
                {formatCurrency(r.commissionAmount, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell>
                <span className={r.isProgressive ? "text-emerald-600" : "text-gray-500"}>
                  {r.isProgressive ? "نعم" : "لا"}
                </span>
              </TableCell>
              <TableCell>
                <span className={r.isActive ? "text-emerald-600" : "text-red-600"}>
                  {r.isActive ? "مفعلة" : "معطلة"}
                </span>
              </TableCell>
              <TableCell className="space-x-2 rtl:space-x-reverse whitespace-nowrap">
                <Button size="sm" variant="secondary" onClick={() => onView && onView(r.id)}>
                  عرض
                </Button>
                <Button size="sm" onClick={() => onEdit && onEdit(r.id)}>
                  تعديل
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete && onDelete(r)}>
                  حذف
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}



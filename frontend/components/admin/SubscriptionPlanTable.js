"use client";
import { useEffect, useState } from "react";
import { subscriptionPlanService } from "@/services/subscription-plan-service";
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

export default function SubscriptionPlanTable({ onView, onEdit, onDelete, onToggleStatus, filters }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toggleLoading, setToggleLoading] = useState(null);

  const load = async () => {
    try {
      setError("");
      setLoading(true);
      const params = {};
      if (filters?.userType && filters.userType !== "all") params.userType = filters.userType;
      if (filters?.isActive && filters.isActive !== "all") params.isActive = filters.isActive;
      
      const data = await subscriptionPlanService.list(params);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters]);

  const handleToggleStatus = async (plan) => {
    setToggleLoading(plan.id);
    try {
      await subscriptionPlanService.toggleStatus(plan.id);
      load(); // Reload data
    } catch (e) {
      setError("فشل في تغيير حالة الخطة");
    } finally {
      setToggleLoading(null);
    }
  };


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
            <TableHead>اسم الخطة</TableHead>
            <TableHead>نوع المستخدم</TableHead>
            <TableHead>السعر</TableHead>
            <TableHead>المدة</TableHead>
            <TableHead>السعر الشهري</TableHead>
            <TableHead>مفعلة؟</TableHead>
            <TableHead>الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} className="hover:bg-muted/40">
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell>{r.userTypeText}</TableCell>
              <TableCell>
                {formatCurrency(r.price, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell>{r.durationText}</TableCell>
              <TableCell>
                {formatCurrency(r.monthlyPrice, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
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
                <Button 
                  size="sm" 
                  variant={r.isActive ? "outline" : "default"}
                  onClick={() => handleToggleStatus(r)}
                  disabled={toggleLoading === r.id}
                  className={r.isActive ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                >
                  {toggleLoading === r.id ? "جارٍ..." : r.isActive ? "إلغاء تفعيل" : "تفعيل"}
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

"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { commissionTierService } from "@/services/commission-tier-service";
import { formatCurrency } from "@/utils/formatCurrency";
import CommissionCalculator from "@/components/admin/CommissionCalculator";
import { Button } from "@/components/ui/button";

export default function Page() {
  const p = useParams();
  const r = useLoadingRouter();
  const id = p?.id as string;
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const x = await commissionTierService.get(id);
        setD(x);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">تفاصيل الفئة</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => r.push(`/admin/commission-tiers`)}>العودة</Button>
          <Button onClick={() => r.push(`/admin/commission-tiers/edit/${id}`)}>تعديل</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-3">
          <div className="flex justify-between"><span>اسم الفئة</span><span>{d?.name}</span></div>
          <div className="flex justify-between"><span>أقل سعر</span><span>{formatCurrency(d?.minPrice, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between"><span>أعلى سعر</span><span>{d?.maxPrice === null ? "غير محدد" : formatCurrency(d?.maxPrice, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between"><span>مبلغ العمولة</span><span>{formatCurrency(d?.commissionAmount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between"><span>تدريجية؟</span><span>{d?.isProgressive ? "نعم" : "لا"}</span></div>
          <div className="flex justify-between"><span>مفعلة؟</span><span>{d?.isActive ? "مفعلة" : "معطلة"}</span></div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-semibold mb-3">حاسبة العمولة</h2>
          <CommissionCalculator />
        </div>
      </div>
    </div>
  );
}



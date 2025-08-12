"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { subscriptionPlanService } from "@/services/subscription-plan-service";
import { formatCurrency } from "@/utils/formatCurrency";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function Page() {
  const p = useParams();
  const r = useRouter();
  const id = p?.id as string;
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const x = await subscriptionPlanService.get(id);
        setD(x);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      <span className="mr-2">جارٍ التحميل...</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">تفاصيل خطة الاشتراك</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => r.push(`/admin/subscription-plans`)}>العودة</Button>
          <Button onClick={() => r.push(`/admin/subscription-plans/edit/${id}`)}>تعديل</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-3">
          <div className="flex justify-between"><span>اسم الخطة</span><span>{d?.name}</span></div>
          <div className="flex justify-between"><span>الوصف</span><span>{d?.description || "غير محدد"}</span></div>
          <div className="flex justify-between"><span>نوع المستخدم</span><span>{d?.userTypeText}</span></div>
          <div className="flex justify-between"><span>السعر</span><span>{formatCurrency(d?.price, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between"><span>المدة</span><span>{d?.durationText}</span></div>
          <div className="flex justify-between"><span>السعر الشهري</span><span>{formatCurrency(d?.monthlyPrice, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          <div className="flex justify-between"><span>ترتيب العرض</span><span>{d?.orderIndex}</span></div>
          <div className="flex justify-between"><span>مفعلة؟</span><span>{d?.isActive ? "مفعلة" : "معطلة"}</span></div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-semibold mb-3">معلومات إضافية</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <div>الرابط المخصص: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{d?.slug}</span></div>
            <div>تاريخ الإنشاء: {d?.createdAt ? new Date(d.createdAt).toLocaleDateString('ar') : "غير متاح"}</div>
            <div>آخر تحديث: {d?.updatedAt ? new Date(d.updatedAt).toLocaleDateString('ar') : "غير متاح"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

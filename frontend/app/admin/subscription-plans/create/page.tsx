"use client";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import SubscriptionPlanForm from "@/components/admin/SubscriptionPlanForm";
import { Button } from "@/components/ui/button";

export default function Page() {
  const r = useLoadingRouter();
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">إضافة خطة اشتراك</h1>
        <Button variant="outline" size="sm" onClick={() => r.push("/admin/subscription-plans")}>العودة</Button>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <SubscriptionPlanForm id={undefined as any} onSuccess={() => r.push("/admin/subscription-plans")}/>
      </div>
    </div>
  );
}

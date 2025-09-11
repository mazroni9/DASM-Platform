"use client";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import CommissionTierForm from "@/components/admin/CommissionTierForm";
import { Button } from "@/components/ui/button";

export default function Page() {
  const r = useLoadingRouter();
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">إضافة فئة عمولة</h1>
        <Button variant="outline" size="sm" onClick={() => r.push("/admin/commission-tiers")}>العودة</Button>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <CommissionTierForm id={undefined as any} onSuccess={() => r.push("/admin/commission-tiers")}/>
      </div>
    </div>
  );
}



"use client";

import LiveMarketStagingPanel from "@/components/admin/LiveMarketStagingPanel";

export default function LiveMarketStagingPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 rtl">
      <div>
        <h1 className="text-xl font-bold">إدارة تغذية الحراج المباشر</h1>
        <p className="text-sm text-foreground/60 mt-2">
          معالجة السيارات الجديدة، اعتماد المزاد الفوري، ونقل العروض المحددة إلى الحراج المباشر.
        </p>
      </div>
      <LiveMarketStagingPanel />
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminMarketCouncilPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/market-council/articles");
  }, [router]);

  return (
    <div className="min-h-screen bg-background text-foreground p-8 rtl flex items-center justify-center">
      <p className="text-foreground/60">جاري التوجيه...</p>
    </div>
  );
}

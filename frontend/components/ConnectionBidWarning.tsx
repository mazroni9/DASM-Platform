"use client";

import { useConnectionQuality } from "@/hooks/useConnectionQuality";
import { AlertTriangle } from "lucide-react";

/**
 * يظهر تحذيرًا صغيرًا قرب منطقة المزايدة عندما تكون جودة الاتصال:
 * ضعيف، غير مناسب للمزايدة، أو غير متصل
 */
export default function ConnectionBidWarning() {
  const { showBidWarning, labelAr, isOnline } = useConnectionQuality();

  if (!showBidWarning) return null;

  const message = isOnline
    ? "قد يسبب اتصالك الحالي تأخرًا في المزايدة"
    : "الاتصال غير مستقر حاليًا";

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-200 text-sm mb-2"
      role="alert"
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

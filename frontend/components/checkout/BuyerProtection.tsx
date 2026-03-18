"use client";

import { ShieldCheck } from "lucide-react";

export default function BuyerProtection() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 items-center shadow-sm">
      <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 text-xl">
        <ShieldCheck className="w-6 h-6" />
      </div>
      <div>
        <h4 className="font-bold text-sm text-slate-800">حماية المشتري</h4>
        <p className="text-xs text-slate-500">
          نضمن لك انتقال الملكية أو استرداد المبلغ بالكامل في حال حدوث أي خطأ.
        </p>
      </div>
    </div>
  );
}

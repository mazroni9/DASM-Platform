// ✅ مكون زر الرجوع إلى لوحة التحكم
// تأكد أنك أنشأته في المسار: components/dashboard/BackToDashboard.tsx

"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackToDashboard() {
  return (
    <div className="mb-6">
      <Link href="/dashboard">
        <div className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          الرجوع إلى لوحة التحكم
        </div>
      </Link>
    </div>
  );
}

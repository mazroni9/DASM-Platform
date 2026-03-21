"use client";

import { useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import LoadingLink from "@/components/LoadingLink";

const BUNDLES = [
  { value: "writer", label: "كاتب (Writer)" },
  { value: "editor", label: "محرر (Editor)" },
  { value: "publisher", label: "ناشر (Publisher)" },
  { value: "moderator", label: "مشرف تعليقات (Moderator)" },
];

export default function CouncilAccessRequestPage() {
  const [bundle, setBundle] = useState("writer");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const res = await api.post("/api/council-studio/access-request", { bundle });
      toast.success(res.data?.message || "تم إرسال الطلب");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "تعذر إرسال الطلب";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6 rtl p-4">
      <LoadingLink
        href="/dashboard/council"
        className="text-sm text-primary hover:underline inline-block"
      >
        ← العودة لاستوديو مجلس السوق
      </LoadingLink>
      <div>
        <h1 className="text-2xl font-bold">طلب صلاحية استوديو مجلس السوق</h1>
        <p className="text-sm text-foreground/60 mt-2">
          اختر حزمة الصلاحيات المطلوبة. سيصل الطلب لفريق الموافقات التشغيلي وسيتم
          إشعارهم بالبريد.
        </p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">الحزمة</label>
        <select
          className="w-full border border-border rounded-xl p-3 bg-card"
          value={bundle}
          onChange={(e) => setBundle(e.target.value)}
        >
          {BUNDLES.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
      </div>
      <Button type="button" disabled={loading} onClick={submit}>
        {loading ? "جاري الإرسال..." : "إرسال الطلب"}
      </Button>
    </div>
  );
}

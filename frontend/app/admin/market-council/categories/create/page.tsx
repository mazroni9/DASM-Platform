"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import LoadingLink from "@/components/LoadingLink";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, AlertTriangle, Save, Tags } from "lucide-react";

function slugify(input: string) {
  const s = (input || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/^-+|-+$/g, "");
  return s;
}

export default function AdminMarketCouncilCategoryCreatePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);
  const slugTouchedRef = useRef(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    name_ar: "",
    name_en: "",
    slug: "",
    description: "",
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    if (!autoSlug || slugTouchedRef.current || !form.name_ar.trim()) return;
    setForm((p) => ({ ...p, slug: slugify(p.name_ar) }));
  }, [form.name_ar, autoSlug]);

  const slugHelp = useMemo(() => {
    const s = form.slug.trim();
    if (!s) return { type: "warn" as const, text: "الرابط مطلوب" };
    if (s.includes(" ")) return { type: "warn" as const, text: "بدون مسافات" };
    return { type: "ok" as const, text: "تمام" };
  }, [form.slug]);

  const validate = () => {
    if (!form.name_ar.trim()) return "اسم التصنيف مطلوب";
    if (!form.slug.trim()) return "الرابط مطلوب";
    return "";
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const msg = validate();
    if (msg) {
      setErrorMsg(msg);
      return;
    }
    try {
      setErrorMsg("");
      setSaving(true);
      await api.post("/api/admin/market-council/categories", {
        name_ar: form.name_ar.trim(),
        name_en: form.name_en.trim() || null,
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
      });
      toast.success("تمت الإضافة");
      router.replace("/admin/market-council/categories");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e?.response?.data?.message || "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-2 rtl">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">إضافة تصنيف</h1>
          <p className="text-foreground/60 mt-2">تصنيف جديد لمجلس السوق</p>
        </div>
        <LoadingLink href="/admin/market-council/categories" className="bg-card border border-border hover:bg-border/60 px-4 py-2 rounded-xl flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          رجوع
        </LoadingLink>
      </div>

      {errorMsg ? (
        <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500 px-4 py-3">{errorMsg}</div>
      ) : null}

      <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-6 space-y-6 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1">الاسم (عربي) *</label>
            <input value={form.name_ar} onChange={(e) => setForm((p) => ({ ...p, name_ar: e.target.value }))} className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary" placeholder="قصص السوق" required />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-bold">الرابط</label>
              <label className="flex items-center gap-2 text-xs select-none">
                <input type="checkbox" checked={autoSlug} onChange={(e) => { setAutoSlug(e.target.checked); if (e.target.checked) slugTouchedRef.current = false; }} className="accent-primary" />
                توليد تلقائي
              </label>
            </div>
            <input value={form.slug} onChange={(e) => { slugTouchedRef.current = true; setForm((p) => ({ ...p, slug: e.target.value })); }} className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary" placeholder="qisas-al-suq" />
            <div className="mt-1 flex items-center gap-2 text-xs">
              {slugHelp.type === "ok" ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
              <span className={slugHelp.type === "ok" ? "text-emerald-500" : "text-amber-500"}>{slugHelp.text}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">الاسم (إنجليزي)</label>
          <input value={form.name_en} onChange={(e) => setForm((p) => ({ ...p, name_en: e.target.value }))} className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary" placeholder="اختياري" />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">الوصف</label>
          <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary" rows={3} placeholder="وصف اختياري" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1">ترتيب العرض</label>
            <input type="number" min={0} value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: Math.max(0, parseInt(e.target.value, 10) || 0) }))} className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} className="accent-primary" />
              <span className="text-sm font-bold">نشط</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={saving} className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground py-2 rounded-xl font-bold flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? "جارٍ الحفظ..." : "حفظ"}
          </button>
          <LoadingLink href="/admin/market-council/categories" className="flex-1 bg-border hover:bg-border/80 py-2 rounded-xl font-bold text-center">إلغاء</LoadingLink>
        </div>
      </form>
    </div>
  );
}

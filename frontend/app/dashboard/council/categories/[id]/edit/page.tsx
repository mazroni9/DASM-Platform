"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import LoadingLink from "@/components/LoadingLink";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, AlertTriangle, Save } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

function slugify(input: string) {
  return (input || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/^-+|-+$/g, "");
}

export default function CouncilCategoryEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { can } = usePermission();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSlug, setAutoSlug] = useState(false);
  const slugTouchedRef = useRef(true);

  const [form, setForm] = useState({
    name_ar: "",
    name_en: "",
    slug: "",
    description: "",
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    if (!can("council.category.manage")) {
      router.replace("/dashboard/council");
    }
  }, [can, router]);

  const fetchCategory = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/api/council-studio/categories/${id}`);
      const cat = res?.data?.data ?? res?.data;
      if (!cat?.name_ar) {
        toast.error("التصنيف غير موجود");
        router.replace("/dashboard/council/categories");
        return;
      }
      setForm({
        name_ar: cat.name_ar || "",
        name_en: cat.name_en || "",
        slug: cat.slug || "",
        description: cat.description || "",
        sort_order: cat.sort_order ?? 0,
        is_active: cat.is_active !== 0 && cat.is_active !== false,
      });
    } catch (err: unknown) {
      const e = err as { response?: { status?: number } };
      if (e?.response?.status === 404) {
        toast.error("التصنيف غير موجود");
      } else {
        toast.error("تعذر تحميل التصنيف");
      }
      router.replace("/dashboard/council/categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id || !can("council.category.manage")) return;
    fetchCategory();
  }, [id, can]);

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
      toast.error(msg);
      return;
    }
    try {
      setSaving(true);
      await api.put(`/api/council-studio/categories/${id}`, {
        name_ar: form.name_ar.trim(),
        name_en: form.name_en.trim() || null,
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
      });
      toast.success("تم حفظ التعديلات");
      router.replace("/dashboard/council/categories");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  if (!can("council.category.manage")) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] gap-3">
        <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-foreground/60 text-sm">...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">تعديل تصنيف</h1>
          <p className="text-foreground/60 text-sm mt-1">تعديل تصنيف مجلس السوق</p>
        </div>
        <LoadingLink href="/dashboard/council/categories" className="bg-card border border-border hover:bg-border/60 px-4 py-2 rounded-xl flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          رجوع
        </LoadingLink>
      </div>

      <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-6 space-y-6 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1">الاسم (عربي) *</label>
            <input value={form.name_ar} onChange={(e) => setForm((p) => ({ ...p, name_ar: e.target.value }))} className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary" required />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-bold">الرابط</label>
              <label className="flex items-center gap-2 text-xs select-none">
                <input type="checkbox" checked={autoSlug} onChange={(e) => { setAutoSlug(e.target.checked); if (e.target.checked) slugTouchedRef.current = false; }} className="accent-primary" />
                توليد تلقائي
              </label>
            </div>
            <input value={form.slug} onChange={(e) => { slugTouchedRef.current = true; setForm((p) => ({ ...p, slug: e.target.value })); }} className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary" />
            <div className="mt-1 flex items-center gap-2 text-xs">
              {slugHelp.type === "ok" ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
              <span className={slugHelp.type === "ok" ? "text-emerald-500" : "text-amber-500"}>{slugHelp.text}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">الاسم (إنجليزي)</label>
          <input value={form.name_en} onChange={(e) => setForm((p) => ({ ...p, name_en: e.target.value }))} className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary" />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">الوصف</label>
          <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary" rows={3} />
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
          <LoadingLink href="/dashboard/council/categories" className="flex-1 bg-border hover:bg-border/80 py-2 rounded-xl font-bold text-center">إلغاء</LoadingLink>
        </div>
      </form>
    </div>
  );
}

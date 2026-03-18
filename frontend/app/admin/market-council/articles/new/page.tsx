"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import LoadingLink from "@/components/LoadingLink";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  FileText,
  Eye,
  Save,
  Star,
} from "lucide-react";
import { generateSlug, sanitizeSlugForSubmit, isValidSlug } from "@/lib/marketCouncilSlug";

type MarketCategory = {
  id: number | string;
  name_ar: string;
  name_en?: string | null;
  slug: string;
};

function normalizeList<T>(resData: unknown): { list: T[] } {
  const root = resData as { success?: boolean; data?: unknown };
  if (root?.success && Array.isArray(root?.data)) return { list: root.data as T[] };
  const d = root?.data as { data?: T[] } | undefined;
  if (d && Array.isArray(d?.data)) return { list: d.data };
  return { list: [] };
}

const CONTEXT_OPTIONS: { value: string; label: string }[] = [
  { value: "car_detail", label: "تفاصيل السيارة" },
  { value: "auction_live", label: "مزاد مباشر" },
  { value: "auction_instant", label: "مزاد فوري" },
  { value: "auction_delayed", label: "مزاد متأخر" },
  { value: "finance", label: "التمويل" },
  { value: "seller", label: "البائع" },
  { value: "buyer", label: "المشتري" },
  { value: "trader", label: "التاجر" },
];

export default function AdminMarketCouncilArticleCreatePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<MarketCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [autoSlug, setAutoSlug] = useState(true);
  const slugTouchedRef = useRef(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title_ar: "",
    title_en: "",
    slug: "",
    category_id: "",
    excerpt_ar: "",
    excerpt_en: "",
    content_ar: "",
    content_en: "",
    cover_image: "",
    author_name: "",
    read_time: 1,
    status: "draft" as "draft" | "published" | "archived",
    is_featured: false,
    contexts: [] as string[],
  });

  const fetchCategories = async () => {
    try {
      setLoadingCats(true);
      const res = await api.get("/api/admin/market-council/categories");
      const { list } = normalizeList<MarketCategory>(res?.data);
      setCategories(list);
      setForm((p) => ({
        ...p,
        category_id: p.category_id || (list[0] ? String(list[0].id) : ""),
      }));
    } catch {
      setCategories([]);
    } finally {
      setLoadingCats(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!autoSlug || slugTouchedRef.current || !form.title_ar.trim()) return;
    setForm((p) => ({ ...p, slug: generateSlug(p.title_ar, p.title_en) }));
  }, [form.title_ar, form.title_en, autoSlug]);

  const linkHelp = useMemo(() => {
    const s = form.slug.trim();
    if (!s) return { type: "warn" as const, text: "الرابط مطلوب" };
    if (!isValidSlug(s)) return { type: "warn" as const, text: "استخدم حروف إنجليزية وأرقام وشرطات فقط" };
    return { type: "ok" as const, text: "تمام" };
  }, [form.slug]);

  const validate = () => {
    if (!categories.length) return "لا توجد تصنيفات";
    if (!form.category_id) return "اختر تصنيف";
    if (!form.title_ar.trim()) return "العنوان بالعربية مطلوب";
    const slug = sanitizeSlugForSubmit(form.slug, form.title_ar, form.title_en);
    if (!slug) return "الرابط مطلوب (حروف إنجليزية وأرقام فقط)";
    if (!form.content_ar.trim()) return "المحتوى بالعربية مطلوب";
    return "";
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const msg = validate();
    if (msg) {
      toast.error(msg);
      return;
    }
    const slug = sanitizeSlugForSubmit(form.slug, form.title_ar, form.title_en);
    try {
      setSaving(true);
      await api.post("/api/admin/market-council/articles", {
        title_ar: form.title_ar.trim(),
        title_en: form.title_en.trim() || null,
        slug,
        category_id: Number(form.category_id),
        excerpt_ar: form.excerpt_ar.trim() || null,
        excerpt_en: form.excerpt_en.trim() || null,
        content_ar: form.content_ar.trim(),
        content_en: form.content_en.trim() || null,
        cover_image: form.cover_image.trim() || null,
        author_name: form.author_name.trim() || null,
        read_time: form.read_time,
        status: form.status,
        is_featured: form.is_featured,
        contexts: form.contexts.map((t) => ({ context_type: t, context_key: null })),
      });
      toast.success("تم إنشاء المقال");
      router.replace("/admin/market-council/articles");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const data = e?.response?.data;
      const msg =
        data?.message ||
        (data?.errors && Object.values(data.errors).flat()[0]) ||
        "تعذر الحفظ";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground rtl">
      <div className="border-b border-border bg-card/30">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary">إضافة مقال</h1>
              <p className="text-foreground/60 mt-2 text-sm">مقال جديد لمجلس السوق</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <LoadingLink
                href="/admin/market-council/articles"
                className="bg-card border border-border hover:bg-border/60 px-4 py-2 rounded-xl flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                رجوع
              </LoadingLink>
              <button
                type="button"
                onClick={() => setActiveTab((t) => (t === "edit" ? "preview" : "edit"))}
                className="bg-card border border-border hover:bg-border/60 px-4 py-2 rounded-xl flex items-center gap-2"
              >
                {activeTab === "edit" ? <Eye className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                {activeTab === "edit" ? "معاينة" : "تحرير"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        {activeTab === "preview" ? (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <h2 className="text-2xl font-bold text-primary">{form.title_ar || "عنوان المقال"}</h2>
            <p className="text-sm text-foreground/60">/market-council/{form.slug || "..."}</p>
            {form.excerpt_ar ? <p className="text-foreground/80">{form.excerpt_ar}</p> : null}
            <div className="prose max-w-none text-foreground/90 whitespace-pre-wrap">{form.content_ar || "—"}</div>
            <button type="button" onClick={() => setActiveTab("edit")} className="bg-border hover:bg-border/80 py-2 px-4 rounded-xl font-bold">رجوع للتحرير</button>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">العنوان (عربي) *</label>
                <input
                  value={form.title_ar}
                  onChange={(e) => setForm((p) => ({ ...p, title_ar: e.target.value }))}
                  className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary"
                  placeholder="عنوان المقال"
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-bold">الرابط</label>
                  <label className="flex items-center gap-2 text-xs select-none">
                    <input type="checkbox" checked={autoSlug} onChange={(e) => { setAutoSlug(e.target.checked); if (e.target.checked) slugTouchedRef.current = false; }} className="accent-primary" />
                    توليد تلقائي
                  </label>
                </div>
                <input
                  value={form.slug}
                  onChange={(e) => { slugTouchedRef.current = true; setForm((p) => ({ ...p, slug: e.target.value })); }}
                  className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary"
                  placeholder="عنوان-الرابط"
                />
                <div className="mt-1 flex items-center gap-2 text-xs">
                  {linkHelp.type === "ok" ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                  <span className={linkHelp.type === "ok" ? "text-emerald-500" : "text-amber-500"}>{linkHelp.text}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">التصنيف *</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
                  className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary"
                  disabled={loadingCats || !categories.length}
                  required
                >
                  <option value="">
                    {loadingCats ? "..." : categories.length ? "— اختر تصنيفاً —" : "— لا توجد تصنيفات —"}
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.name_ar}</option>
                  ))}
                </select>
                {!loadingCats && !categories.length ? (
                  <p className="mt-1 text-xs text-amber-600">
                    أضف تصنيفاً من صفحة التصنيفات أولاً
                  </p>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">الحالة</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as typeof form.status }))}
                  className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary"
                >
                  <option value="draft">مسودة</option>
                  <option value="published">منشور</option>
                  <option value="archived">مؤرشف</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">وقت القراءة (دقيقة)</label>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={form.read_time}
                  onChange={(e) => setForm((p) => ({ ...p, read_time: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
                  className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))} className="accent-primary" />
                  <Star className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-bold">مميز</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">صورة الغلاف (رابط)</label>
              <div className="flex gap-4 items-start">
                <input
                  value={form.cover_image}
                  onChange={(e) => setForm((p) => ({ ...p, cover_image: e.target.value }))}
                  className="flex-1 p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary"
                  placeholder="https://..."
                />
                {form.cover_image.trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.cover_image.trim()} alt="" className="w-20 h-20 object-cover rounded-xl border" onError={(e) => {(e.currentTarget as HTMLImageElement).style.display = "none";}} />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-border/60 flex items-center justify-center"><ImageIcon className="w-6 h-6 text-foreground/50" /></div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background/40 p-4">
              <label className="block text-sm font-bold mb-2">سياقات المقال (للتوصية المستقبلية)</label>
              <p className="text-xs text-foreground/60 mb-3">اختر السياقات المناسبة — تُستخدم لقواعد التوصية لاحقاً</p>
              <div className="flex flex-wrap gap-4">
                {CONTEXT_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.contexts.includes(opt.value)}
                      onChange={(e) => {
                        setForm((p) => ({
                          ...p,
                          contexts: e.target.checked
                            ? [...p.contexts, opt.value]
                            : p.contexts.filter((c) => c !== opt.value),
                        }));
                      }}
                      className="accent-primary"
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">اسم الكاتب</label>
              <input
                value={form.author_name}
                onChange={(e) => setForm((p) => ({ ...p, author_name: e.target.value }))}
                className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary"
                placeholder="اختياري"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">نبذة (عربي)</label>
              <textarea
                value={form.excerpt_ar}
                onChange={(e) => setForm((p) => ({ ...p, excerpt_ar: e.target.value }))}
                className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary"
                rows={2}
                placeholder="ملخص قصير"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">المحتوى (عربي) *</label>
              <textarea
                value={form.content_ar}
                onChange={(e) => setForm((p) => ({ ...p, content_ar: e.target.value }))}
                className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary"
                rows={12}
                placeholder="محتوى المقال..."
                required
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving || loadingCats || !categories.length} className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground py-2 rounded-xl font-bold flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? "جارٍ الحفظ..." : "حفظ"}
              </button>
              <LoadingLink href="/admin/market-council/articles" className="flex-1 bg-border hover:bg-border/80 py-2 rounded-xl font-bold text-center">إلغاء</LoadingLink>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

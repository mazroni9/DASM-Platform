"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import LoadingLink from "@/components/LoadingLink";
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  Link2,
  Eye,
  FileText,
  Save,
  RefreshCw,
} from "lucide-react";

type BlogCategory = {
  id: number | string;
  name: string;
  slug: string;
};

type ApiListResponse<T> =
  | { data: T[]; meta?: { total?: number } }
  | { data: { data: T[]; meta?: { total?: number } } }
  | T[];

function normalizeList<T>(resData: any): { list: T[]; total?: number } {
  const root = resData;
  if (Array.isArray(root)) return { list: root as T[], total: root.length };

  const d1 = root?.data;
  if (Array.isArray(d1)) return { list: d1 as T[], total: root?.meta?.total ?? d1.length };

  const d2 = d1?.data;
  if (Array.isArray(d2)) return { list: d2 as T[], total: d1?.meta?.total ?? root?.meta?.total ?? d2.length };

  return { list: [], total: 0 };
}

// Unicode-friendly slugify (يدعم العربية)
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

export default function AdminBlogPostCreatePage() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);

  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const [autoSlug, setAutoSlug] = useState(true);
  const slugTouchedRef = useRef(false);

  const [saving, setSaving] = useState(false);

  // ✅ form مطابق لحقول الباك (مع status للـ UI فقط)
  const [form, setForm] = useState({
    title: "",
    slug: "",
    category_id: "",

    excerpt: "",
    content: "",

    // ✅ Backend naming
    cover_image: "",

    // ✅ UI field (mapped to is_published)
    status: "draft" as "draft" | "published",
    published_at: "",

    // ✅ SEO
    seo_title: "",
    seo_description: "",
  });

  const fetchCategories = async () => {
    try {
      setLoadingCats(true);
      const res = await api.get<ApiListResponse<BlogCategory>>("/api/admin/blog/categories");
      const { list } = normalizeList<BlogCategory>(res?.data);

      setCategories(list);

      // ✅ اجعل أول تصنيف هو الافتراضي لو فاضي
      setForm((p) => {
        const nextCat = p.category_id || (list.length ? String(list[0].id) : "");
        return { ...p, category_id: nextCat };
      });
    } catch {
      setCategories([]);
      setForm((p) => ({ ...p, category_id: "" }));
    } finally {
      setLoadingCats(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-slug from title
  useEffect(() => {
    if (!autoSlug) return;
    if (slugTouchedRef.current) return;
    if (!form.title.trim()) return;

    setForm((p) => ({ ...p, slug: slugify(p.title) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title, autoSlug]);

  const slugHelp = useMemo(() => {
    const s = form.slug.trim();
    if (!s) return { type: "warn" as const, text: "الـSlug ضروري للرابط (مثال: my-post)" };
    if (s.includes(" ")) return { type: "warn" as const, text: "يفضل بدون مسافات" };
    return { type: "ok" as const, text: "الرابط جاهز" };
  }, [form.slug]);

  const validate = () => {
    const title = form.title.trim();
    const slug = form.slug.trim();

    if (!categories.length) return { ok: false, msg: "لا توجد تصنيفات. أضف تصنيف أولاً ثم حاول مرة أخرى." };
    if (!form.category_id) return { ok: false, msg: "التصنيف مطلوب (لا يمكن الحفظ بدون تصنيف)" };

    if (!title) return { ok: false, msg: "العنوان مطلوب" };
    if (!slug) return { ok: false, msg: "الـSlug مطلوب (أو فعّل التوليد التلقائي)" };
    if (title.length > 255) return { ok: false, msg: "العنوان طويل جدًا (255 حرف كحد أقصى)" };
    if (slug.length > 255) return { ok: false, msg: "الـSlug طويل جدًا (255 حرف كحد أقصى)" };

    if (form.cover_image.trim()) {
      try {
        // eslint-disable-next-line no-new
        new URL(form.cover_image.trim());
      } catch {
        return { ok: false, msg: "رابط الصورة غير صالح" };
      }
    }

    if (form.status === "published" && form.published_at) {
      const d = new Date(form.published_at);
      if (Number.isNaN(d.getTime())) return { ok: false, msg: "تاريخ النشر غير صالح" };
    }

    if (form.seo_title.trim().length > 255) return { ok: false, msg: "SEO Title طويل جدًا (255 حرف كحد أقصى)" };
    if (form.seo_description.trim().length > 5000) return { ok: false, msg: "SEO Description طويل جدًا" };

    return { ok: true as const };
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    const v = validate();
    if (!v.ok) {
      toast.error(v.msg);
      return;
    }

    try {
      setSaving(true);

      const catIdNum = Number(form.category_id);
      const is_published = form.status === "published";

      // ✅ Payload مطابق للموديل fillable بالباك
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),

        category_id: catIdNum,

        excerpt: form.excerpt?.trim() || null,
        content: form.content?.trim() || null,

        cover_image: form.cover_image?.trim() || null,

        is_published,
        published_at: is_published ? (form.published_at || null) : null,

        seo_title: form.seo_title?.trim() || null,
        seo_description: form.seo_description?.trim() || null,
      };

      await api.post("/api/admin/blog/posts", payload);

      toast.success("تم إضافة المقال");
      window.location.href = "/admin/blog/posts";
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const selectedCategoryName =
    form.category_id && categories.length
      ? categories.find((c) => String(c.id) === String(form.category_id))?.name || "—"
      : "—";

  return (
    <div className="min-h-screen bg-background text-foreground rtl">
      {/* Header */}
      <div className="border-b border-border bg-card/30">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary">إضافة مقال جديد</h1>
              <p className="text-foreground/60 mt-2 text-sm">أنشئ مقال بشكل منظم مع معاينة قبل الحفظ.</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <LoadingLink
                href="/admin/blog/posts"
                className="bg-card border border-border hover:bg-border/60 px-4 py-2 rounded-xl flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                رجوع للقائمة
              </LoadingLink>

              <button
                onClick={fetchCategories}
                className="bg-card border border-border hover:bg-border/60 px-4 py-2 rounded-xl flex items-center gap-2"
                type="button"
              >
                <RefreshCw className={`w-4 h-4 ${loadingCats ? "animate-spin" : ""}`} />
                تحديث التصنيفات
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`px-4 py-2 rounded-xl border transition flex items-center gap-2 ${
                activeTab === "edit"
                  ? "bg-primary text-white border-primary"
                  : "bg-background border-border hover:bg-border/60"
              }`}
            >
              <FileText size={16} />
              تحرير
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-4 py-2 rounded-xl border transition flex items-center gap-2 ${
                activeTab === "preview"
                  ? "bg-primary text-white border-primary"
                  : "bg-background border-border hover:bg-border/60"
              }`}
            >
              <Eye size={16} />
              معاينة
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        {activeTab === "preview" ? (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-start gap-4">
              {form.cover_image?.trim() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.cover_image.trim()}
                  alt=""
                  className="w-28 h-28 rounded-2xl object-cover border border-border"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-border/60 border border-border flex items-center justify-center">
                  <ImageIcon className="w-7 h-7 text-foreground/60" />
                </div>
              )}

              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-primary line-clamp-2">{form.title?.trim() || "عنوان المقال"}</h2>

                <p className="text-sm text-foreground/60 mt-1 flex items-center gap-2">
                  <Link2 size={14} />
                  <span className="truncate">/blog/{form.slug?.trim() || "slug"}</span>
                </p>

                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${
                      form.status === "published"
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    }`}
                  >
                    {form.status === "published" ? "منشور" : "مسودة"}
                  </span>

                  <span className="text-xs text-foreground/60">
                    التصنيف: <span className="font-bold">{selectedCategoryName}</span>
                  </span>
                </div>
              </div>
            </div>

            {form.excerpt?.trim() ? (
              <div className="rounded-2xl border border-border bg-background/40 p-4">
                <h4 className="font-bold mb-2">نبذة</h4>
                <p className="text-foreground/80 leading-7">{form.excerpt.trim()}</p>
              </div>
            ) : null}

            <div className="rounded-2xl border border-border bg-background/40 p-4">
              <h4 className="font-bold mb-2">المحتوى</h4>
              {form.content?.trim() ? (
                <div
                  className="prose max-w-none prose-invert prose-p:leading-7"
                  dangerouslySetInnerHTML={{ __html: form.content }}
                />
              ) : (
                <p className="text-foreground/50">لا يوجد محتوى.</p>
              )}
            </div>

            {(form.seo_title.trim() || form.seo_description.trim()) && (
              <div className="rounded-2xl border border-border bg-background/40 p-4 space-y-3">
                <h4 className="font-bold">SEO</h4>
                {form.seo_title.trim() ? (
                  <div className="text-sm">
                    <span className="text-foreground/60">Title:</span>{" "}
                    <span className="font-bold">{form.seo_title.trim()}</span>
                  </div>
                ) : null}
                {form.seo_description.trim() ? (
                  <div className="text-sm text-foreground/80 leading-6">{form.seo_description.trim()}</div>
                ) : null}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className="flex-1 bg-border hover:bg-border/80 py-2 rounded-xl font-bold transition"
              >
                رجوع للتحرير
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-2xl">
            {/* Title + Slug */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">العنوان</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="مثال: أفضل طرق شراء سيارة مزاد"
                  required
                />
                <div className="text-xs text-foreground/60 mt-1">{form.title.length}/255</div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="block text-sm font-bold">Slug</label>
                  <label className="flex items-center gap-2 text-xs text-foreground/70 select-none">
                    <input
                      type="checkbox"
                      checked={autoSlug}
                      onChange={(e) => {
                        setAutoSlug(e.target.checked);
                        if (e.target.checked) slugTouchedRef.current = false;
                        if (e.target.checked && form.title.trim()) {
                          setForm((p) => ({ ...p, slug: slugify(p.title) }));
                        }
                      }}
                      className="accent-primary"
                    />
                    توليد تلقائي
                  </label>
                </div>

                <div className="relative">
                  <Link2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/60" />
                  <input
                    value={form.slug}
                    onChange={(e) => {
                      slugTouchedRef.current = true;
                      setForm((p) => ({ ...p, slug: e.target.value }));
                    }}
                    className="w-full p-3 pr-10 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="my-post-slug"
                    required
                  />
                </div>

                <div className="mt-1 flex items-center gap-2 text-xs">
                  {slugHelp.type === "ok" ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-500">{slugHelp.text}</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="text-amber-500">{slugHelp.text}</span>
                    </>
                  )}
                  <span className="text-foreground/50">({form.slug.length}/255)</span>
                </div>
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">التصنيف (إجباري)</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
                  className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-60"
                  disabled={loadingCats || !categories.length}
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {!categories.length && !loadingCats ? (
                  <div className="text-xs text-red-500 mt-1">لا توجد تصنيفات — لا يمكن حفظ المقال.</div>
                ) : (
                  <div className="text-xs text-foreground/60 mt-1">اختر تصنيف لضمان عدم إرسال category_id فارغ.</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">الحالة</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as any }))}
                  className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="draft">مسودة</option>
                  <option value="published">منشور</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">تاريخ النشر (اختياري)</label>
                <input
                  type="datetime-local"
                  value={form.published_at ? form.published_at.slice(0, 16) : ""}
                  onChange={(e) => setForm((p) => ({ ...p, published_at: e.target.value }))}
                  disabled={form.status !== "published"}
                  className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
                />
                <div className="text-xs text-foreground/60 mt-1">يظهر فقط عند اختيار “منشور”.</div>
              </div>
            </div>

            {/* cover_image */}
            <div className="rounded-2xl border border-border bg-background/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="w-4 h-4 text-foreground/70" />
                <label className="block text-sm font-bold">صورة المقال (cover_image URL)</label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div className="md:col-span-2">
                  <input
                    value={form.cover_image}
                    onChange={(e) => setForm((p) => ({ ...p, cover_image: e.target.value }))}
                    className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="https://example.com/image.jpg"
                  />
                  <div className="text-xs text-foreground/60 mt-1">اختياري.</div>
                </div>

                <div className="rounded-xl border border-border bg-background/50 p-3 flex items-center justify-center">
                  {form.cover_image?.trim() ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.cover_image.trim()}
                      alt="preview"
                      className="w-full h-24 object-cover rounded-lg border border-border"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-foreground/60 text-sm">
                      <ImageIcon className="w-4 h-4" />
                      لا توجد معاينة
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Excerpt */}
            <div className="rounded-2xl border border-border bg-background/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-foreground/70" />
                <label className="block text-sm font-bold">نبذة قصيرة</label>
              </div>
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
                className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                rows={3}
                placeholder="سطرين أو ثلاثة تلخص المقال..."
              />
            </div>

            {/* Content */}
            <div className="rounded-2xl border border-border bg-background/40 p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-foreground/70" />
                  <label className="block text-sm font-bold">المحتوى (HTML)</label>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className="text-xs px-3 py-2 rounded-lg border border-border hover:bg-border/60 transition flex items-center gap-2"
                >
                  <Eye size={14} />
                  معاينة
                </button>
              </div>

              <textarea
                value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none font-mono text-sm"
                rows={12}
                placeholder="<p>...</p>"
              />
            </div>

            {/* SEO */}
            <div className="rounded-2xl border border-border bg-background/40 p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">SEO Title (اختياري)</label>
                <input
                  value={form.seo_title}
                  onChange={(e) => setForm((p) => ({ ...p, seo_title: e.target.value }))}
                  className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="عنوان مناسب لمحركات البحث..."
                />
                <div className="text-xs text-foreground/60 mt-1">{form.seo_title.length}/255</div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">SEO Description (اختياري)</label>
                <textarea
                  value={form.seo_description}
                  onChange={(e) => setForm((p) => ({ ...p, seo_description: e.target.value }))}
                  className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                  rows={3}
                  placeholder="وصف مختصر يظهر في نتائج البحث..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={saving || loadingCats || !categories.length || !form.category_id}
                className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white py-2 rounded-xl font-bold transition flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? "جارٍ الحفظ..." : "حفظ المقال"}
              </button>

              <LoadingLink
                href="/admin/blog/posts"
                className="flex-1 bg-border hover:bg-border/80 py-2 rounded-xl font-bold transition text-center"
              >
                إلغاء
              </LoadingLink>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

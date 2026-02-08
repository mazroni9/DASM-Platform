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
  | { data: T[]; total?: number }
  | T[];

function normalizeList<T>(resData: any): { list: T[]; total?: number } {
  const root = resData;
  if (Array.isArray(root)) return { list: root as T[], total: root.length };

  if (Array.isArray(root?.data)) {
    const list = root.data as T[];
    const total =
      typeof root.total === "number"
        ? root.total
        : (root?.meta?.total ?? list.length);
    return { list, total };
  }

  const d1 = root?.data;
  if (Array.isArray(d1))
    return { list: d1 as T[], total: root?.meta?.total ?? d1.length };

  const d2 = d1?.data;
  if (Array.isArray(d2))
    return {
      list: d2 as T[],
      total: d1?.meta?.total ?? root?.meta?.total ?? d2.length,
    };

  return { list: [], total: 0 };
}

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

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function contentToPreviewHtml(content: string) {
  const c = (content || "").trim();
  if (!c) return "";
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(c);
  if (looksLikeHtml) return c;
  return escapeHtml(c).replace(/\n/g, "<br />");
}

export default function AdminBlogPostCreatePage() {
  const router = useRouter();

  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);

  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const [autoSlug, setAutoSlug] = useState(true);
  const slugTouchedRef = useRef(false);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    category_id: "",

    excerpt: "",
    content: "",

    // ✅ هنستخدم image (نفس اسم الباك)
    image: "",

    status: "draft" as "draft" | "published",

    search_title: "",
    search_description: "",
  });

  const fetchCategories = async () => {
    try {
      setLoadingCats(true);
      const res = await api.get<ApiListResponse<BlogCategory>>(
        "/api/admin/blog/categories",
      );
      const { list } = normalizeList<BlogCategory>(res?.data);

      setCategories(list);

      setForm((p) => {
        const nextCat =
          p.category_id || (list.length ? String(list[0].id) : "");
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

  useEffect(() => {
    if (!autoSlug) return;
    if (slugTouchedRef.current) return;
    if (!form.title.trim()) return;

    setForm((p) => ({ ...p, slug: slugify(p.title) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title, autoSlug]);

  const linkHelp = useMemo(() => {
    const s = form.slug.trim();
    if (!s) return { type: "warn" as const, text: "الرابط مطلوب" };
    if (s.includes(" "))
      return { type: "warn" as const, text: "يفضل بدون مسافات" };
    return { type: "ok" as const, text: "تمام" };
  }, [form.slug]);

  const validate = () => {
    const title = form.title.trim();
    const slug = form.slug.trim();
    const content = form.content.trim();

    if (!categories.length) return { ok: false, msg: "لا توجد تصنيفات حالياً" };
    if (!form.category_id) return { ok: false, msg: "اختر تصنيف" };

    if (!title) return { ok: false, msg: "العنوان مطلوب" };
    if (!slug) return { ok: false, msg: "الرابط مطلوب" };

    // ✅ مهم جدًا: الباك يطلب content في الإنشاء
    if (!content) return { ok: false, msg: "المحتوى مطلوب" };

    if (!form.status) return { ok: false, msg: "الحالة مطلوبة" };

    if (title.length > 255) return { ok: false, msg: "العنوان طويل" };
    if (slug.length > 255) return { ok: false, msg: "الرابط طويل" };

    if (form.image.trim()) {
      try {
        // eslint-disable-next-line no-new
        new URL(form.image.trim());
      } catch {
        return { ok: false, msg: "رابط الصورة غير صالح" };
      }
    }

    if (form.search_title.trim().length > 255)
      return { ok: false, msg: "عنوان البحث طويل" };
    if (form.search_description.trim().length > 5000)
      return { ok: false, msg: "وصف البحث طويل" };

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

      const payload = {
        title: form.title.trim(),
        // slug في الباك بيتعمل تلقائيًا من العنوان (إرساله مش مؤثر لكن مش هيبوّظ)
        slug: form.slug.trim(),

        category_id: Number(form.category_id),

        excerpt: form.excerpt?.trim() || null,
        content: form.content.trim(), // ✅ required

        // ✅ هنا الإصلاح الحقيقي
        image: form.image?.trim() || null,

        status: form.status,

        // SEO (لو عندك أعمدة)
        seo_title: form.search_title?.trim() || null,
        seo_description: form.search_description?.trim() || null,
      };

      await api.post("/api/admin/blog/posts", payload);

      toast.success("تمت الإضافة");
      router.replace("/admin/blog/posts");
      router.refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const selectedCategoryName =
    form.category_id && categories.length
      ? categories.find((c) => String(c.id) === String(form.category_id))
          ?.name || "—"
      : "—";

  const previewHtml = contentToPreviewHtml(form.content);

  return (
    <div className="min-h-screen bg-background text-foreground rtl">
      {/* Header */}
      <div className="border-b border-border bg-card/30">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary">
                إضافة مقال
              </h1>
              <p className="text-foreground/60 mt-2 text-sm">
                اكتب المقال بشكل منظم مع معاينة قبل الحفظ
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <LoadingLink
                href="/admin/blog/posts"
                className="bg-card border border-border hover:bg-border/60 px-4 py-2 rounded-xl flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                رجوع
              </LoadingLink>

              <button
                onClick={fetchCategories}
                className="bg-card border border-border hover:bg-border/60 px-4 py-2 rounded-xl flex items-center gap-2"
                type="button"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loadingCats ? "animate-spin" : ""}`}
                />
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
                  ? "bg-primary text-primary-foreground border-primary"
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
                  ? "bg-primary text-primary-foreground border-primary"
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
              {form.image?.trim() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.image.trim()}
                  alt=""
                  className="w-28 h-28 rounded-2xl object-cover border border-border"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-border/60 border border-border flex items-center justify-center">
                  <ImageIcon className="w-7 h-7 text-foreground/60" />
                </div>
              )}

              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-primary line-clamp-2">
                  {form.title?.trim() || "عنوان المقال"}
                </h2>

                <p className="text-sm text-foreground/60 mt-1 flex items-center gap-2">
                  <Link2 size={14} />
                  <span className="truncate">
                    /blog/{form.slug?.trim() || "..."}
                  </span>
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
                    التصنيف:{" "}
                    <span className="font-bold">{selectedCategoryName}</span>
                  </span>
                </div>
              </div>
            </div>

            {form.excerpt?.trim() ? (
              <div className="rounded-2xl border border-border bg-background/40 p-4">
                <h4 className="font-bold mb-2">نبذة</h4>
                <p className="text-foreground/80 leading-7">
                  {form.excerpt.trim()}
                </p>
              </div>
            ) : null}

            <div className="rounded-2xl border border-border bg-background/40 p-4">
              <h4 className="font-bold mb-2">المحتوى</h4>
              {previewHtml ? (
                <div
                  className="prose max-w-none prose-invert prose-p:leading-7"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              ) : (
                <p className="text-foreground/50">لا يوجد محتوى.</p>
              )}
            </div>

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
          <form
            onSubmit={submit}
            className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-2xl"
          >
            {/* Title + Link */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">العنوان</label>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="مثال: نصائح مهمة قبل شراء سيارة"
                  required
                />
                <div className="text-xs text-foreground/60 mt-1">
                  {form.title.length}/255
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="block text-sm font-bold">الرابط</label>
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
                    placeholder="عنوان-الرابط"
                    required
                  />
                </div>

                <div className="mt-1 flex items-center gap-2 text-xs">
                  {linkHelp.type === "ok" ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-500">{linkHelp.text}</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="text-amber-500">{linkHelp.text}</span>
                    </>
                  )}
                  <span className="text-foreground/50">
                    ({form.slug.length}/255)
                  </span>
                </div>
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">
                  التصنيف (إجباري)
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, category_id: e.target.value }))
                  }
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
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">
                  الحالة (إجباري)
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, status: e.target.value as any }))
                  }
                  className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="draft">مسودة</option>
                  <option value="published">منشور</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">ملاحظة</label>
                <div className="w-full p-3 border border-border rounded-xl bg-background/40 text-sm text-foreground/60">
                  الباك إند بيحدد published_at تلقائيًا عند النشر.
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="rounded-2xl border border-border bg-background/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="w-4 h-4 text-foreground/70" />
                <label className="block text-sm font-bold">صورة المقال</label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div className="md:col-span-2">
                  <input
                    value={form.image}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, image: e.target.value }))
                    }
                    className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="ضع رابط الصورة هنا (اختياري)"
                  />
                </div>

                <div className="rounded-xl border border-border bg-background/50 p-3 flex items-center justify-center">
                  {form.image?.trim() ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.image.trim()}
                      alt="preview"
                      className="w-full h-24 object-cover rounded-lg border border-border"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          "none";
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
              <label className="block text-sm font-bold mb-2">نبذة قصيرة</label>
              <textarea
                value={form.excerpt}
                onChange={(e) =>
                  setForm((p) => ({ ...p, excerpt: e.target.value }))
                }
                className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                rows={3}
                placeholder="سطرين أو ثلاثة تلخص المقال..."
              />
            </div>

            {/* Content */}
            <div className="rounded-2xl border border-border bg-background/40 p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="block text-sm font-bold">
                  المحتوى (إجباري)
                </label>
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
                onChange={(e) =>
                  setForm((p) => ({ ...p, content: e.target.value }))
                }
                className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                rows={12}
                placeholder="اكتب محتوى المقال هنا..."
                required
              />
            </div>

            {/* SEO */}
            <div className="rounded-2xl border border-border bg-background/40 p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">
                  عنوان يظهر في نتائج البحث (اختياري)
                </label>
                <input
                  value={form.search_title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, search_title: e.target.value }))
                  }
                  className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">
                  وصف يظهر في نتائج البحث (اختياري)
                </label>
                <textarea
                  value={form.search_description}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      search_description: e.target.value,
                    }))
                  }
                  className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={
                  saving ||
                  loadingCats ||
                  !categories.length ||
                  !form.category_id
                }
                className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground py-2 rounded-xl font-bold transition flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? "جارٍ الحفظ..." : "حفظ"}
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

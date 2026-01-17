"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  FileText,
  Image as ImageIcon,
  Link2,
  Loader2,
  Newspaper,
  Save,
  Settings2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

type BlogCategory = {
  id: number | string;
  name: string;
  slug: string;
};

type BlogPostApi = {
  id: number | string;
  title: string;
  slug: string;

  excerpt?: string | null;
  content?: string | null;

  // ✅ الصحيح
  image?: string | null;

  // fallback قديم
  cover_image?: string | null;
  thumbnail?: string | null;

  status?: "draft" | "published" | string | null;
  published_at?: string | null;

  is_published?: boolean | number | null;

  seo_title?: string | null;
  seo_description?: string | null;

  category?: BlogCategory | null;
  category_id?: number | string | null;
};

type ApiListResponse<T> =
  | { data: T[]; meta?: { total?: number } }
  | { data: { data: T[]; meta?: any } }
  | { data: T[]; total?: number }
  | T[];

function normalizeList<T>(resData: any): { list: T[] } {
  const root = resData;
  if (Array.isArray(root)) return { list: root as T[] };
  if (Array.isArray(root?.data)) return { list: root.data as T[] };
  const d1 = root?.data;
  if (Array.isArray(d1)) return { list: d1 as T[] };
  const d2 = d1?.data;
  if (Array.isArray(d2)) return { list: d2 as T[] };
  return { list: [] };
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

function toBool(v: any) {
  return v === true || v === 1 || v === "1" || v === "true";
}

function toDateTimeLocalValue(v?: string | null) {
  if (!v) return "";
  const s = String(v).replace(" ", "T");
  return s.length >= 16 ? s.slice(0, 16) : s;
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

function normalizeStatus(p: BlogPostApi): "draft" | "published" {
  const s = (p?.status || "").toString().toLowerCase().trim();
  if (s === "published") return "published";
  if (s === "draft") return "draft";
  const published = toBool(p?.is_published);
  return published ? "published" : "draft";
}

export default function AdminEditBlogPostPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);

  const [loadingPost, setLoadingPost] = useState(false);
  const [saving, setSaving] = useState(false);

  const [tab, setTab] = useState<"edit" | "preview">("edit");

  const [autoSlug, setAutoSlug] = useState(false);
  const slugTouchedRef = useRef(true);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    category_id: "",

    status: "draft" as "draft" | "published",
    published_at: "",

    // ✅ هنستخدم image
    image: "",

    excerpt: "",
    content: "",

    search_title: "",
    search_description: "",
  });

  const fetchCategories = async () => {
    try {
      setLoadingCats(true);
      const res = await api.get<ApiListResponse<BlogCategory>>("/api/admin/blog/categories");
      const { list } = normalizeList<BlogCategory>(res?.data);
      setCategories(list);
    } catch {
      setCategories([]);
    } finally {
      setLoadingCats(false);
    }
  };

  const fetchPost = async () => {
    try {
      setLoadingPost(true);
      const res = await api.get(`/api/admin/blog/posts/${id}`);
      const p: BlogPostApi = res?.data?.data ?? res?.data;

      const status = normalizeStatus(p);

      // ✅ الصورة: image أولاً
      const img = (p?.image || p?.cover_image || p?.thumbnail || "").trim();

      setForm({
        title: p?.title || "",
        slug: p?.slug || "",
        category_id: String(p?.category_id ?? p?.category?.id ?? ""),

        status,
        published_at: toDateTimeLocalValue(p?.published_at),

        image: img,

        excerpt: p?.excerpt || "",
        content: p?.content || "",

        search_title: p?.seo_title || "",
        search_description: p?.seo_description || "",
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "تعذر تحميل المقال");
      router.push("/admin/blog/posts");
    } finally {
      setLoadingPost(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchCategories();
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
    if (s.includes(" ")) return { type: "warn" as const, text: "يفضل بدون مسافات" };
    return { type: "ok" as const, text: "تمام" };
  }, [form.slug]);

  const validate = () => {
    const title = form.title.trim();
    const slug = form.slug.trim();

    if (!title) return { ok: false, msg: "العنوان مطلوب" };
    if (!slug) return { ok: false, msg: "الرابط مطلوب" };
    if (!form.category_id) return { ok: false, msg: "اختر تصنيف" };
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

    if (form.search_title.trim().length > 255) return { ok: false, msg: "عنوان البحث طويل" };
    if (form.search_description.trim().length > 5000) return { ok: false, msg: "وصف البحث طويل" };

    return { ok: true as const };
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    const v = validate();
    if (!v.ok) return toast.error(v.msg);

    try {
      setSaving(true);

      const payload: any = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        category_id: Number(form.category_id),

        status: form.status,

        // ✅ الإصلاح: image
        image: form.image?.trim() || null,

        excerpt: form.excerpt?.trim() || null,
        content: form.content?.trim() || null,

        seo_title: form.search_title?.trim() || null,
        seo_description: form.search_description?.trim() || null,
      };

      // لو status draft يبقى published_at هيتشال من الباك تلقائيًا — ولو published هيتحدد now لو فاضي
      // (مش بنبعت published_at لأنه مش مدعوم في validator عندك)

      await api.put(`/api/admin/blog/posts/${id}`, payload);
      toast.success("تم الحفظ");

      router.push("/admin/blog/posts");
      router.refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const loading = loadingPost;

  const categoryName =
    form.category_id
      ? categories.find((c) => String(c.id) === String(form.category_id))?.name || "تصنيف"
      : "بدون تصنيف";

  const previewHtml = contentToPreviewHtml(form.content);

  return (
    <div className="min-h-screen bg-background text-foreground p-2 rtl">
      {/* Top bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
              <Newspaper className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary">تعديل مقال</h1>
              <p className="text-foreground/70 mt-1">تعديل ومعاينة قبل الحفظ</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => router.push("/admin/blog/posts")}
            className="bg-card border border-border hover:bg-border/60 transition px-4 py-2 rounded-xl flex items-center"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            رجوع
          </button>

          <button
            type="button"
            onClick={() => setTab((t) => (t === "edit" ? "preview" : "edit"))}
            className="bg-card border border-border hover:bg-border/60 transition px-4 py-2 rounded-xl flex items-center"
          >
            <Eye className="w-4 h-4 ml-2" />
            {tab === "edit" ? "معاينة" : "تحرير"}
          </button>

          <button
            type="submit"
            form="edit-post-form"
            disabled={saving || loading}
            className="bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl transition flex items-center"
          >
            {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
            حفظ
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center text-foreground/70">
          جاري التحميل...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8">
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              <div className="border-b border-border p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <h2 className="font-bold">{tab === "edit" ? "تحرير المحتوى" : "معاينة"}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTab("edit")}
                    className={`px-3 py-2 rounded-xl border transition ${
                      tab === "edit" ? "bg-primary text-white border-primary" : "border-border hover:bg-border/60"
                    }`}
                  >
                    تحرير
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("preview")}
                    className={`px-3 py-2 rounded-xl border transition ${
                      tab === "preview" ? "bg-primary text-white border-primary" : "border-border hover:bg-border/60"
                    }`}
                  >
                    معاينة
                  </button>
                </div>
              </div>

              {tab === "preview" ? (
                <div className="p-6 space-y-4">
                  <div className="rounded-2xl border border-border bg-background/40 p-4">
                    <div className="flex items-start gap-4">
                      {form.image?.trim() ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={form.image.trim()}
                          alt=""
                          className="w-24 h-24 rounded-2xl object-cover border border-border"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-2xl bg-border/60 border border-border flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-foreground/60" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <h3 className="text-2xl font-bold text-primary leading-snug">{form.title.trim() || "عنوان المقال"}</h3>
                        <p className="text-sm text-foreground/60 mt-2 flex items-center gap-2">
                          <Link2 size={14} />
                          <span className="truncate">/blog/{form.slug.trim() || "..."}</span>
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

                          <span className="text-xs text-foreground/60">{categoryName}</span>
                        </div>
                      </div>
                    </div>

                    {form.excerpt.trim() ? (
                      <p className="text-foreground/70 mt-4 leading-7">{form.excerpt.trim()}</p>
                    ) : (
                      <p className="text-foreground/50 mt-4">لا توجد نبذة قصيرة.</p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-border bg-background/40 p-4">
                    <h4 className="font-bold mb-2">المحتوى</h4>
                    {previewHtml ? (
                      <div className="prose max-w-none prose-invert prose-p:leading-7" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    ) : (
                      <p className="text-foreground/50">لا يوجد محتوى.</p>
                    )}
                  </div>
                </div>
              ) : (
                <form id="edit-post-form" onSubmit={submit} className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-bold mb-2">العنوان</label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                      required
                    />
                    <div className="text-xs text-foreground/60 mt-1">{form.title.length}/255</div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-bold">الرابط</label>
                      <label className="flex items-center gap-2 text-xs text-foreground/70 select-none">
                        <input
                          type="checkbox"
                          checked={autoSlug}
                          onChange={(e) => {
                            setAutoSlug(e.target.checked);
                            if (e.target.checked) slugTouchedRef.current = false;
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
                        required
                      />
                    </div>

                    <div className="mt-2 flex items-center gap-2 text-xs">
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
                      <span className="text-foreground/50">({form.slug.length}/255)</span>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          slugTouchedRef.current = true;
                          setAutoSlug(false);
                          setForm((p) => ({ ...p, slug: slugify(p.title) }));
                        }}
                        className="text-xs px-3 py-2 rounded-lg border border-border hover:bg-border/60 transition"
                      >
                        توليد من العنوان
                      </button>
                    </div>
                  </div>

                  {/* Image */}
                  <div className="rounded-2xl border border-border bg-background/40 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ImageIcon className="w-4 h-4 text-foreground/70" />
                      <label className="block text-sm font-bold">صورة المقال</label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                      <div className="md:col-span-2">
                        <input
                          value={form.image}
                          onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
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
                            className="w-full h-28 object-cover rounded-lg border border-border"
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

                  <div className="rounded-2xl border border-border bg-background/40 p-4">
                    <label className="block text-sm font-bold mb-2">نبذة قصيرة</label>
                    <textarea
                      value={form.excerpt}
                      onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
                      className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                      rows={3}
                    />
                  </div>

                  <div className="rounded-2xl border border-border bg-background/40 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-bold">المحتوى</label>
                      <button
                        type="button"
                        onClick={() => setTab("preview")}
                        className="text-xs px-3 py-2 rounded-lg border border-border hover:bg-border/60 transition flex items-center gap-2"
                      >
                        <Eye size={14} />
                        معاينة
                      </button>
                    </div>

                    <textarea
                      value={form.content}
                      onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                      className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                      rows={12}
                      placeholder="اكتب محتوى المقال هنا..."
                    />
                  </div>

                  <div className="rounded-2xl border border-border bg-background/40 p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-bold mb-2">عنوان يظهر في نتائج البحث (اختياري)</label>
                      <input
                        value={form.search_title}
                        onChange={(e) => setForm((p) => ({ ...p, search_title: e.target.value }))}
                        className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2">وصف يظهر في نتائج البحث (اختياري)</label>
                      <textarea
                        value={form.search_description}
                        onChange={(e) => setForm((p) => ({ ...p, search_description: e.target.value }))}
                        className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                        rows={3}
                      />
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Side settings */}
          <div className="xl:col-span-4">
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              <div className="border-b border-border p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-primary" />
                  <h2 className="font-bold">إعدادات</h2>
                </div>

                <button
                  type="button"
                  onClick={fetchCategories}
                  className="text-xs px-3 py-2 rounded-xl border border-border hover:bg-border/60 transition flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingCats ? "animate-spin" : ""}`} />
                  تحديث
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">التصنيف (إجباري)</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
                    className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                    disabled={loadingCats}
                  >
                    <option value="">اختر تصنيف</option>
                    {categories.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">الحالة (إجباري)</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as any }))}
                    className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="draft">مسودة</option>
                    <option value="published">منشور</option>
                  </select>
                </div>

                <button
                  type="submit"
                  form="edit-post-form"
                  disabled={saving || loading}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl transition flex items-center justify-center"
                >
                  {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                  حفظ
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/admin/blog/posts")}
                  className="w-full bg-card border border-border hover:bg-border/60 transition px-4 py-3 rounded-xl flex items-center justify-center"
                >
                  <ArrowRight className="w-4 h-4 ml-2" />
                  رجوع للقائمة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

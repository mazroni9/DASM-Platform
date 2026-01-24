"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/axios";
import LoadingLink from "@/components/LoadingLink";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Link2,
  Save,
  Tags,
  Eye,
  FileText,
} from "lucide-react";

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

export default function AdminBlogCategoryCreatePage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const [autoSlug, setAutoSlug] = useState(true);
  const slugTouchedRef = useRef(false);

  const [errorMsg, setErrorMsg] = useState<string>("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    is_active: true,
  });

  useEffect(() => {
    if (!autoSlug) return;
    if (slugTouchedRef.current) return;
    if (!form.name.trim()) return;
    setForm((p) => ({ ...p, slug: slugify(p.name) }));
  }, [form.name, autoSlug]);

  const slugHelp = useMemo(() => {
    const s = form.slug.trim();
    if (!s) return { type: "warn" as const, text: "الرابط مطلوب" };
    if (s.includes(" "))
      return { type: "warn" as const, text: "يفضل بدون مسافات" };
    return { type: "ok" as const, text: "تمام" };
  }, [form.slug]);

  const validate = () => {
    const name = form.name.trim();
    const slug = form.slug.trim();
    if (!name) return "اسم التصنيف مطلوب";
    if (!slug) return "الرابط مطلوب";
    if (slug.includes(" ")) return "الرابط لا يجب أن يحتوي مسافات";
    if (name.length > 255) return "اسم التصنيف طويل";
    if (slug.length > 255) return "الرابط طويل";
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

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        is_active: !!form.is_active,
      };

      await api.post("/api/admin/blog/categories", payload);

      toast.success("تمت الإضافة");
      router.push("/admin/blog/categories");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const PreviewCard = (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold text-primary line-clamp-2">
            {form.name.trim() || "اسم التصنيف"}
          </h2>
          <p className="text-sm text-foreground/60 mt-2 flex items-center gap-2">
            <Link2 size={14} />
            <span className="truncate">
              /blog/category/{form.slug.trim() || "..."}
            </span>
          </p>

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${
                form.is_active
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : "bg-red-500/10 text-red-500 border-red-500/20"
              }`}
            >
              {form.is_active ? "نشط" : "غير نشط"}
            </span>
          </div>
        </div>

        <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Tags className="w-5 h-5 text-primary" />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-background/40 p-4">
        <div className="font-bold mb-2">الوصف</div>
        {form.description.trim() ? (
          <p className="text-foreground/70 leading-7">
            {form.description.trim()}
          </p>
        ) : (
          <p className="text-foreground/50">لا يوجد وصف.</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-2 rtl">
      {/* Top bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">
            إضافة تصنيف
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <LoadingLink
            href="/admin/blog/categories"
            className="bg-card border border-border hover:bg-border/60 px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            رجوع
          </LoadingLink>

          <button
            type="button"
            onClick={() =>
              setActiveTab((p) => (p === "edit" ? "preview" : "edit"))
            }
            className="bg-card border border-border hover:bg-border/60 px-4 py-2 rounded-xl flex items-center gap-2"
          >
            {activeTab === "edit" ? (
              <Eye className="w-4 h-4" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            {activeTab === "edit" ? "معاينة" : "تحرير"}
          </button>
        </div>
      </div>

      {/* Error */}
      {errorMsg ? (
        <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500 px-4 py-3">
          {errorMsg}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2">
          {activeTab === "preview" ? (
            PreviewCard
          ) : (
            <form
              onSubmit={submit}
              className="bg-card border border-border rounded-2xl p-6 space-y-6"
            >
              {/* name + slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">
                    اسم التصنيف
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="مثال: سيارات مزادات"
                    required
                  />
                  <div className="text-xs text-foreground/60 mt-1">
                    {form.name.length}/255
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
                          if (e.target.checked) {
                            slugTouchedRef.current = false;
                            if (form.name.trim())
                              setForm((p) => ({ ...p, slug: slugify(p.name) }));
                          } else {
                            slugTouchedRef.current = true;
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
                      placeholder="cars-auctions"
                      required
                    />
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-xs">
                    {slugHelp.type === "ok" ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-500">
                          {slugHelp.text}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span className="text-amber-500">{slugHelp.text}</span>
                      </>
                    )}
                    <span className="text-foreground/50">
                      ({form.slug.length}/255)
                    </span>
                  </div>
                </div>
              </div>

              {/* description */}
              <div className="rounded-2xl border border-border bg-background/40 p-4">
                <label className="block text-sm font-bold mb-2">
                  وصف (اختياري)
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  className="w-full p-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                  rows={4}
                  placeholder="وصف بسيط يظهر تحت التصنيف..."
                />
              </div>

              {/* active */}
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background/40 p-4">
                <div>
                  <div className="font-bold">الحالة</div>
                  <div className="text-xs text-foreground/60 mt-1">
                    نشط = يظهر
                  </div>
                </div>

                <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, is_active: e.target.checked }))
                    }
                    className="h-5 w-5 accent-primary"
                  />
                  <span className="text-sm font-semibold text-foreground/80">
                    {form.is_active ? "نشط" : "غير نشط"}
                  </span>
                </label>
              </div>

              {/* actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground py-2 rounded-xl font-bold transition flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "جارٍ الحفظ..." : "حفظ"}
                </button>

                <LoadingLink
                  href="/admin/blog/categories"
                  className="flex-1 bg-border hover:bg-border/80 py-2 rounded-xl font-bold transition text-center"
                >
                  إلغاء
                </LoadingLink>
              </div>
            </form>
          )}
        </div>

        {/* Side */}
        <div className="hidden lg:block">{PreviewCard}</div>
      </div>
    </div>
  );
}

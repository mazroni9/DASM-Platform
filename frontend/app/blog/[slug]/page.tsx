"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import api from "@/lib/axios";
import Footer from "@/components/shared/Footer";
import LoadingLink from "@/components/LoadingLink";
import { ArrowRight, Calendar, Tags, Image as ImageIcon } from "lucide-react";

type BlogPost = {
  id?: number | string;
  title: string;
  slug: string;

  content?: string | null;
  excerpt?: string | null;

  image?: string | null;
  published_at?: string | null;
  created_at?: string | null;

  category?: { name: string; slug: string } | null;
  tags?: { id: number | string; name: string }[];
  user?: { id: number | string; first_name?: string; last_name?: string };

  cover_image?: string | null;
  thumbnail?: string | null;
};

function safeDateLabel(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "—";
  }
}

function isBadSlug(s: string) {
  const v = (s || "").trim();
  return !v || v === "undefined" || v === "null";
}

function safeDecode(v: string) {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

function escapeHtml(text: string) {
  return (text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function contentToHtml(content: string) {
  const c = (content || "").trim();
  if (!c) return "";
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(c);
  if (looksLikeHtml) return c;
  return escapeHtml(c).replace(/\n/g, "<br />");
}

function isAbortError(err: any) {
  const n = err?.name;
  const c = err?.code;
  const m = String(err?.message || "").toLowerCase();
  return n === "CanceledError" || n === "AbortError" || c === "ERR_CANCELED" || m.includes("canceled") || m.includes("aborted");
}

export default function BlogSinglePage({ params }: { params?: { slug?: string | string[] } }) {
  const routeParams = useParams();
  const pathname = usePathname();

  const slug = useMemo(() => {
    const p = params?.slug;
    const fromProps = typeof p === "string" ? p : Array.isArray(p) ? p[0] : "";

    const rp: any = routeParams as any;
    const r = rp?.slug;
    const fromRoute = typeof r === "string" ? r : Array.isArray(r) ? r[0] : "";

    const parts = (pathname || "").split("/").filter(Boolean);
    const last = parts.length ? parts[parts.length - 1] : "";
    const fromPath = last ? safeDecode(last) : "";

    return safeDecode((fromProps || fromRoute || fromPath || "").trim()).trim();
  }, [params?.slug, routeParams, pathname]);

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  const lastFetchedSlugRef = useRef<string>("");
  const abortRef = useRef<AbortController | null>(null);

  const cover = useMemo(() => (post ? (post.image || post.cover_image || post.thumbnail || "").trim() : ""), [post]);
  const dateLabel = useMemo(() => (post ? safeDateLabel(post.published_at || post.created_at) : "—"), [post]);
  const articleHtml = useMemo(() => (post ? contentToHtml(post.content || "") : ""), [post]);

  const fetchPost = async (slugValue: string) => {
    const clean = (slugValue || "").trim();

    if (isBadSlug(clean)) {
      setPost(null);
      setLoading(false);
      return;
    }

    if (lastFetchedSlugRef.current === clean) return;
    lastFetchedSlugRef.current = clean;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);

      const encoded = encodeURIComponent(clean);

      // ✅ Public show الصحيح: GET /api/blog/{slug}
      const res = await api.get(`/api/blog/${encoded}`, { signal: controller.signal });
      const payload = res?.data;

      if (payload?.success === false) {
        setPost(null);
        return;
      }

      const data = payload?.data ?? null;
      setPost(data && data?.title ? (data as BlogPost) : null);
    } catch (err: any) {
      if (isAbortError(err)) return;
      setPost(null);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost(slug);
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return (
    <>
      {/* Top bar */}
      <section className="bg-background border-b border-border">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-6 rtl">
          <LoadingLink href="/blog" className="inline-flex items-center gap-2 text-foreground/70 hover:text-foreground font-semibold">
            <ArrowRight className="w-4 h-4" />
            الرجوع للمدونة
          </LoadingLink>
        </div>
      </section>

      {/* Content */}
      <section className="bg-background">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-8 md:py-12 rtl">
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
              <div className="lg:col-span-12">
                <div className="h-[280px] md:h-[420px] bg-card border border-border rounded-3xl overflow-hidden">
                  <div className="h-full bg-border/70" />
                </div>
              </div>

              {/* ✅ المقال صار أكبر */}
              <div className="lg:col-span-9">
                <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-4">
                  <div className="h-4 w-40 bg-border rounded" />
                  <div className="h-8 w-3/4 bg-border rounded" />
                  <div className="h-4 w-full bg-border rounded" />
                  <div className="h-4 w-5/6 bg-border rounded" />
                  <div className="h-4 w-4/6 bg-border rounded" />
                </div>
              </div>

              {/* ✅ السايدبار أصغر */}
              <div className="lg:col-span-3">
                <div className="bg-card border border-border rounded-3xl p-5 md:p-6 space-y-3">
                  <div className="h-4 w-2/3 bg-border rounded" />
                  <div className="h-10 w-full bg-border rounded" />
                  <div className="h-10 w-full bg-border rounded" />
                </div>
              </div>
            </div>
          ) : !post ? (
            <div className="bg-card border border-border rounded-3xl p-10 text-center">
              <p className="text-foreground font-bold text-lg">المقال غير موجود</p>
              <p className="text-foreground/60 text-sm mt-2">قد يكون تم حذفه أو تغيير الرابط.</p>

              <div className="mt-6 flex justify-center">
                <LoadingLink href="/blog" className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-bold transition">
                  الرجوع للمدونة
                </LoadingLink>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Hero */}
              <div className="lg:col-span-12">
                <div className="relative rounded-3xl overflow-hidden border border-border bg-card">
                  <div className="h-[280px] md:h-[440px] bg-border/60">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-foreground/60">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-5 h-5" />
                          لا يوجد صورة
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/35 to-transparent" />

                  <div className="absolute bottom-0 right-0 left-0 p-5 md:p-8">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-foreground/80">
                      <span className="inline-flex items-center gap-2 bg-card/70 border border-border backdrop-blur px-3 py-1.5 rounded-full">
                        <Tags className="w-4 h-4 text-primary" />
                        {post.category?.name || "عام"}
                      </span>

                      <span className="inline-flex items-center gap-2 bg-card/70 border border-border backdrop-blur px-3 py-1.5 rounded-full">
                        <Calendar className="w-4 h-4 text-primary" />
                        {dateLabel}
                      </span>

                      {post.tags?.length ? (
                        <span className="inline-flex items-center gap-2 bg-card/70 border border-border backdrop-blur px-3 py-1.5 rounded-full">
                          <Tags className="w-4 h-4 text-primary" />
                          {post.tags.slice(0, 2).map((t) => t.name).join("، ")}
                          {post.tags.length > 2 ? "..." : ""}
                        </span>
                      ) : null}
                    </div>

                    <h1 className="mt-4 text-2xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-foreground">
                      {post.title}
                    </h1>

                    {post.excerpt ? (
                      <p className="mt-3 text-foreground/80 leading-relaxed text-base md:text-lg max-w-4xl">
                        {post.excerpt}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* ✅ Article (أكبر + شكل أجمل) */}
              <div className="lg:col-span-9">
                <article className="bg-card border border-border rounded-3xl p-6 md:p-10 shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <div>
                      <div className="text-xs font-bold text-foreground/50">محتوى المقال</div>
                      <div className="h-1 w-14 bg-primary/30 rounded-full mt-2" />
                    </div>
                    <div className="text-xs text-foreground/50">{dateLabel}</div>
                  </div>

                  <div
                    className="
                      prose prose-zinc dark:prose-invert max-w-none
                      prose-p:leading-8 prose-li:leading-8
                      prose-headings:font-extrabold prose-headings:text-foreground
                      prose-a:text-primary prose-a:font-bold prose-a:no-underline hover:prose-a:underline
                      prose-img:rounded-2xl prose-img:border prose-img:border-border
                      prose-hr:border-border
                      prose-blockquote:border-primary/30
                    "
                  >
                    <div dangerouslySetInnerHTML={{ __html: articleHtml }} />
                  </div>
                </article>
              </div>

              {/* ✅ Sidebar أصغر + أنظف */}
              <aside className="lg:col-span-3">
                <div className="bg-card border border-border rounded-3xl p-5 md:p-6 shadow-sm lg:sticky lg:top-6 space-y-3">
                  <div className="rounded-2xl border border-border bg-background/40 p-4">
                    <div className="flex items-center gap-2 text-sm text-foreground/70">
                      <Tags className="w-4 h-4 text-primary" />
                      التصنيف
                    </div>
                    <p className="font-extrabold text-foreground mt-1">{post.category?.name || "عام"}</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-background/40 p-4">
                    <div className="flex items-center gap-2 text-sm text-foreground/70">
                      <Calendar className="w-4 h-4 text-primary" />
                      تاريخ النشر
                    </div>
                    <p className="font-bold text-foreground mt-1">{dateLabel}</p>
                  </div>

                  {post.tags?.length ? (
                    <div className="rounded-2xl border border-border bg-background/40 p-4">
                      <div className="flex items-center gap-2 text-sm text-foreground/70">
                        <Tags className="w-4 h-4 text-primary" />
                        الوسوم
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {post.tags.slice(0, 8).map((t) => (
                          <span
                            key={t.id}
                            className="px-3 py-1 rounded-full text-xs font-bold bg-card border border-border text-foreground/80"
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex">
                    <LoadingLink
                      href="/blog"
                      className="w-full bg-border hover:bg-border/80 py-3 rounded-2xl font-extrabold transition text-center"
                    >
                      رجوع
                    </LoadingLink>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}

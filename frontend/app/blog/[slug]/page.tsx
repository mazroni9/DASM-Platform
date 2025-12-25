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

  cover_image?: string | null;
  is_published?: boolean | number | null;

  published_at?: string | null;
  created_at?: string | null;

  category?: { name: string; slug: string } | null;

  thumbnail?: string | null;
};

function safeDateLabel(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

export default function BlogSinglePage({
  params,
}: {
  params?: { slug?: string | string[] };
}) {
  const routeParams = useParams();
  const pathname = usePathname();

  // ✅ استخراج slug بشكل مضمون (params -> useParams -> pathname)
  const slug = useMemo(() => {
    // 1) من props params لو موجودة
    const p = params?.slug;
    const fromProps =
      typeof p === "string" ? p : Array.isArray(p) ? p[0] : "";

    // 2) من useParams لو موجود
    const rp: any = routeParams as any;
    const r = rp?.slug;
    const fromRoute =
      typeof r === "string" ? r : Array.isArray(r) ? r[0] : "";

    // 3) fallback من الـ URL نفسه (آخر جزء في المسار)
    const parts = (pathname || "").split("/").filter(Boolean);
    const last = parts.length ? parts[parts.length - 1] : "";
    const fromPath = last ? safeDecode(last) : "";

    const chosen = (fromProps || fromRoute || fromPath || "").trim();
    return safeDecode(chosen).trim();
  }, [params?.slug, routeParams, pathname]);

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  const lastFetchedSlugRef = useRef<string>("");
  const abortRef = useRef<AbortController | null>(null);

  const cover = useMemo(() => {
    if (!post) return "";
    return (post.cover_image || post.thumbnail || "").trim();
  }, [post]);

  const dateLabel = useMemo(() => {
    if (!post) return "—";
    return safeDateLabel(post.published_at || post.created_at);
  }, [post]);

  const fetchPost = async (slugValue: string) => {
    const clean = (slugValue || "").trim();

    // ✅ ممنوع أي طلب لو slug بايظ
    if (isBadSlug(clean)) {
      setPost(null);
      setLoading(false);
      return;
    }

    // ✅ ممنوع تكرار نفس الطلب
    if (lastFetchedSlugRef.current === clean) return;
    lastFetchedSlugRef.current = clean;

    // ✅ الغاء أي طلب سابق لو موجود
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);

      // ✅ مهم للعربي
      const encoded = encodeURIComponent(clean);

      const res = await api.get(`/api/blog/posts/${encoded}`, {
        signal: controller.signal,
      });

      const data = res?.data?.data ?? res?.data ?? null;

      // لو الـ API رجّع فاضي أو مش نفس المقال
      if (!data || !data?.title) {
        setPost(null);
      } else {
        setPost(data);
      }
    } catch {
      setPost(null);
    } finally {
      // لو الطلب ده اتلغى بسبب تغيير slug، ما نوقف loading هنا
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // كل مرة slug يتغير → نجرب نجيب المقال
    // ولو slug بايظ نعرض Not Found من غير أي request
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
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-6">
          <LoadingLink
            href="/blog"
            className="inline-flex items-center gap-2 text-foreground/70 hover:text-foreground font-semibold"
          >
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
                <div className="h-[320px] md:h-[420px] bg-card border border-border rounded-3xl overflow-hidden">
                  <div className="h-full bg-border/70" />
                </div>
              </div>
              <div className="lg:col-span-8">
                <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-4">
                  <div className="h-4 w-40 bg-border rounded" />
                  <div className="h-8 w-3/4 bg-border rounded" />
                  <div className="h-4 w-full bg-border rounded" />
                  <div className="h-4 w-5/6 bg-border rounded" />
                  <div className="h-4 w-4/6 bg-border rounded" />
                </div>
              </div>
              <div className="lg:col-span-4">
                <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-3">
                  <div className="h-4 w-2/3 bg-border rounded" />
                  <div className="h-10 w-full bg-border rounded" />
                  <div className="h-10 w-full bg-border rounded" />
                </div>
              </div>
            </div>
          ) : !post ? (
            <div className="bg-card border border-border rounded-3xl p-10 text-center">
              <p className="text-foreground font-bold text-lg">المقال غير موجود</p>
              <p className="text-foreground/60 text-sm mt-2">
                قد يكون تم حذفه أو تغيير الرابط.
              </p>

              <div className="mt-6 flex justify-center">
                <LoadingLink
                  href="/blog"
                  className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-bold transition"
                >
                  الرجوع للمدونة
                </LoadingLink>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Hero */}
              <div className="lg:col-span-12">
                <div className="relative rounded-3xl overflow-hidden border border-border bg-card">
                  <div className="h-[320px] md:h-[460px] bg-border/60">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display =
                            "none";
                        }}
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

                  {/* overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/35 to-transparent" />

                  <div className="absolute bottom-0 right-0 left-0 p-5 md:p-8">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-foreground/80">
                      <span className="inline-flex items-center gap-2 bg-card/60 border border-border backdrop-blur px-3 py-1.5 rounded-full">
                        <Tags className="w-4 h-4 text-primary" />
                        {post.category?.name || "عام"}
                      </span>

                      <span className="inline-flex items-center gap-2 bg-card/60 border border-border backdrop-blur px-3 py-1.5 rounded-full">
                        <Calendar className="w-4 h-4 text-primary" />
                        {dateLabel}
                      </span>
                    </div>

                    <h1 className="mt-4 text-2xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-foreground">
                      {post.title}
                    </h1>

                    {post.excerpt ? (
                      <p className="mt-4 text-foreground/80 leading-relaxed text-base md:text-lg max-w-4xl">
                        {post.excerpt}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Article */}
              <div className="lg:col-span-8">
                <article className="bg-card border border-border rounded-3xl p-6 md:p-10 shadow-sm">
                  <div className="prose prose-zinc dark:prose-invert max-w-none prose-p:leading-8 prose-li:leading-8">
                    <div
                      dangerouslySetInnerHTML={{ __html: post.content || "" }}
                    />
                  </div>
                </article>
              </div>

              {/* Sidebar */}
              <aside className="lg:col-span-4">
                <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm sticky top-6 space-y-4">
                  <div className="rounded-2xl border border-border bg-background/40 p-4">
                    <p className="text-sm text-foreground/70">التصنيف</p>
                    <p className="font-extrabold text-foreground mt-1">
                      {post.category?.name || "عام"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-background/40 p-4">
                    <p className="text-sm text-foreground/70">تاريخ النشر</p>
                    <p className="font-bold text-foreground mt-1">{dateLabel}</p>
                  </div>

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

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/axios";
import LoadingLink from "@/components/LoadingLink";
import Footer from "@/components/shared/Footer";
import { Search, Tags, FileText, ArrowLeft, Calendar, Image as ImageIcon } from "lucide-react";

type BlogCategory = {
  id: number | string;
  name: string;
  slug: string;
  description?: string | null;
  posts_count?: number;
};

type BlogPost = {
  id: number | string;
  title: string;
  slug: string;
  excerpt?: string | null;

  // ✅ في الباك: image
  image?: string | null;
  published_at?: string | null;
  created_at?: string | null;

  category?: BlogCategory | null;
  tags?: { id: number | string; name: string }[];
  user?: { id: number | string; first_name?: string; last_name?: string };

  // fallback قديم (لو لسه موجود في داتا قديمة)
  cover_image?: string | null;
  thumbnail?: string | null;
};

type Paginator<T> = {
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
  data?: T[];
};

function safeDateLabel(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

function uniqById<T extends { id: any }>(arr: T[]) {
  const m = new Map<string, T>();
  for (const x of arr) {
    const k = String(x.id);
    if (!m.has(k)) m.set(k, x);
  }
  return Array.from(m.values());
}

/**
 * ✅ أهم fix:
 * - يدعم envelope: {success:true, data: paginator}
 * - يدعم paginator مباشر: {current_page,..., data:[...]}
 * - يدعم array مباشر
 */
function normalizePostsPayload<T>(payload: any): { list: T[]; total: number; last_page: number; current_page: number } {
  if (!payload) return { list: [], total: 0, last_page: 1, current_page: 1 };

  // Envelope
  if (payload?.success !== undefined) {
    return normalizePostsPayload<T>(payload?.data);
  }

  // Array direct
  if (Array.isArray(payload)) {
    return { list: payload as T[], total: payload.length, last_page: 1, current_page: 1 };
  }

  // Some APIs: { data: paginator }
  if (payload?.data && !Array.isArray(payload?.data) && (payload?.data?.current_page || payload?.data?.last_page)) {
    return normalizePostsPayload<T>(payload.data);
  }

  // Paginator direct (Laravel)
  const p: Paginator<T> = payload as any;
  const list = Array.isArray(p?.data) ? p.data : [];
  const total = typeof p?.total === "number" ? p.total : list.length;
  const last_page = Number(p?.last_page || 1);
  const current_page = Number(p?.current_page || 1);

  return { list, total, last_page, current_page };
}

function isAbortError(err: any) {
  const n = err?.name;
  const c = err?.code;
  const m = String(err?.message || "").toLowerCase();
  return n === "CanceledError" || n === "AbortError" || c === "ERR_CANCELED" || m.includes("canceled") || m.includes("aborted");
}

export default function BlogPage() {
  const PER_PAGE = 9;

  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);

  const [activeCategory, setActiveCategory] = useState<string>("all"); // slug
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const postsAbortRef = useRef<AbortController | null>(null);

  const canLoadMore = useMemo(() => page < lastPage && posts.length < total, [page, lastPage, posts.length, total]);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/blog/categories");
      const payload = res?.data;

      if (payload?.success === false) {
        setCategories([]);
        return;
      }

      const list = Array.isArray(payload?.data) ? (payload.data as BlogCategory[]) : [];
      setCategories(list);
    } catch {
      setCategories([]);
    }
  };

  const fetchPosts = async (opts?: { nextPage?: number; append?: boolean }) => {
    const nextPage = opts?.nextPage ?? 1;
    const append = !!opts?.append;

    // abort previous posts request
    if (postsAbortRef.current) postsAbortRef.current.abort();
    const controller = new AbortController();
    postsAbortRef.current = controller;

    try {
      setErrorMsg("");
      if (append) setLoadingMore(true);
      else setLoading(true);

      // ✅ Public list الصحيح: GET /api/blog
      const res = await api.get("/api/blog", {
        signal: controller.signal,
        params: {
          page: nextPage,
          per_page: PER_PAGE,
          category: activeCategory !== "all" ? activeCategory : undefined,
          search: search || undefined,
          sort_by: "published_at",
          sort_dir: "desc",
        },
      });

      const payload = res?.data;

      // لو success:false
      if (payload?.success === false) {
        if (!append) setPosts([]);
        setTotal(0);
        setLastPage(1);
        setErrorMsg(payload?.message || "تعذر تحميل المقالات.");
        return;
      }

      const normalized = normalizePostsPayload<BlogPost>(payload);
      setTotal(normalized.total);
      setLastPage(normalized.last_page);

      if (append) setPosts((prev) => uniqById([...prev, ...normalized.list]));
      else setPosts(normalized.list);
    } catch (err: any) {
      if (isAbortError(err)) return;

      if (!append) setPosts([]);
      setTotal(0);
      setLastPage(1);
      setErrorMsg("تعذر تحميل المقالات حالياً.");
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  // initial + category change
  useEffect(() => {
    // reset list state
    setPage(1);
    setPosts([]);
    setTotal(0);
    setLastPage(1);

    fetchCategories();
    fetchPosts({ nextPage: 1, append: false });

    return () => {
      if (postsAbortRef.current) postsAbortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  // search debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setPosts([]);
      setTotal(0);
      setLastPage(1);
      fetchPosts({ nextPage: 1, append: false });
    }, 450);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const loadMore = async () => {
    if (loadingMore || loading) return;
    const next = page + 1;
    setPage(next);
    await fetchPosts({ nextPage: next, append: true });
  };

  const visiblePosts = useMemo(() => posts, [posts]);

  return (
    <>
      {/* Hero */}
      <section className="bg-background border-b border-border rtl">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-12 md:py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-extrabold">مدونة DASMe</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold text-primary mt-5">أحدث المقالات</h1>
            <p className="text-foreground/70 max-w-2xl mx-auto mt-4">تصفّح حسب التصنيف، وابحث بسهولة عن المقال اللي يهمّك.</p>

            <div className="max-w-3xl mx-auto mt-8">
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/60" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث بعنوان المقال..."
                  className="w-full bg-card border border-border rounded-2xl py-3 pr-12 pl-4 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {errorMsg ? (
              <div className="mt-6 max-w-3xl mx-auto rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500 px-4 py-3 text-sm font-semibold">
                {errorMsg}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-background border-b border-border rtl">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-6">
          <div className="flex items-center gap-2 mb-3">
            <Tags className="w-4 h-4 text-primary" />
            <span className="text-sm font-extrabold text-foreground">التصنيفات</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-4 py-2 rounded-full text-sm font-bold border transition ${
                activeCategory === "all"
                  ? "bg-primary text-white border-primary"
                  : "bg-card text-foreground/80 border-border hover:bg-border/60"
              }`}
            >
              الكل
            </button>

            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.slug)}
                className={`px-4 py-2 rounded-full text-sm font-bold border transition ${
                  activeCategory === c.slug
                    ? "bg-primary text-white border-primary"
                    : "bg-card text-foreground/80 border-border hover:bg-border/60"
                }`}
              >
                {c.name}
                {typeof c.posts_count === "number" ? <span className="mr-2 text-xs opacity-70">({c.posts_count})</span> : null}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="bg-background rtl">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-10 md:py-14">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-3xl overflow-hidden animate-pulse">
                  <div className="h-48 bg-border/70" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 w-32 bg-border rounded" />
                    <div className="h-6 w-4/5 bg-border rounded" />
                    <div className="h-4 w-full bg-border rounded" />
                    <div className="h-4 w-5/6 bg-border rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : visiblePosts.length === 0 ? (
            <div className="bg-card border border-border rounded-3xl p-10 text-center">
              <p className="text-foreground font-bold text-lg">لا توجد مقالات حالياً</p>
              <p className="text-foreground/60 text-sm mt-2">جرّب تغيير التصنيف أو البحث.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {visiblePosts.map((p) => {
                  const cover = (p.image || p.cover_image || p.thumbnail || "").trim();
                  const dateLabel = safeDateLabel(p.published_at || p.created_at);
                  const catName = p.category?.name || "عام";

                  return (
                    <LoadingLink
                      key={p.id}
                      href={`/blog/${p.slug}`}
                      className="group bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition block focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label={p.title}
                    >
                      <div className="relative h-52 bg-border/60 overflow-hidden">
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cover}
                            alt={p.title}
                            className="w-full h-full object-cover transition duration-300 group-hover:scale-[1.02]"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
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

                        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent opacity-90" />

                        <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold px-3 py-1.5 rounded-full bg-card/70 border border-border backdrop-blur text-foreground">
                            {catName}
                          </span>

                          <span className="text-xs px-3 py-1.5 rounded-full bg-card/70 border border-border backdrop-blur text-foreground/80 inline-flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            {dateLabel}
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        <h3 className="text-lg md:text-xl font-extrabold text-foreground line-clamp-2">{p.title}</h3>
                        <p className="text-sm text-foreground/70 mt-2 line-clamp-3">{p.excerpt?.trim() ? p.excerpt : "—"}</p>

                        <div className="mt-5 inline-flex items-center gap-2 text-primary font-extrabold">
                          اقرأ المزيد
                          <ArrowLeft className="w-4 h-4 transition group-hover:-translate-x-0.5" />
                        </div>
                      </div>
                    </LoadingLink>
                  );
                })}
              </div>

              <div className="mt-10 flex justify-center">
                {canLoadMore ? (
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="bg-card border border-border hover:bg-border/60 transition px-6 py-3 rounded-2xl font-extrabold disabled:opacity-60"
                  >
                    {loadingMore ? "جارٍ التحميل..." : "تحميل المزيد"}
                  </button>
                ) : null}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}

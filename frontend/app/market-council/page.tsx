"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/axios";
import LoadingLink from "@/components/LoadingLink";
import Footer from "@/components/shared/Footer";
import { Tags, Calendar, Image as ImageIcon, Eye, Clock, Star } from "lucide-react";

type MarketCategory = {
  id: number | string;
  name_ar: string;
  name_en?: string | null;
  slug: string;
  description?: string | null;
  sort_order?: number;
  articles_count?: number;
};

type MarketArticle = {
  id: number | string;
  title_ar: string;
  title_en?: string | null;
  slug: string;
  excerpt_ar?: string | null;
  excerpt_en?: string | null;
  cover_image?: string | null;
  author_name?: string | null;
  read_time?: number;
  views_count?: number;
  likes_count?: number;
  comments_count?: number;
  saves_count?: number;
  is_featured?: boolean;
  published_at?: string | null;
  category?: { id: number | string; name_ar: string; name_en?: string | null; slug: string } | null;
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

function uniqById<T extends { id: unknown }>(arr: T[]) {
  const m = new Map<string, T>();
  for (const x of arr) {
    const k = String(x.id);
    if (!m.has(k)) m.set(k, x);
  }
  return Array.from(m.values());
}

function normalizeArticlesPayload<T>(payload: unknown): {
  list: T[];
  total: number;
  last_page: number;
  current_page: number;
} {
  if (!payload) return { list: [], total: 0, last_page: 1, current_page: 1 };

  const p = payload as { success?: boolean; data?: unknown };

  if (p?.success !== undefined && p?.success === false) {
    return { list: [], total: 0, last_page: 1, current_page: 1 };
  }

  if (p?.success !== undefined && p?.data !== undefined) {
    return normalizeArticlesPayload<T>(p.data);
  }

  if (Array.isArray(payload)) {
    return { list: payload as T[], total: (payload as T[]).length, last_page: 1, current_page: 1 };
  }

  const paginator = payload as Paginator<T>;
  const list = Array.isArray(paginator?.data) ? paginator.data : [];
  const total = typeof paginator?.total === "number" ? paginator.total : list.length;
  const last_page = Number(paginator?.last_page ?? 1);
  const current_page = Number(paginator?.current_page ?? 1);

  return { list, total, last_page, current_page };
}

function isAbortError(err: unknown) {
  const e = err as { name?: string; code?: string; message?: string };
  const m = String(e?.message || "").toLowerCase();
  return (
    e?.name === "CanceledError" ||
    e?.name === "AbortError" ||
    e?.code === "ERR_CANCELED" ||
    m.includes("canceled") ||
    m.includes("aborted")
  );
}

export default function MarketCouncilPage() {
  const PER_PAGE = 9;

  const [categories, setCategories] = useState<MarketCategory[]>([]);
  const [articles, setArticles] = useState<MarketArticle[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const articlesAbortRef = useRef<AbortController | null>(null);

  const canLoadMore = useMemo(
    () => page < lastPage && articles.length < total,
    [page, lastPage, articles.length, total]
  );

  const activeCategoryName = useMemo(() => {
    if (activeCategory === "all") return "الكل";
    return categories.find((c) => c.slug === activeCategory)?.name_ar || "—";
  }, [activeCategory, categories]);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/market-council/categories");
      const payload = res?.data;
      if (payload?.success === false) {
        setCategories([]);
        return;
      }
      const list = Array.isArray(payload?.data) ? (payload.data as MarketCategory[]) : [];
      setCategories(list);
    } catch {
      setCategories([]);
    }
  };

  const fetchArticles = async (opts?: { nextPage?: number; append?: boolean }) => {
    const nextPage = opts?.nextPage ?? 1;
    const append = !!opts?.append;

    if (articlesAbortRef.current) articlesAbortRef.current.abort();
    const controller = new AbortController();
    articlesAbortRef.current = controller;

    try {
      setErrorMsg("");
      if (append) setLoadingMore(true);
      else setLoading(true);

      const res = await api.get("/api/market-council/articles", {
        signal: controller.signal,
        params: {
          page: nextPage,
          per_page: PER_PAGE,
          category: activeCategory !== "all" ? activeCategory : undefined,
          featured: featuredOnly ? 1 : undefined,
        },
      });

      const payload = res?.data;
      if (payload?.success === false) {
        if (!append) setArticles([]);
        setTotal(0);
        setLastPage(1);
        setErrorMsg(payload?.message || "تعذر تحميل المقالات.");
        return;
      }

      const normalized = normalizeArticlesPayload<MarketArticle>(payload);
      setTotal(normalized.total);
      setLastPage(normalized.last_page);

      if (append) setArticles((prev) => uniqById([...prev, ...normalized.list]));
      else setArticles(normalized.list);
    } catch (err: unknown) {
      if (isAbortError(err)) return;
      if (!append) setArticles([]);
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

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setPage(1);
    setArticles([]);
    setTotal(0);
    setLastPage(1);
    fetchArticles({ nextPage: 1, append: false });
    return () => {
      if (articlesAbortRef.current) articlesAbortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, featuredOnly]);

  const loadMore = async () => {
    if (loadingMore || loading) return;
    const next = page + 1;
    setPage(next);
    await fetchArticles({ nextPage: next, append: true });
  };

  return (
    <>
      {/* Categories & filters */}
      <section className="bg-background border-b border-border rtl">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 pt-4 sm:pt-5 md:pt-6 pb-6">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div className="text-sm font-bold text-foreground/70 flex items-center gap-2">
              {loading ? (
                <span className="inline-block w-3.5 h-3.5 border-2 border-primary/40 border-t-primary rounded-full animate-spin shrink-0" />
              ) : null}
              <span>{loading ? "—" : total} مقالة • {activeCategoryName}</span>
            </div>
            <button
              onClick={() => setFeaturedOnly((v) => !v)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition ${
                featuredOnly
                  ? "bg-primary text-white border-primary"
                  : "bg-card text-foreground/80 border-border hover:bg-border/60"
              }`}
            >
              <Star className="w-4 h-4" />
              مميزة فقط
            </button>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Tags className="w-4 h-4 text-primary" />
            <span className="text-sm font-extrabold text-foreground">التصنيفات</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <button
              onClick={() => setActiveCategory("all")}
              className={`whitespace-nowrap shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition ${
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
                className={`whitespace-nowrap shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition ${
                  activeCategory === c.slug
                    ? "bg-primary text-white border-primary"
                    : "bg-card text-foreground/80 border-border hover:bg-border/60"
                }`}
              >
                {c.name_ar}
                {typeof c.articles_count === "number" ? (
                  <span className="mr-2 text-xs opacity-70">({c.articles_count})</span>
                ) : null}
              </button>
            ))}
          </div>

          {errorMsg ? (
            <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500 px-4 py-3 text-sm font-semibold">
              {errorMsg}
            </div>
          ) : null}
        </div>
      </section>

      {/* Articles grid */}
      <section className="bg-background rtl">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-10 md:py-14">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-3xl overflow-hidden animate-pulse"
                >
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
          ) : articles.length === 0 ? (
            <div className="bg-card border border-border rounded-3xl p-10 text-center">
              <p className="text-foreground font-bold text-lg">لا توجد مقالات حالياً</p>
              <p className="text-foreground/60 text-sm mt-2">جرّب تغيير التصنيف أو إلغاء فلتر المميزة.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {articles.map((a) => {
                  const cover = (a.cover_image || "").trim();
                  const dateLabel = safeDateLabel(a.published_at);
                  const catName = a.category?.name_ar || "—";

                  return (
                    <LoadingLink
                      key={a.id}
                      href={`/market-council/${a.slug}`}
                      className="group bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition block focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label={a.title_ar}
                    >
                      <div className="relative h-52 bg-border/60 overflow-hidden">
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cover}
                            alt={a.title_ar}
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

                        <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs font-extrabold px-3 py-1.5 rounded-full bg-card/70 border border-border backdrop-blur text-foreground">
                            {catName}
                          </span>
                          <div className="flex items-center gap-2">
                            {a.is_featured ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/90 text-white text-xs font-bold">
                                <Star className="w-3 h-3" />
                                مميز
                              </span>
                            ) : null}
                            <span className="text-xs px-3 py-1.5 rounded-full bg-card/70 border border-border backdrop-blur text-foreground/80 inline-flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-primary" />
                              {dateLabel}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <h3 className="text-lg md:text-xl font-extrabold text-foreground line-clamp-2">
                          {a.title_ar}
                        </h3>
                        <p className="text-sm text-foreground/70 mt-2 line-clamp-3">
                          {(a.excerpt_ar || a.excerpt_en || "").trim() || "—"}
                        </p>

                        <div className="mt-4 flex items-center gap-4 text-xs text-foreground/60">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {a.read_time ?? 1} د
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            {a.views_count ?? 0}
                          </span>
                        </div>

                        <div className="mt-5 inline-flex items-center gap-2 text-primary font-extrabold">
                          اقرأ المزيد
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
                    className="bg-card border border-border hover:bg-border/60 transition px-6 py-3 rounded-2xl font-extrabold disabled:opacity-60 flex items-center gap-2 justify-center"
                  >
                    {loadingMore ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span>تحميل...</span>
                      </>
                    ) : (
                      "تحميل المزيد"
                    )}
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

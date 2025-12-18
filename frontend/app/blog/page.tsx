"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import LoadingLink from "@/components/LoadingLink";
import Footer from "@/components/shared/Footer";
import { Search, Tags, FileText, ArrowLeft, Calendar, Image as ImageIcon } from "lucide-react";

type BlogCategory = {
  id: number | string;
  name: string;
  slug: string;
  description?: string | null;
};

type BlogPost = {
  id: number | string;
  title: string;
  slug: string;
  excerpt?: string | null;

  // ✅ الصحيح حسب الموديل
  cover_image?: string | null;
  published_at?: string | null;
  created_at?: string | null;
  category?: BlogCategory | null;

  // fallback قديم
  thumbnail?: string | null;
};

function safeDateLabel(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function BlogPage() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all"); // slug
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [catsRes, postsRes] = await Promise.all([
        api.get("/api/blog/categories"),
        api.get("/api/blog/posts", {
          params: {
            category: activeCategory !== "all" ? activeCategory : undefined,
            search: search || undefined,
          },
        }),
      ]);

      const cats = catsRes?.data?.data ?? catsRes?.data ?? [];
      const postsEnvelope = postsRes?.data?.data ?? postsRes?.data ?? null;

      // ✅ posts endpoint عندك بيرجع paginate => data: { data: [...] ... }
      const list = Array.isArray(postsEnvelope?.data)
        ? postsEnvelope.data
        : Array.isArray(postsEnvelope)
        ? postsEnvelope
        : [];

      setCategories(Array.isArray(cats) ? cats : []);
      setPosts(list);
    } catch {
      setCategories([]);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  useEffect(() => {
    const t = setTimeout(() => fetchData(), 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

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
            <p className="text-foreground/70 max-w-2xl mx-auto mt-4">
              تصفّح حسب التصنيف، وابحث بسهولة عن المقال اللي يهمّك.
            </p>

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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {visiblePosts.map((p) => {
                const cover = (p.cover_image || p.thumbnail || "").trim();
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
                      <h3 className="text-lg md:text-xl font-extrabold text-foreground line-clamp-2">
                        {p.title}
                      </h3>

                      <p className="text-sm text-foreground/70 mt-2 line-clamp-3">
                        {p.excerpt?.trim() ? p.excerpt : "—"}
                      </p>

                      <div className="mt-5 inline-flex items-center gap-2 text-primary font-extrabold">
                        اقرأ المزيد
                        <ArrowLeft className="w-4 h-4 transition group-hover:-translate-x-0.5" />
                      </div>
                    </div>
                  </LoadingLink>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}

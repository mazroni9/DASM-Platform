"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import Pagination from "@/components/OldPagination";
import LoadingLink from "@/components/LoadingLink";
import {
  Newspaper,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  Search,
  ExternalLink,
  Image as ImageIcon,
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

  // ✅ الصحيح في الباك الجديد
  image?: string | null;

  // fallback قديم
  cover_image?: string | null;
  thumbnail?: string | null;

  status?: "draft" | "published" | string | null;

  category?: BlogCategory | null;
  category_id?: number | string | null;

  published_at?: string | null;
  created_at?: string | null;

  // fallback قديم
  is_published?: boolean | number | null;
};

type ApiIndexResponse<T> =
  | { data: T[]; meta?: { total?: number } }
  | { data: { data: T[]; meta?: { total?: number } } }
  | { data: T[]; total?: number }
  | { data: { data: T[]; total?: number; meta?: { total?: number } } }
  | T[];

function normalizeList<T>(resData: any): { list: T[]; total?: number } {
  const root = resData;

  if (Array.isArray(root)) return { list: root as T[], total: root.length };

  // Laravel paginator style: { data: [...], total: n }
  if (Array.isArray(root?.data)) {
    const list = root.data as T[];
    const total =
      typeof root.total === "number"
        ? root.total
        : root?.meta?.total ?? list.length;
    return { list, total };
  }

  // { data: [...] }
  const d1 = root?.data;
  if (Array.isArray(d1)) return { list: d1 as T[], total: root?.meta?.total ?? d1.length };

  // { data: { data: [...], meta/total } }
  const d2 = d1?.data;
  if (Array.isArray(d2)) {
    const total = d1?.total ?? d1?.meta?.total ?? root?.meta?.total ?? d2.length;
    return { list: d2 as T[], total: typeof total === "number" ? total : d2.length };
  }

  return { list: [], total: 0 };
}

function safeDateLabel(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "—";
  }
}

// ✅ هنا الإصلاح: الصورة من image
function getCoverImage(p: BlogPostApi) {
  return (p.image || p.cover_image || p.thumbnail || "").trim() || null;
}

function isPublished(p: BlogPostApi) {
  const s = (p.status || "").toLowerCase();
  if (s === "published") return true;
  if (s === "draft") return false;

  // fallback قديم
  if (typeof p.is_published === "boolean") return p.is_published;
  if (typeof p.is_published === "number") return p.is_published === 1;
  return false;
}

export default function AdminBlogPostsPage() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [items, setItems] = useState<BlogPostApi[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);

  const fetchCategories = async () => {
    try {
      const res = await api.get<ApiIndexResponse<BlogCategory>>("/api/admin/blog/categories");
      const { list } = normalizeList<BlogCategory>(res?.data);
      setCategories(list);
    } catch {
      setCategories([]);
    }
  };

  const fetchPosts = async (pageOverride?: number) => {
    const page = pageOverride ?? currentPage;

    try {
      setLoading(true);

      const params: any = {
        page,
        per_page: pageSize,
        search: search.trim() || undefined,
        category_id: categoryFilter !== "all" ? Number(categoryFilter) : undefined,
      };

      // ✅ الباك إند بيفلتر بـ status فقط
      if (statusFilter !== "all") params.status = statusFilter;

      const res = await api.get<ApiIndexResponse<BlogPostApi>>("/api/admin/blog/posts", { params });
      const { list, total } = normalizeList<BlogPostApi>(res?.data);

      setItems(list);
      setTotalCount(typeof total === "number" ? total : list.length);
    } catch {
      setItems([]);
      setTotalCount(0);
      toast.error("تعذر تحميل القائمة");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, categoryFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      setCurrentPage(1);
      fetchPosts(1);
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const remove = async (id: number | string) => {
    if (!confirm("متأكد من حذف المقال؟")) return;
    try {
      await api.delete(`/api/admin/blog/posts/${id}`);
      toast.success("تم الحذف");
      fetchPosts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "تعذر الحذف");
    }
  };

  const visible = useMemo(() => items, [items]);

  return (
    <div className="min-h-screen bg-background text-foreground p-2 rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">المقالات</h1>
          <p className="text-foreground/70 mt-2">بحث، تصفية، تعديل، حذف</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => fetchPosts()}
            className="bg-card border border-border text-foreground/80 hover:bg-border hover:text-foreground transition px-4 py-2 rounded-xl flex items-center"
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>

          <LoadingLink
            href="/admin/blog/posts/new"
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl transition flex items-center"
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة مقال
          </LoadingLink>

          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
            <Newspaper className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="border-b border-border p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="relative lg:col-span-7">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/60" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بعنوان المقال أو الرابط..."
                className="w-full bg-background/50 border border-border rounded-xl py-2 pr-10 pl-4 text-foreground placeholder-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="lg:col-span-3">
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-background/50 border border-border rounded-xl py-2 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">كل التصنيفات</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full bg-background/50 border border-border rounded-xl py-2 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">كل الحالات</option>
                <option value="published">منشور</option>
                <option value="draft">مسودة</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-border/50 border-b border-border">
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">العنوان</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">الرابط</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">التصنيف</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">الحالة</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">التاريخ</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">إجراءات</th>
                </tr>
              </thead>

              <tbody className="divide-y border-border">
                {visible.map((p) => {
                  const img = getCoverImage(p);
                  const pub = isPublished(p);

                  return (
                    <tr key={p.id} className="hover:bg-border/50 transition">
                      <td className="px-6 py-4 font-bold">
                        <div className="flex items-center gap-3 min-w-0">
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={img}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover border border-border flex-shrink-0"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-border/60 border border-border flex items-center justify-center flex-shrink-0">
                              <ImageIcon className="w-4 h-4 text-foreground/60" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="line-clamp-1">{p.title}</span>
                              {p.slug ? (
                                <a
                                  href={`/blog/${p.slug}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary hover:opacity-90 flex-shrink-0"
                                  title="فتح"
                                >
                                  <ExternalLink size={16} />
                                </a>
                              ) : null}
                            </div>

                            {p.excerpt ? (
                              <p className="text-xs text-foreground/60 line-clamp-1 mt-1">{p.excerpt}</p>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-foreground/80">{p.slug || "—"}</td>
                      <td className="px-6 py-4 text-foreground/70">{p.category?.name || "—"}</td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${
                            pub
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          }`}
                        >
                          {pub ? "منشور" : "مسودة"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-foreground/60 text-sm">
                        {pub ? safeDateLabel(p.published_at) : safeDateLabel(p.created_at)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <LoadingLink
                            href={`/admin/blog/posts/${p.id}/edit`}
                            className="text-primary hover:bg-primary/10 p-2 rounded-lg transition"
                            title="تعديل"
                          >
                            <Edit3 size={16} />
                          </LoadingLink>

                          <button
                            onClick={() => remove(p.id)}
                            className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition"
                            title="حذف"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!loading && visible.length === 0 && (
              <div className="text-center py-12 text-foreground/60">لا توجد مقالات</div>
            )}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-6">
        <Pagination
          className="pagination-bar"
          currentPage={currentPage}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={(p: number) => setCurrentPage(p)}
        />
      </div>
    </div>
  );
}

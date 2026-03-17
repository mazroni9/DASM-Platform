"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import Pagination from "@/components/OldPagination";
import LoadingLink from "@/components/LoadingLink";
import {
  FileText,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  Search,
  ExternalLink,
  Image as ImageIcon,
  Star,
} from "lucide-react";

type MarketCategory = {
  id: number | string;
  name_ar: string;
  name_en?: string | null;
  slug: string;
};

type MarketArticleApi = {
  id: number | string;
  title_ar: string;
  title_en?: string | null;
  slug: string;
  excerpt_ar?: string | null;
  cover_image?: string | null;
  status?: "draft" | "published" | "archived" | string;
  is_featured?: boolean;
  views_count?: number;
  published_at?: string | null;
  created_at?: string | null;
  category?: MarketCategory | null;
};

type ApiIndexResponse<T> =
  | { data: T[]; meta?: { total?: number } }
  | { data: { data: T[]; meta?: { total?: number } }; success?: boolean }
  | { data: T[]; total?: number }
  | { data: { data: T[]; total?: number }; success?: boolean }
  | T[];

function normalizeList<T>(resData: unknown): { list: T[]; total?: number } {
  const root = resData as Record<string, unknown>;
  if (Array.isArray(root)) return { list: root as T[], total: root.length };

  if (root?.success === true && root?.data) {
    const d = root.data as Record<string, unknown>;
    if (Array.isArray(d?.data)) {
      const list = d.data as T[];
      const total =
        typeof d.total === "number"
          ? d.total
          : (d?.meta as { total?: number })?.total ?? list.length;
      return { list, total };
    }
    if (Array.isArray(d)) {
      return { list: d as T[], total: (d as T[]).length };
    }
  }

  if (Array.isArray(root?.data)) {
    const list = (root.data as unknown) as T[];
    const total = typeof root.total === "number" ? root.total : list.length;
    return { list, total };
  }

  const d1 = root?.data as Record<string, unknown> | undefined;
  if (d1 && Array.isArray(d1?.data)) {
    const list = d1.data as T[];
    const total =
      (typeof d1.total === "number" ? d1.total : null) ??
      (d1.meta as { total?: number })?.total ??
      list.length;
    return { list, total };
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

function getCoverImage(p: MarketArticleApi) {
  return (p.cover_image || "").trim() || null;
}

function statusLabel(s: string) {
  const m: Record<string, string> = {
    draft: "مسودة",
    published: "منشور",
    archived: "مؤرشف",
  };
  return m[s] || s;
}

export default function AdminMarketCouncilArticlesPage() {
  const [categories, setCategories] = useState<MarketCategory[]>([]);
  const [items, setItems] = useState<MarketArticleApi[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "draft" | "archived"
  >("all");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);

  const fetchCategories = async () => {
    try {
      const res = await api.get<{ success?: boolean; data?: MarketCategory[] }>(
        "/api/admin/market-council/categories"
      );
      const data = res?.data?.data ?? res?.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    }
  };

  const fetchArticles = async (pageOverride?: number) => {
    const page = pageOverride ?? currentPage;
    try {
      setLoading(true);
      const params: Record<string, unknown> = {
        page,
        per_page: pageSize,
        search: search.trim() || undefined,
        category_id: categoryFilter !== "all" ? Number(categoryFilter) : undefined,
      };
      if (statusFilter !== "all") params.status = statusFilter;

      const res = await api.get<ApiIndexResponse<MarketArticleApi>>(
        "/api/admin/market-council/articles",
        { params }
      );
      const { list, total } = normalizeList<MarketArticleApi>(res?.data);
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
    fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, categoryFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      setCurrentPage(1);
      fetchArticles(1);
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const remove = async (id: number | string) => {
    if (!confirm("متأكد من حذف المقال؟")) return;
    try {
      await api.delete(`/api/admin/market-council/articles/${id}`);
      toast.success("تم الحذف");
      fetchArticles();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "تعذر الحذف");
    }
  };

  const visible = useMemo(() => items, [items]);

  return (
    <div className="min-h-screen bg-background text-foreground p-2 rtl">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">
            مقالات مجلس السوق
          </h1>
          <p className="text-foreground/70 mt-2">إدارة المقالات، التصنيفات والحالة</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => fetchArticles()}
            className="bg-card border border-border text-foreground/80 hover:bg-border hover:text-foreground transition px-4 py-2 rounded-xl flex items-center"
          >
            <RefreshCw
              className={`w-4 h-4 ml-2 ${loading ? "animate-spin" : ""}`}
            />
            تحديث
          </button>

          <LoadingLink
            href="/admin/market-council/articles/new"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl transition flex items-center"
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة مقال
          </LoadingLink>

          <LoadingLink
            href="/market-council"
            target="_blank"
            className="bg-card border border-border hover:bg-border px-4 py-2 rounded-xl transition flex items-center"
          >
            <ExternalLink className="w-4 h-4 ml-2" />
            عرض الموقع
          </LoadingLink>

          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
            <FileText className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="border-b border-border p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="relative lg:col-span-7">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/60" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بعنوان المقال..."
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
                    {c.name_ar}
                  </option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as typeof statusFilter);
                  setCurrentPage(1);
                }}
                className="w-full bg-background/50 border border-border rounded-xl py-2 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">كل الحالات</option>
                <option value="published">منشور</option>
                <option value="draft">مسودة</option>
                <option value="archived">مؤرشف</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-border/50 border-b border-border">
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                    العنوان
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                    الرابط
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                    التصنيف
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                    الحالة
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                    التاريخ
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y border-border">
                {visible.map((p) => {
                  const img = getCoverImage(p);
                  const status = p.status || "draft";

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
                                (
                                  e.currentTarget as HTMLImageElement
                                ).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-border/60 border border-border flex items-center justify-center flex-shrink-0">
                              <ImageIcon className="w-4 h-4 text-foreground/60" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="line-clamp-1">{p.title_ar}</span>
                              {p.is_featured ? (
                                <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                              ) : null}
                            </div>
                            {p.excerpt_ar ? (
                              <p className="text-xs text-foreground/60 line-clamp-1 mt-1">
                                {p.excerpt_ar}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-foreground/80">
                        {p.slug || "—"}
                      </td>
                      <td className="px-6 py-4 text-foreground/70">
                        {p.category?.name_ar || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${
                            status === "published"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : status === "archived"
                                ? "bg-slate-500/10 text-slate-500 border-slate-500/20"
                                : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          }`}
                        >
                          {statusLabel(status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-foreground/60 text-sm">
                        {status === "published"
                          ? safeDateLabel(p.published_at)
                          : safeDateLabel(p.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <LoadingLink
                            href={`/market-council/${p.slug}`}
                            target="_blank"
                            className="text-foreground/60 hover:text-primary p-2 rounded-lg transition"
                            title="عرض"
                          >
                            <ExternalLink size={16} />
                          </LoadingLink>
                          <LoadingLink
                            href={`/admin/market-council/articles/${p.id}/edit`}
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
              <div className="text-center py-12 text-foreground/60">
                لا توجد مقالات
              </div>
            )}
          </div>
        </div>
      </div>

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

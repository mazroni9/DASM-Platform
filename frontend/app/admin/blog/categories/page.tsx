"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import Pagination from "@/components/OldPagination";
import LoadingLink from "@/components/LoadingLink";
import { Tags, Plus, Trash2, Edit3, RefreshCw, Search } from "lucide-react";

type BlogCategory = {
  id: number | string;
  name: string;
  slug: string;
  description?: string | null;
  is_active?: boolean | number | null;
  created_at?: string | null;
};

export default function AdminBlogCategoriesPage() {
  const [items, setItems] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);

  const [errorMsg, setErrorMsg] = useState<string>("");

  const fetchCategories = async () => {
    try {
      setErrorMsg("");
      setLoading(true);

      const res = await api.get("/api/admin/blog/categories", {
        params: {
          page: currentPage,
          pageSize,
          search: search || undefined,
        },
      });

      const data = res?.data?.data ?? res?.data ?? [];
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      const pagination = res?.data?.pagination ?? null;

      setItems(list);
      if (pagination?.total != null) setTotalCount(pagination.total);
      else setTotalCount(list.length);
    } catch {
      setItems([]);
      setTotalCount(0);
      setErrorMsg("فشل في تحميل التصنيفات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    const t = setTimeout(() => {
      setCurrentPage(1);
      fetchCategories();
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const remove = async (id: number | string) => {
    if (!confirm("متأكد من حذف التصنيف؟")) return;
    try {
      setErrorMsg("");
      await api.delete(`/api/admin/blog/categories/${id}`);
      fetchCategories();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || "فشل في الحذف");
    }
  };

  const badgeClass = (active?: boolean | number | null) => {
    const off = active === 0 || active === false;
    return off
      ? "bg-red-500/10 text-red-500 border-red-500/20"
      : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  };

  const empty = useMemo(() => !loading && items.length === 0, [loading, items]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">تصنيفات المدونة</h1>
          <p className="text-foreground/70 mt-2">إدارة التصنيفات بشكل احترافي (إضافة / تعديل / حذف)</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={fetchCategories}
            className="bg-card border border-border text-foreground/80 hover:bg-border hover:text-foreground transition px-4 py-2 rounded-xl flex items-center"
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>

          <LoadingLink
            href="/admin/blog/categories/create"
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl transition flex items-center"
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة تصنيف
          </LoadingLink>

          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
            <Tags className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>

      {/* Error */}
      {errorMsg ? (
        <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500 px-4 py-3">
          {errorMsg}
        </div>
      ) : null}

      {/* Card */}
      <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="border-b border-border p-6">
          <div className="relative max-w-xl">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/60" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو الـSlug..."
              className="w-full bg-background/50 border border-border rounded-xl py-2 pr-10 pl-4 text-foreground placeholder-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-border/50 border-b border-border">
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">الاسم</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">Slug</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">الوصف</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">الحالة</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">إجراءات</th>
                </tr>
              </thead>

              <tbody className="divide-y border-border">
                {items.map((c) => (
                  <tr key={c.id} className="hover:bg-border/50 transition">
                    <td className="px-6 py-4 font-bold">{c.name}</td>
                    <td className="px-6 py-4 text-foreground/80">{c.slug}</td>

                    <td className="px-6 py-4 text-foreground/70">
                      <div className="max-w-[420px] line-clamp-2">{c.description || "—"}</div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${badgeClass(c.is_active)}`}>
                        {c.is_active === 0 ? "غير نشط" : "نشط"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <LoadingLink
                          href={`/admin/blog/categories/${c.id}/edit`}
                          className="text-primary hover:bg-primary/10 p-2 rounded-lg transition"
                          title="تعديل"
                        >
                          <Edit3 size={16} />
                        </LoadingLink>

                        <button
                          onClick={() => remove(c.id)}
                          className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {empty ? <div className="text-center py-12 text-foreground/60">لا توجد تصنيفات</div> : null}
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

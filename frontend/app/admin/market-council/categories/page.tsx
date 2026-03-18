"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import LoadingLink from "@/components/LoadingLink";
import { Tags, Plus, Trash2, Edit3, RefreshCw, Search } from "lucide-react";

type MarketCategory = {
  id: number | string;
  name_ar: string;
  name_en?: string | null;
  slug: string;
  description?: string | null;
  sort_order?: number;
  is_active?: boolean | number;
  articles_count?: number;
};

export default function AdminMarketCouncilCategoriesPage() {
  const [items, setItems] = useState<MarketCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchCategories = async () => {
    try {
      setErrorMsg("");
      setLoading(true);
      const res = await api.get("/api/admin/market-council/categories");
      const data = res?.data?.data ?? res?.data;
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
      setErrorMsg("فشل في تحميل التصنيفات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const remove = async (id: number | string) => {
    if (!confirm("متأكد من حذف التصنيف؟")) return;
    try {
      setErrorMsg("");
      await api.delete(`/api/admin/market-council/categories/${id}`);
      fetchCategories();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e?.response?.data?.message || "فشل في الحذف");
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const s = search.trim().toLowerCase();
    return items.filter((c) => c.name_ar.toLowerCase().includes(s) || (c.slug || "").toLowerCase().includes(s));
  }, [items, search]);

  const badgeClass = (active?: boolean | number) => {
    const off = active === 0 || active === false;
    return off ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-2 rtl">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">تصنيفات مجلس السوق</h1>
          <p className="text-foreground/70 mt-2">إدارة التصنيفات (إضافة / تعديل / حذف)</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={fetchCategories} className="bg-card border border-border text-foreground/80 hover:bg-border transition px-4 py-2 rounded-xl flex items-center">
            <RefreshCw className={`w-4 h-4 ml-2 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>
          <LoadingLink href="/admin/market-council/categories/create" className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl transition flex items-center">
            <Plus className="w-4 h-4 ml-2" />
            إضافة تصنيف
          </LoadingLink>
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
            <Tags className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>

      {errorMsg ? (
        <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500 px-4 py-3">
          {errorMsg}
        </div>
      ) : null}

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
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">الترتيب</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">الوصف</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">الحالة</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y border-border">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-border/50 transition">
                    <td className="px-6 py-4 font-bold">{c.name_ar}</td>
                    <td className="px-6 py-4 text-foreground/80">{c.slug}</td>
                    <td className="px-6 py-4 text-foreground/70">{c.sort_order ?? 0}</td>
                    <td className="px-6 py-4 text-foreground/70 max-w-[280px] line-clamp-2">{c.description || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${badgeClass(c.is_active)}`}>
                        {c.is_active === 0 || c.is_active === false ? "غير نشط" : "نشط"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <LoadingLink href={`/admin/market-council/categories/${c.id}/edit`} className="text-primary hover:bg-primary/10 p-2 rounded-lg transition" title="تعديل">
                          <Edit3 size={16} />
                        </LoadingLink>
                        <button onClick={() => remove(c.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition" title="حذف">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filtered.length === 0 && (
              <div className="text-center py-12 text-foreground/60">لا توجد تصنيفات</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import LoadingLink from "@/components/LoadingLink";
import { usePermission } from "@/hooks/usePermission";
import { FolderOpen, Plus, Edit3, Trash2, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";

type Category = {
  id: number | string;
  name_ar: string;
  name_en?: string | null;
  slug: string;
  description?: string | null;
  sort_order?: number;
  is_active?: boolean | number;
  articles_count?: number;
};

export default function CouncilCategoriesPage() {
  const { can } = usePermission();
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/council-studio/categories");
      const data = res?.data?.data ?? res?.data;
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
      toast.error("فشل في تحميل التصنيفات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (can("council.category.manage")) fetchCategories();
  }, [can]);

  const remove = async (id: number | string) => {
    if (!confirm("متأكد من حذف التصنيف؟")) return;
    try {
      await api.delete(`/api/council-studio/categories/${id}`);
      toast.success("تم الحذف");
      fetchCategories();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "فشل في الحذف");
    }
  };

  if (!can("council.category.manage")) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const badgeClass = (active?: boolean | number) => {
    const off = active === 0 || active === false;
    return off ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  };

  return (
    <div className="space-y-6 rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">إدارة التصنيفات</h1>
          <p className="text-foreground/60 text-sm mt-1">إضافة وتعديل وحذف تصنيفات مجلس السوق</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchCategories}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-border/60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>
          <LoadingLink
            href="/dashboard/council/categories/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold"
          >
            <Plus className="w-4 h-4" />
            إضافة تصنيف
          </LoadingLink>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-border/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 rounded-2xl border border-border bg-card text-center">
          <FolderOpen className="w-12 h-12 mx-auto text-foreground/30 mb-3" />
          <p className="text-foreground/70 font-medium">لا توجد تصنيفات</p>
          <p className="text-foreground/50 text-sm mt-1">
            يمكنك إضافة تصنيف جديد من الزر أعلاه
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-border bg-background/50">
                  <th className="px-4 py-3 text-sm font-bold text-foreground">الاسم</th>
                  <th className="px-4 py-3 text-sm font-bold text-foreground">الرابط</th>
                  <th className="px-4 py-3 text-sm font-bold text-foreground">الترتيب</th>
                  <th className="px-4 py-3 text-sm font-bold text-foreground">المقالات</th>
                  <th className="px-4 py-3 text-sm font-bold text-foreground">الحالة</th>
                  <th className="px-4 py-3 text-sm font-bold text-foreground">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 last:border-0 hover:bg-border/20">
                    <td className="px-4 py-3 font-medium text-foreground">{c.name_ar}</td>
                    <td className="px-4 py-3 text-sm text-foreground/70">{c.slug}</td>
                    <td className="px-4 py-3 text-sm text-foreground/70">{c.sort_order ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-foreground/70">{c.articles_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium border ${badgeClass(c.is_active)}`}>
                        {c.is_active === 0 || c.is_active === false ? "غير نشط" : "نشط"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <LoadingLink
                          href={`/dashboard/council/categories/${c.id}/edit`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-sm"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          تعديل
                        </LoadingLink>
                        <button
                          type="button"
                          onClick={() => remove(c.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 text-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

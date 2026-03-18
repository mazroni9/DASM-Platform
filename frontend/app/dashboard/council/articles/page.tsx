"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import LoadingLink from "@/components/LoadingLink";
import { usePermission } from "@/hooks/usePermission";
import { useSearchParams } from "next/navigation";
import { FileText, Plus, Pencil } from "lucide-react";

type Article = {
  id: number | string;
  title_ar: string;
  slug: string;
  status: string;
  updated_at?: string;
  created_at?: string;
  category?: { name_ar: string; slug: string };
  creator?: { first_name?: string; last_name?: string; email?: string } | null;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "مسودة",
  pending_review: "بانتظار المراجعة",
  rejected: "مرفوض",
  published: "منشور",
};

function formatDate(s?: string | null) {
  if (!s) return "—";
  try {
    const d = new Date(s);
    return d.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function paginatorData(res: { data?: { success?: boolean; data?: { data?: Article[]; current_page?: number; last_page?: number; total?: number } } }) {
  const root = res?.data;
  const d = root?.data;
  if (!d) return { items: [], currentPage: 1, lastPage: 1, total: 0 };
  const items = Array.isArray(d?.data) ? d.data : [];
  return {
    items,
    currentPage: d.current_page ?? 1,
    lastPage: d.last_page ?? 1,
    total: d.total ?? 0,
  };
}

export default function CouncilArticlesPage() {
  const { can } = usePermission();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "";
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let mounted = true;
    const params: Record<string, string | number> = { page: currentPage };
    if (status) params.status = status;
    api
      .get("/api/council-studio/articles", { params })
      .then((res) => {
        if (mounted && res?.data?.success) {
          const { items: list, currentPage: cp, lastPage: lp, total: t } = paginatorData(res.data);
          setItems(list);
          setCurrentPage(cp);
          setLastPage(lp);
          setTotal(t);
        }
      })
      .catch(() => {
        if (mounted) {
          setItems([]);
          setTotal(0);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [status, currentPage]);

  const canCreate = can("council.article.create");
  const canEditAny = can("council.article.edit_any") || can("council.article.review") || can("council.article.publish");
  const canEditOwn = can("council.article.edit_own");
  const canEdit = canEditAny || canEditOwn;

  return (
    <div className="space-y-6 rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">مقالاتي</h1>
          <p className="text-foreground/60 text-sm mt-1">
            {status ? `${STATUS_LABELS[status] || status}` : "جميع المقالات"}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <LoadingLink
              href="/dashboard/council/articles"
              className={`text-sm px-3 py-1 rounded-lg ${!status ? "bg-primary/20 text-primary font-medium" : "bg-border/40 hover:bg-border/60"}`}
            >
              الكل
            </LoadingLink>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <LoadingLink
                key={key}
                href={`/dashboard/council/articles?status=${key}`}
                className={`text-sm px-3 py-1 rounded-lg ${status === key ? "bg-primary/20 text-primary font-medium" : "bg-border/40 hover:bg-border/60"}`}
              >
                {label}
              </LoadingLink>
            ))}
          </div>
        </div>
        {canCreate && (
          <LoadingLink
            href="/dashboard/council/articles/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold"
          >
            <Plus className="w-4 h-4" />
            مقال جديد
          </LoadingLink>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-border/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 rounded-2xl border border-border bg-card text-center">
          <FileText className="w-12 h-12 mx-auto text-foreground/30 mb-3" />
          <p className="text-foreground/70 font-medium">لا توجد مقالات</p>
          <p className="text-foreground/50 text-sm mt-1">
            {canCreate ? "يمكنك إنشاء مقال جديد من الزر أعلاه" : "ليس لديك صلاحية إنشاء مقالات"}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-border bg-background/50">
                    <th className="px-4 py-3 text-sm font-bold text-foreground">العنوان</th>
                    <th className="px-4 py-3 text-sm font-bold text-foreground">التصنيف</th>
                    <th className="px-4 py-3 text-sm font-bold text-foreground">الحالة</th>
                    <th className="px-4 py-3 text-sm font-bold text-foreground">آخر تحديث</th>
                    <th className="px-4 py-3 text-sm font-bold text-foreground">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((a) => (
                    <tr key={a.id} className="border-b border-border/50 last:border-0 hover:bg-border/20">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{a.title_ar || "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground/70">{a.category?.name_ar || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${
                            a.status === "published"
                              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                              : a.status === "pending_review"
                              ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                              : a.status === "rejected"
                              ? "bg-red-500/20 text-red-700 dark:text-red-400"
                              : "bg-foreground/10 text-foreground/70"
                          }`}
                        >
                          {STATUS_LABELS[a.status] || a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground/60">{formatDate(a.updated_at || a.created_at)}</td>
                      <td className="px-4 py-3">
                        {canEdit && (
                          <LoadingLink
                            href={`/dashboard/council/articles/${a.id}/edit`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            تعديل
                          </LoadingLink>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {lastPage > 1 && (
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-4 py-2 rounded-xl border border-border disabled:opacity-50 hover:bg-border/40"
              >
                السابق
              </button>
              <span className="px-4 py-2 text-sm text-foreground/70">
                {currentPage} / {lastPage}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
                disabled={currentPage >= lastPage}
                className="px-4 py-2 rounded-xl border border-border disabled:opacity-50 hover:bg-border/40"
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

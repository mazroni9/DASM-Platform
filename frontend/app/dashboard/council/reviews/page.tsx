"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import LoadingLink from "@/components/LoadingLink";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import { FileText, Send, Pencil, CheckCircle, XCircle } from "lucide-react";

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

function authorName(c?: { first_name?: string; last_name?: string; email?: string } | null) {
  if (!c) return "—";
  const n = [c.first_name, c.last_name].filter(Boolean).join(" ");
  return n || c.email || "—";
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

export default function CouncilReviewsPage() {
  const router = useRouter();
  const { can } = usePermission();
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const canReview = can("council.article.review") || can("council.article.edit_any");
  const canPublish = can("council.article.publish");

  useEffect(() => {
    if (!canReview && !canPublish) {
      router.replace("/dashboard/council");
      return;
    }
  }, [canReview, canPublish, router]);

  useEffect(() => {
    let mounted = true;
    if (!canReview && !canPublish) return;

    api
      .get("/api/council-studio/reviews", { params: { page: currentPage } })
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
  }, [currentPage, canReview, canPublish]);

  if (!canReview && !canPublish) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 rtl">
      <div>
        <h1 className="text-2xl font-bold text-primary">بانتظار المراجعة</h1>
        <p className="text-foreground/60 text-sm mt-1">المقالات المرسلة للمراجعة</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-border/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 rounded-2xl border border-border bg-card text-center">
          <Send className="w-12 h-12 mx-auto text-foreground/30 mb-3" />
          <p className="text-foreground/70 font-medium">لا توجد مقالات بانتظار المراجعة</p>
          <p className="text-foreground/50 text-sm mt-1">سيظهر هنا المقالات عند إرسالها للمراجعة</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-border bg-background/50">
                    <th className="px-4 py-3 text-sm font-bold text-foreground">العنوان</th>
                    <th className="px-4 py-3 text-sm font-bold text-foreground">الكاتب</th>
                    <th className="px-4 py-3 text-sm font-bold text-foreground">التصنيف</th>
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
                      <td className="px-4 py-3 text-sm text-foreground/70">{authorName(a.creator)}</td>
                      <td className="px-4 py-3 text-sm text-foreground/70">{a.category?.name_ar || "—"}</td>
                      <td className="px-4 py-3 text-sm text-foreground/60">{formatDate(a.updated_at || a.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <LoadingLink
                            href={`/dashboard/council/articles/${a.id}/edit`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            تعديل
                          </LoadingLink>
                        </div>
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

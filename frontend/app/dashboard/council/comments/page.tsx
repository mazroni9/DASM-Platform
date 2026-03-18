"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { usePermission } from "@/hooks/usePermission";
import { useSearchParams } from "next/navigation";
import { MessageCircle, CheckCircle, XCircle, EyeOff, Eye } from "lucide-react";
import LoadingLink from "@/components/LoadingLink";
import { toast } from "react-hot-toast";

type Comment = {
  id: number | string;
  content: string;
  status: string;
  updated_at?: string;
  created_at?: string;
  parent_id?: number | string | null;
  user?: { first_name?: string; last_name?: string; email?: string } | null;
  article?: { title_ar: string; slug: string } | null;
  parent?: { id: number | string; content?: string } | null;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "معلق",
  approved: "معتمد",
  rejected: "مرفوض",
  hidden: "مخفي",
};

const TYPE_LABELS: Record<string, string> = {
  comment: "تعليق",
  reply: "رد",
};

function formatDate(s?: string | null) {
  if (!s) return "—";
  try {
    const d = new Date(s);
    return d.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function authorName(u?: { first_name?: string; last_name?: string; email?: string } | null) {
  if (!u) return "—";
  const n = [u.first_name, u.last_name].filter(Boolean).join(" ");
  return n || u.email || "—";
}

function excerpt(text: string, maxLen = 80) {
  if (!text) return "—";
  const t = text.trim();
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen) + "…";
}

function paginatorData(res: { data?: { success?: boolean; data?: { data?: Comment[]; current_page?: number; last_page?: number; total?: number } } }) {
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

export default function CouncilCommentsPage() {
  const { can } = usePermission();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "";
  const type = searchParams.get("type") || "";

  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<number | string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!can("council.comment.review")) return;

    const params: Record<string, string | number> = { page: currentPage };
    if (status) params.status = status;
    if (type) params.type = type;

    api
      .get("/api/council-studio/comments", { params })
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
  }, [status, type, currentPage, can]);

  const runStatusAction = async (id: number | string, newStatus: string) => {
    try {
      setActionLoading(id);
      await api.patch(`/api/council-studio/comments/${id}`, { status: newStatus });
      toast.success("تم تحديث الحالة");
      setItems((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      );
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "تعذر تنفيذ الإجراء");
    } finally {
      setActionLoading(null);
    }
  };

  if (!can("council.comment.review")) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 rtl">
      <div>
        <h1 className="text-2xl font-bold text-primary">مراجعة التعليقات</h1>
        <p className="text-foreground/60 text-sm mt-1">التعليقات والردود</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <LoadingLink
            href="/dashboard/council/comments"
            className={`text-sm px-3 py-1 rounded-lg ${!status && !type ? "bg-primary/20 text-primary font-medium" : "bg-border/40 hover:bg-border/60"}`}
          >
            الكل
          </LoadingLink>
          <LoadingLink
            href="/dashboard/council/comments?type=comment"
            className={`text-sm px-3 py-1 rounded-lg ${type === "comment" ? "bg-primary/20 text-primary font-medium" : "bg-border/40 hover:bg-border/60"}`}
          >
            تعليقات
          </LoadingLink>
          <LoadingLink
            href="/dashboard/council/comments?type=reply"
            className={`text-sm px-3 py-1 rounded-lg ${type === "reply" ? "bg-primary/20 text-primary font-medium" : "bg-border/40 hover:bg-border/60"}`}
          >
            ردود
          </LoadingLink>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <LoadingLink
              key={key}
              href={`/dashboard/council/comments?status=${key}${type ? `&type=${type}` : ""}`}
              className={`text-sm px-3 py-1 rounded-lg ${status === key ? "bg-primary/20 text-primary font-medium" : "bg-border/40 hover:bg-border/60"}`}
            >
              {label}
            </LoadingLink>
          ))}
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
          <MessageCircle className="w-12 h-12 mx-auto text-foreground/30 mb-3" />
          <p className="text-foreground/70 font-medium">لا توجد تعليقات أو ردود</p>
          <p className="text-foreground/50 text-sm mt-1">تطابق الفلتر المحدد</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-border bg-background/50">
                    <th className="px-4 py-3 text-sm font-bold text-foreground">مقتطف النص</th>
                    <th className="px-4 py-3 text-sm font-bold text-foreground">الكاتب</th>
                    <th className="px-4 py-3 text-sm font-bold text-foreground">المقال</th>
                    <th className="px-4 py-3 text-sm font-bold text-foreground">النوع</th>
                    <th className="px-4 py-3 text-sm font-bold text-foreground">الحالة</th>
                    <th className="px-4 py-3 text-sm font-bold text-foreground">آخر تحديث</th>
                    <th className="px-4 py-3 text-sm font-bold text-foreground">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => (
                    <tr key={c.id} className="border-b border-border/50 last:border-0 hover:bg-border/20">
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-sm text-foreground/90 truncate" title={c.content}>
                          {excerpt(c.content)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground/70">{authorName(c.user)}</td>
                      <td className="px-4 py-3 text-sm text-foreground/70 max-w-[150px] truncate">
                        {c.article?.title_ar || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-foreground/60">
                          {c.parent_id ? TYPE_LABELS.reply : TYPE_LABELS.comment}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${
                            c.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                              : c.status === "pending"
                              ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                              : c.status === "rejected"
                              ? "bg-red-500/20 text-red-700 dark:text-red-400"
                              : "bg-foreground/10 text-foreground/70"
                          }`}
                        >
                          {STATUS_LABELS[c.status] || c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground/60">{formatDate(c.updated_at || c.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {c.status === "pending" && (
                            <>
                              <button
                                type="button"
                                onClick={() => runStatusAction(c.id, "approved")}
                                disabled={actionLoading === c.id}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/30 text-xs font-medium disabled:opacity-50"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                اعتماد
                              </button>
                              <button
                                type="button"
                                onClick={() => runStatusAction(c.id, "rejected")}
                                disabled={actionLoading === c.id}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/20 text-red-700 dark:text-red-400 hover:bg-red-500/30 text-xs font-medium disabled:opacity-50"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                رفض
                              </button>
                            </>
                          )}
                          {c.status === "approved" && (
                            <button
                              type="button"
                              onClick={() => runStatusAction(c.id, "hidden")}
                              disabled={actionLoading === c.id}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30 text-xs font-medium disabled:opacity-50"
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                              إخفاء
                            </button>
                          )}
                          {c.status === "hidden" && (
                            <button
                              type="button"
                              onClick={() => runStatusAction(c.id, "approved")}
                              disabled={actionLoading === c.id}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/30 text-xs font-medium disabled:opacity-50"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              إعادة إظهار
                            </button>
                          )}
                          {c.status === "rejected" && (
                            <button
                              type="button"
                              onClick={() => runStatusAction(c.id, "pending")}
                              disabled={actionLoading === c.id}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30 text-xs font-medium disabled:opacity-50"
                            >
                              إعادة للمراجعة
                            </button>
                          )}
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

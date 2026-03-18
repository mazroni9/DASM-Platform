"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import Pagination from "@/components/OldPagination";
import LoadingLink from "@/components/LoadingLink";
import {
  MessageCircle,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  CheckCircle2,
} from "lucide-react";

type MarketComment = {
  id: number | string;
  content: string;
  status: "pending" | "approved" | "hidden";
  created_at?: string | null;
  article?: { id: number | string; title_ar: string; slug: string } | null;
  user?: { id: number | string; first_name?: string; last_name?: string; email?: string } | null;
};

function normalizePaginated<T>(resData: unknown): {
  list: T[];
  total?: number;
  current_page?: number;
  last_page?: number;
} {
  const root = resData as { success?: boolean; data?: unknown };
  if (!root?.data) return { list: [] };
  const d = root.data as { data?: T[]; total?: number; current_page?: number; last_page?: number };
  if (Array.isArray(d?.data)) {
    return {
      list: d.data,
      total: d.total,
      current_page: d.current_page,
      last_page: d.last_page,
    };
  }
  if (Array.isArray(root.data)) {
    const arr = root.data as T[];
    return { list: arr, total: arr.length, current_page: 1, last_page: 1 };
  }
  return { list: [] };
}

function safeDateLabel(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function statusLabel(s: string) {
  const m: Record<string, string> = {
    pending: "قيد المراجعة",
    approved: "موافق",
    hidden: "مخفي",
  };
  return m[s] || s;
}

export default function AdminMarketCouncilCommentsPage() {
  const [items, setItems] = useState<MarketComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "hidden">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;
  const [totalCount, setTotalCount] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  const fetchComments = async (pageOverride?: number) => {
    const page = pageOverride ?? currentPage;
    try {
      setLoading(true);
      const params: Record<string, unknown> = { page, per_page: pageSize };
      if (statusFilter !== "all") params.status = statusFilter;

      const res = await api.get("/api/admin/market-council/comments", { params });
      const { list, total, last_page } = normalizePaginated<MarketComment>(res?.data);
      setItems(list);
      setTotalCount(typeof total === "number" ? total : list.length);
      setLastPage(typeof last_page === "number" ? last_page : 1);
    } catch {
      setItems([]);
      setTotalCount(0);
      toast.error("تعذر تحميل التعليقات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter]);

  const updateStatus = async (id: number | string, newStatus: "approved" | "hidden" | "pending") => {
    try {
      await api.put(`/api/admin/market-council/comments/${id}`, { status: newStatus });
      toast.success("تم تحديث الحالة");
      fetchComments();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "تعذر التحديث");
    }
  };

  const remove = async (id: number | string) => {
    if (!confirm("متأكد من حذف التعليق؟")) return;
    try {
      await api.delete(`/api/admin/market-council/comments/${id}`);
      toast.success("تم الحذف");
      fetchComments();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || "تعذر الحذف");
    }
  };

  const statusBadgeClass = (s: string) => {
    if (s === "approved") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (s === "hidden") return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    return "bg-amber-500/10 text-amber-500 border-amber-500/20";
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-2 rtl">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">
            تعليقات مجلس السوق
          </h1>
          <p className="text-foreground/70 mt-2">
            مراجعة وإدارة التعليقات (موافق / مخفي / قيد المراجعة)
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => fetchComments()}
            className="bg-card border border-border text-foreground/80 hover:bg-border transition px-4 py-2 rounded-xl flex items-center"
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
            <MessageCircle className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="border-b border-border p-6">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-bold text-foreground/70">الحالة:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof statusFilter);
                setCurrentPage(1);
              }}
              className="bg-background/50 border border-border rounded-xl py-2 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">الكل</option>
              <option value="pending">قيد المراجعة</option>
              <option value="approved">موافق</option>
              <option value="hidden">مخفي</option>
            </select>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {items.map((c) => (
              <div
                key={c.id}
                className="border border-border rounded-xl p-4 bg-background/30 hover:bg-background/50 transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground/90 whitespace-pre-wrap">{c.content}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-foreground/60">
                      <span>
                        {c.user?.first_name} {c.user?.last_name}
                        {c.user?.email ? ` (${c.user.email})` : ""}
                      </span>
                      <span>•</span>
                      <span>{safeDateLabel(c.created_at)}</span>
                      {c.article ? (
                        <>
                          <span>•</span>
                          <LoadingLink
                            href={`/market-council/${c.article.slug}`}
                            target="_blank"
                            className="text-primary hover:underline"
                          >
                            {c.article.title_ar}
                          </LoadingLink>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${statusBadgeClass(c.status)}`}>
                      {statusLabel(c.status)}
                    </span>
                    {c.status !== "approved" ? (
                      <button
                        onClick={() => updateStatus(c.id, "approved")}
                        className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition"
                        title="موافق"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    ) : null}
                    {c.status !== "hidden" ? (
                      <button
                        onClick={() => updateStatus(c.id, "hidden")}
                        className="p-2 rounded-lg text-slate-500 hover:bg-slate-500/10 transition"
                        title="إخفاء"
                      >
                        <EyeOff size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={() => updateStatus(c.id, "approved")}
                        className="p-2 rounded-lg text-foreground/60 hover:bg-border transition"
                        title="إظهار"
                      >
                        <Eye size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => remove(c.id)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition"
                      title="حذف"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!loading && items.length === 0 && (
              <div className="text-center py-12 text-foreground/60">
                لا توجد تعليقات
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

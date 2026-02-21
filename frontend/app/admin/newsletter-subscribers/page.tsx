"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Mail,
  Search,
  Filter,
  ChevronDown,
  RefreshCw,
  CheckSquare,
  X,
  Trash2,
  Download,
  Copy,
  Users,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import Pagination from "@/components/OldPagination";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { cn } from "@/lib/utils";

type SubscriberStatus = "subscribed" | "unsubscribed";

interface Subscriber {
  id: number;
  email: string;
  status: SubscriberStatus;
  source?: string | null;
  ip?: string | null;
  user_agent?: string | null;
  notes?: string | null;
  created_at: string;
}

type PaginationShape = {
  current_page?: number;
  total?: number;
  last_page?: number;
  per_page?: number;
};

function safeDate(v: string) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "غير متوفر";
  return d.toLocaleDateString("ar-SA");
}

/**
 * Backend returns:
 * { success:true, data: paginateObject }
 * paginateObject => { data: [...], current_page, total, per_page, last_page ... }
 */
function extractSubscribersResponse(raw: any): {
  list: Subscriber[];
  pagination: PaginationShape | null;
} {
  if (!raw) return { list: [], pagination: null };

  // Most likely shape:
  // response.data => { success, data: { data: [...], total, ... } }
  const pag = raw?.data ?? raw?.data?.data ?? null;

  // axios response.data is already the JSON object
  // so `raw` passed should be response.data
  // raw = { success:true, data:{...paginate...} }
  const paginator = raw?.data && typeof raw.data === "object" ? raw.data : pag;

  if (paginator && Array.isArray(paginator.data)) {
    return {
      list: paginator.data,
      pagination: {
        current_page: paginator.current_page,
        total: paginator.total,
        last_page: paginator.last_page,
        per_page: paginator.per_page,
      },
    };
  }

  // Fallbacks
  if (Array.isArray(raw?.data?.data?.data)) {
    return {
      list: raw.data.data.data,
      pagination: raw.data.data,
    };
  }

  return { list: [], pagination: null };
}

function statusBadge(status: SubscriberStatus) {
  const s = (status || "").toLowerCase();
  if (s === "subscribed") {
    return "bg-green-100 text-green-800 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30";
  }
  return "bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30";
}

function statusText(status: SubscriberStatus) {
  return status === "subscribed" ? "مشترك" : "غير مشترك";
}

const ITEM_HEIGHT = 55;

export default function AdminNewsletterSubscribersPage() {
  const [items, setItems] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [status, setStatus] = useState<"" | SubscriberStatus>("");

  const [perPage, setPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // export
  const [exportMonth, setExportMonth] = useState(() => {
    const now = new Date();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${now.getFullYear()}-${m}`; // YYYY-MM
  });
  const [exportStatus, setExportStatus] = useState<"" | SubscriberStatus>("");

  useEffect(() => {
    // لما الفلاتر تتغير رجّع للصفحة الأولى
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, perPage]);

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, q, status, perPage]);

  const fetchList = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (q) params.append("q", q);
      if (status) params.append("status", status);
      params.append("per_page", String(perPage));
      params.append("page", String(currentPage));

      const res = await api.get(`/api/admin/newsletter-subscribers?${params.toString()}`);
      const { list, pagination } = extractSubscribersResponse(res.data);

      const safeList = Array.isArray(list) ? list : [];
      setItems(safeList);

      const total = pagination?.total ?? 0;
      setTotalCount(typeof total === "number" ? total : 0);

      const cp = pagination?.current_page ?? currentPage;
      if (typeof cp === "number" && cp > 0) setCurrentPage(cp);

      // reset selection if list changes
      setSelected(new Set());
      setSelectAll(false);
      setShowBulkActions(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "فشل في تحميل الإيميلات");
      setItems([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = async () => {
    await fetchList();
    toast.success("تم تحديث البيانات");
  };

  const pageStats = useMemo(() => {
    let subscribed = 0;
    let unsubscribed = 0;
    for (const it of items) {
      if (it.status === "subscribed") subscribed++;
      else unsubscribed++;
    }
    return { subscribed, unsubscribed, shown: items.length };
  }, [items]);

  const handleSelectOne = (id: number, checked: boolean) => {
    const s = new Set(selected);
    if (checked) s.add(id);
    else s.delete(id);
    setSelected(s);
    setSelectAll(s.size === items.length && items.length > 0);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelected(new Set(items.map((x) => x.id)));
    else setSelected(new Set());
    setSelectAll(checked);
  };

  const updateOneStatus = async (id: number, nextStatus: SubscriberStatus) => {
    try {
      await api.put(`/api/admin/newsletter-subscribers/${id}`, { status: nextStatus });
      toast.success("تم تحديث الحالة ✅");
      fetchList();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "فشل تحديث الحالة");
    }
  };

  const deleteOne = async (id: number) => {
    try {
      await api.delete(`/api/admin/newsletter-subscribers/${id}`);
      toast.success("تم الحذف ✅");
      fetchList();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "فشل الحذف");
    }
  };

  const bulkUpdateStatus = async (nextStatus: SubscriberStatus) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return toast.error("اختر عنصر واحد على الأقل");

    try {
      // مفيش endpoint bulk في الباك؛ هنبعت updates بالتوازي
      await Promise.all(ids.map((id) => api.put(`/api/admin/newsletter-subscribers/${id}`, { status: nextStatus })));
      toast.success("تم تحديث الحالات ✅");
      fetchList();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "فشل تحديث الحالات");
    }
  };

  const bulkDelete = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return toast.error("اختر عنصر واحد على الأقل");

    const ok = confirm(`متأكد من حذف ${ids.length} عنصر؟`);
    if (!ok) return;

    try {
      await Promise.all(ids.map((id) => api.delete(`/api/admin/newsletter-subscribers/${id}`)));
      toast.success("تم الحذف ✅");
      fetchList();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "فشل الحذف");
    }
  };

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      toast.success("تم نسخ البريد ✅");
    } catch {
      toast.error("تعذر النسخ");
    }
  };

  const exportCsv = async () => {
    try {
      const params: any = {};
      if (exportMonth) params.month = exportMonth;
      if (exportStatus) params.status = exportStatus;

      const res = await api.get(`/api/admin/newsletter-subscribers/export`, {
        params,
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `newsletter_${(exportMonth || "").replace("-", "_")}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("تم تحميل الملف ✅");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "فشل تصدير CSV");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-2 rtl" dir="rtl" lang="ar">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">إدارة النشرة البريدية</h1>
          <p className="text-foreground/70 mt-2">عرض وإدارة الإيميلات المسجلة في Newsletter</p>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse mt-4 lg:mt-0">
          <button
            onClick={refreshAll}
            disabled={loading}
            className="bg-card border border-border text-foreground/80 hover:bg-border hover:text-foreground transition-all duration-300 px-4 py-2 rounded-xl flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw className={cn("w-4 h-4 ml-2", loading && "animate-spin")} />
            تحديث
          </button>

          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
            <Mail className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>

      {/* Stats (page-based + total) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="إجمالي الإيميلات" value={totalCount} icon={<Users className="w-6 h-6 text-primary" />} box="bg-primary/10" />
        <StatCard title="المعروض الآن" value={pageStats.shown} icon={<Mail className="w-6 h-6 text-cyan-400" />} box="bg-cyan-500/10" />
        <StatCard title="مشترك (في الصفحة)" value={pageStats.subscribed} icon={<CheckSquare className="w-6 h-6 text-green-400" />} box="bg-green-500/10" />
        <StatCard title="غير مشترك (في الصفحة)" value={pageStats.unsubscribed} icon={<X className="w-6 h-6 text-red-400" />} box="bg-red-500/10" />
      </div>

      {/* Main */}
      <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
        {/* Search + Filters */}
        <div className="border-b border-border p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
              <div className="relative flex-grow">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/70 w-5 h-5" />
                <input
                  type="text"
                  placeholder="ابحث بالإيميل..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full bg-background/50 border border-border rounded-xl py-2 pr-10 pl-4 text-foreground placeholder-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-background border border-border text-foreground/80 hover:bg-border hover:text-foreground transition-all duration-300 px-4 py-2 rounded-xl flex items-center"
              >
                <Filter className="w-4 h-4 ml-2" />
                فلاتر
                <ChevronDown className={cn("w-4 h-4 mr-2 transition-transform", showFilters && "rotate-180")} />
              </button>
            </div>

            {selected.size > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-foreground/70">تم اختيار {selected.size} عنصر</span>

                <div className="relative">
                  <button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl transition-all duration-300 flex items-center"
                  >
                    إجراءات جماعية
                    <ChevronDown className={cn("w-4 h-4 mr-2 transition-transform", showBulkActions && "rotate-180")} />
                  </button>

                  {showBulkActions && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-2xl z-10">
                      <div className="p-2 space-y-1">
                        <button
                          onClick={() => bulkUpdateStatus("subscribed")}
                          className="w-full text-right px-4 py-2 hover:bg-border rounded-lg flex items-center gap-2 transition-all duration-300"
                        >
                          <CheckSquare size={16} />
                          تحويل إلى (مشترك)
                        </button>

                        <button
                          onClick={() => bulkUpdateStatus("unsubscribed")}
                          className="w-full text-right px-4 py-2 hover:bg-border rounded-lg flex items-center gap-2 transition-all duration-300"
                        >
                          <X size={16} />
                          تحويل إلى (غير مشترك)
                        </button>

                        <button
                          onClick={bulkDelete}
                          className="w-full text-right px-4 py-2 hover:bg-border rounded-lg flex items-center gap-2 text-red-500 transition-all duration-300"
                        >
                          <Trash2 size={16} />
                          حذف المحدد
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-background/50 rounded-xl mt-4">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="bg-background border border-border rounded-xl py-2 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">كل الحالات</option>
                <option value="subscribed">مشترك</option>
                <option value="unsubscribed">غير مشترك</option>
              </select>

              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="bg-background border border-border rounded-xl py-2 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value={10}>10 / صفحة</option>
                <option value={20}>20 / صفحة</option>
                <option value={50}>50 / صفحة</option>
                <option value={100}>100 / صفحة</option>
              </select>

              <div className="md:col-span-2 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                <div className="flex items-center gap-3 w-full">
                  <input
                    type="month"
                    value={exportMonth}
                    onChange={(e) => setExportMonth(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl py-2 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <select
                    value={exportStatus}
                    onChange={(e) => setExportStatus(e.target.value as any)}
                    className="w-full bg-background border border-border rounded-xl py-2 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">كل الحالات</option>
                    <option value="subscribed">مشترك</option>
                    <option value="unsubscribed">غير مشترك</option>
                  </select>
                </div>

                <button
                  onClick={exportCsv}
                  className="shrink-0 bg-secondary hover:bg-secondary/90 text-white px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  تصدير CSV
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-border/50 border-b border-border">
                  <th className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                    />
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">البريد</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">الحالة</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">المصدر</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">تاريخ الإضافة</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-foreground/70">الإجراءات</th>
                </tr>
              </thead>

              <tbody className="divide-y border-border">
                {items.map((it) => (
                  <tr key={it.id} className="hover:bg-border/50 transition-colors duration-200">
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selected.has(it.id)}
                        onChange={(e) => handleSelectOne(it.id, e.target.checked)}
                        className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                      />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary text-primary-foreground p-2 rounded-xl">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div className="text-sm font-medium text-foreground">{it.email}</div>
                        <button
                          onClick={() => copyEmail(it.email)}
                          className="text-foreground/60 hover:text-foreground hover:bg-border p-2 rounded-lg transition-all duration-300"
                          title="نسخ البريد"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", statusBadge(it.status))}>
                        {statusText(it.status)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-foreground/80">{it.source || "—"}</td>
                    <td className="px-6 py-4 text-sm text-foreground/80">{safeDate(it.created_at)}</td>

                    <td className="px-6 py-4">
                      <SubscriberActionsMenu
                        item={it}
                        onCopy={() => copyEmail(it.email)}
                        onSubscribe={() => updateOneStatus(it.id, "subscribed")}
                        onUnsubscribe={() => updateOneStatus(it.id, "unsubscribed")}
                        onDelete={() => deleteOne(it.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!loading && items.length === 0 && (
              <div className="text-center py-12">
                <Mail className="mx-auto h-12 w-12 text-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground/70">لا توجد بيانات</h3>
                <p className="text-foreground/50 mt-1">لم يتم العثور على إيميلات مطابقة للبحث/الفلاتر.</p>
              </div>
            )}

            {loading && (
              <div className="text-center py-10 text-muted-foreground">
                <div className="inline-flex items-center gap-2 flex-row-reverse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  جاري التحميل...
                </div>
              </div>
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
          pageSize={perPage}
          onPageChange={(p: number) => setCurrentPage(p)}
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  box,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  box: string;
}) {
  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-foreground/70 text-sm">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
        </div>
        <div className={`${box} p-3 rounded-xl`}>{icon}</div>
      </div>
    </div>
  );
}

function SubscriberActionsMenu({
  item,
  onCopy,
  onSubscribe,
  onUnsubscribe,
  onDelete,
}: {
  item: Subscriber;
  onCopy: () => void;
  onSubscribe: () => void;
  onUnsubscribe: () => void;
  onDelete: () => void;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const actionItem = (label: string, Icon: any, fn: () => void, danger = false) => (
    <MenuItem
      onClick={() => {
        handleClose();
        fn();
      }}
      sx={{ direction: "rtl" }}
    >
      <div className={cn("w-full flex items-center justify-between", danger && "text-red-600")}>
        <span className="text-sm">{label}</span>
        <Icon size={16} />
      </div>
    </MenuItem>
  );

  return (
    <div>
      <button
        aria-label="more"
        id={`sub-more-${item.id}`}
        aria-controls={open ? `sub-menu-${item.id}` : undefined}
        aria-expanded={open ? "true" : undefined}
        aria-haspopup="true"
        onClick={handleClick}
        className="text-foreground/70 hover:text-foreground hover:bg-border p-2 rounded-lg transition-all duration-300"
        title="المزيد"
      >
        <span className="inline-block">⋮</span>
      </button>

      <Menu
        id={`sub-menu-${item.id}`}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: { style: { maxHeight: ITEM_HEIGHT * 6.5, width: "25ch" } },
          list: { "aria-labelledby": `sub-more-${item.id}` as any },
        }}
      >
        {actionItem("نسخ البريد", Copy, onCopy)}
        {actionItem("تحويل إلى (مشترك)", CheckSquare, onSubscribe)}
        {actionItem("تحويل إلى (غير مشترك)", X, onUnsubscribe)}
        {actionItem("حذف", Trash2, onDelete, true)}
      </Menu>
    </div>
  );
}

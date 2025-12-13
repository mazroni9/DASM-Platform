"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "../../../components/exhibitor/Header";
import { Sidebar } from "../../../components/exhibitor/sidebar";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  Calendar,
  Plus,
  RefreshCw,
  Search,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  Volume2,
  Users,
  CalendarDays,
  LayoutGrid,
  Timer,
  CheckCircle2,
  Edit3,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface AuctionSession {
  id: number;
  name: string;
  session_date: string;
  end_date?: string;
  duration_minutes?: number;
  status: "scheduled" | "active" | "completed" | "cancelled";
  type: "live" | "instant" | "silent";
  auctions_count?: number;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

const statusColors: Record<AuctionSession["status"], string> = {
  scheduled:
    "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  active:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels: Record<AuctionSession["status"], string> = {
  scheduled: "مجدولة",
  active: "نشطة",
  completed: "مكتملة",
  cancelled: "ملغاة",
};

const typeLabels: Record<AuctionSession["type"], string> = {
  live: "مباشر",
  instant: "فوري",
  silent: "صامت",
};

const typeIcons = {
  live: Volume2,
  instant: Zap,
  silent: Clock,
};

export default function ExhibitorSessionsListPage() {
  const [sessions, setSessions] = useState<AuctionSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | AuctionSession["status"]
  >("all");
  const [typeFilter, setTypeFilter] = useState<"all" | AuctionSession["type"]>(
    "all"
  );

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/exhibitor/sessions");
      const rows: AuctionSession[] = res?.data?.data ?? res?.data ?? [];
      setSessions(Array.isArray(rows) ? rows : []);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "فشل في جلب الجلسات");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return sessions.filter((s) => {
      const bySearch = !q || s.name.toLowerCase().includes(q);
      const byStatus = statusFilter === "all" || s.status === statusFilter;
      const byType = typeFilter === "all" || s.type === typeFilter;
      return bySearch && byStatus && byType;
    });
  }, [sessions, searchTerm, statusFilter, typeFilter]);

  const stats = useMemo(
    () => ({
      total: sessions.length,
      scheduled: sessions.filter((s) => s.status === "scheduled").length,
      active: sessions.filter((s) => s.status === "active").length,
      completed: sessions.filter((s) => s.status === "completed").length,
    }),
    [sessions]
  );

  const remove = async (row: AuctionSession) => {
    if (row.auctions_count && row.auctions_count > 0) {
      return toast.error("لا يمكن حذف جلسة تحتوي على مزادات.");
    }
    const ok = confirm(`تأكيد حذف الجلسة "${row.name}" ؟`);
    if (!ok) return;
    try {
      const res = await api.delete(`/api/exhibitor/sessions/${row.id}`);
      if (res?.status === 200) {
        toast.success(res?.data?.message || "تم حذف الجلسة");
        fetchSessions();
      } else {
        toast.error(res?.data?.message || "تعذر حذف الجلسة");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "فشل حذف الجلسة");
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30"
    >
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-lg shadow-primary/10">
                <CalendarDays className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                  جلسات المزادات
                </h1>
                <p className="text-muted-foreground mt-1 text-sm font-medium">
                  إدارة شاملة لجلسات المزادات العلنية والمجدولة
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchSessions}
                className="bg-secondary border border-border text-foreground hover:bg-secondary/80 transition-all duration-300 px-4 py-2 rounded-xl flex items-center"
              >
                <RefreshCw className="w-4 h-4 ml-2" />
                تحديث
              </button>
              <Link href="/exhibitor/sessions/new">
                <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all active:scale-95">
                  <Plus className="w-5 h-5" />
                  <span>جلسة جديدة</span>
                </button>
              </Link>
            </div>
          </header>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="relative overflow-hidden rounded-2xl p-5 bg-card border border-border shadow-md group hover:shadow-lg transition-all">
              <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    إجمالي الجلسات
                  </p>
                  <h3 className="text-2xl font-black text-foreground">
                    {stats.total}
                  </h3>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                  <LayoutGrid className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl p-5 bg-card border border-border shadow-md group hover:shadow-lg transition-all">
              <div className="absolute top-0 left-0 w-2 h-full bg-amber-500" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    مجدولة
                  </p>
                  <h3 className="text-2xl font-black text-foreground">
                    {stats.scheduled}
                  </h3>
                </div>
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl p-5 bg-card border border-border shadow-md group hover:shadow-lg transition-all">
              <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    نشطة حالياً
                  </p>
                  <h3 className="text-2xl font-black text-foreground">
                    {stats.active}
                  </h3>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <Timer className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl p-5 bg-card border border-border shadow-md group hover:shadow-lg transition-all">
              <div className="absolute top-0 left-0 w-2 h-full bg-purple-500" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    منتهية
                  </p>
                  <h3 className="text-2xl font-black text-foreground">
                    {stats.completed}
                  </h3>
                </div>
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600 dark:text-purple-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-card rounded-xl p-6 border border-border shadow-lg mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="relative flex-grow">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="text"
                  placeholder="ابحث باسم الجلسة..."
                  className="w-full bg-background border border-border rounded-xl py-2 pr-10 pl-4 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="p-2 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent"
                >
                  <option value="all">كل الحالات</option>
                  <option value="scheduled">مجدولة</option>
                  <option value="active">نشطة</option>
                  <option value="completed">مكتملة</option>
                  <option value="cancelled">ملغاة</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="p-2 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/40 focus:border-transparent"
                >
                  <option value="all">كل الأنواع</option>
                  <option value="live">مباشر</option>
                  <option value="instant">فوري</option>
                  <option value="silent">صامت</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold text-right">
                    <th className="px-6 py-5">المعرف</th>
                    <th className="px-6 py-5">عنوان الجلسة</th>
                    <th className="px-6 py-5">تاريخ البدء</th>
                    <th className="px-6 py-5">تاريخ الانتهاء</th>
                    <th className="px-6 py-5">الحالة</th>
                    <th className="px-6 py-5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="h-12 bg-secondary rounded-xl" />
                        </td>
                      </tr>
                    ))
                  ) : filtered.length > 0 ? (
                    filtered.map((session) => (
                      <tr
                        key={session.id}
                        className="group hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-mono text-muted-foreground">
                          #{session.id}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-foreground text-base mb-0.5">
                            {session.name}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {session.duration_minutes ?? 0} دقيقة
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {session.session_date
                            ? format(
                                new Date(session.session_date),
                                "dd MMMM yyyy",
                                { locale: ar }
                              )
                            : "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {session.end_date
                            ? format(
                                new Date(session.end_date),
                                "dd MMMM yyyy",
                                { locale: ar }
                              )
                            : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              statusColors[session.status]
                            }`}
                          >
                            {statusLabels[session.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                            <Link
                              href={`/exhibitor/sessions/view/${session.id}`}
                              className="p-2 mr-3 bg-secondary hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors text-muted-foreground"
                              title="عرض"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            <Link
                              href={`/exhibitor/sessions/edit/${session.id}`}
                              className="p-2 bg-secondary hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors text-muted-foreground"
                              title="تعديل"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => remove(session)}
                              className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 p-2 rounded-lg transition-all disabled:opacity-50"
                              disabled={(session.auctions_count ?? 0) > 0}
                              title={
                                (session.auctions_count ?? 0) > 0
                                  ? "لا يمكن حذف جلسة تحتوي على مزادات"
                                  : "حذف الجلسة"
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <LayoutGrid className="w-16 h-16 mb-4 opacity-20" />
                          <p className="text-lg font-medium">
                            لا توجد جلسات مطابقة
                          </p>
                          <p className="text-sm opacity-60">
                            جرب تغيير معايير البحث أو الفلترة
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

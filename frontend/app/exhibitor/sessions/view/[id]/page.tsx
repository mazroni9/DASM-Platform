"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "../../../../../components/exhibitor/Header";
import { Sidebar } from "../../../../../components/exhibitor/sidebar";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  Loader2,
  Play,
  Square,
  XCircle,
  CheckCircle,
  Calendar,
  Users,
  Clock,
  Zap,
  Eye,
  RefreshCw,
  Car as CarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
}

interface Auction {
  id: number;
  car: Car;
  status: "scheduled" | "live" | "ended" | "completed" | "cancelled" | "failed";
  opening_price?: number;
  approved_for_live?: boolean;
}

interface AuctionSession {
  id: number;
  name: string;
  session_date: string;
  status: "scheduled" | "active" | "completed" | "cancelled";
  type: "live" | "instant" | "silent";
  auctions: Auction[];
}

const statusConfig: Record<
  Auction["status"],
  { label: string; color: string }
> = {
  scheduled: {
    label: "مجدولة",
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
  live: {
    label: "نشطة",
    color:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  },
  ended: {
    label: "منتهية",
    color:
      "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  },
  completed: {
    label: "مكتملة",
    color: "bg-muted text-muted-foreground border-border",
  },
  cancelled: {
    label: "ملغاة",
    color: "bg-destructive/10 text-destructive border-destructive/20",
  },
  failed: {
    label: "فاشلة",
    color:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
};

const sessionStatusConfig = {
  scheduled: {
    label: "مجدولة",
    icon: Clock,
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
  active: {
    label: "نشطة",
    icon: Play,
    color:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  },
  completed: {
    label: "مكتملة",
    icon: CheckCircle,
    color: "bg-muted text-muted-foreground border-border",
  },
  cancelled: {
    label: "ملغاة",
    icon: XCircle,
    color: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

export default function ExhibitorSessionViewPage() {
  const params = useParams();
  const id = params?.id as string;

  const [session, setSession] = useState<AuctionSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionActionLoading, setSessionActionLoading] = useState(false);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/exhibitor/sessions/${id}`);
      const row = res?.data?.data ?? res?.data;
      setSession(row);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "فشل في جلب تفاصيل الجلسة");
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchSession();
  }, [id]);

  const updateStatus = async (status: "active" | "completed" | "cancelled") => {
    if (!session) return;
    setSessionActionLoading(true);
    try {
      await api.post(`/api/exhibitor/sessions/${session.id}/status`, {
        status,
      });
      toast.success("تم تحديث حالة الجلسة");
      await fetchSession();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "فشل تحديث الحالة");
    } finally {
      setSessionActionLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (!session) return { total: 0, live: 0, scheduled: 0, finished: 0 };
    const total = session.auctions.length;
    const live = session.auctions.filter((a) => a.status === "live").length;
    const scheduled = session.auctions.filter(
      (a) => a.status === "scheduled"
    ).length;
    const finished = session.auctions.filter(
      (a) => a.status === "completed" || a.status === "ended"
    ).length;
    return { total, live, scheduled, finished };
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">
            الجلسة غير موجودة.
          </p>
        </div>
      </div>
    );
  }

  const SessionIcon = sessionStatusConfig[session.status].icon;

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {/* Header */}
          <div className="bg-card rounded-2xl border border-border shadow-md p-6 mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    {session.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                        sessionStatusConfig[session.status].color
                      }`}
                    >
                      <SessionIcon className="w-4 h-4 ml-1" />
                      {sessionStatusConfig[session.status].label}
                    </span>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <Clock className="w-4 h-4 ml-1" />
                      {session.session_date
                        ? format(
                            new Date(session.session_date),
                            "eeee, dd MMMM yyyy",
                            { locale: ar }
                          )
                        : "-"}
                    </div>
                    <div className="flex items-center text-primary text-sm">
                      <Users className="w-4 h-4 ml-1" />
                      {session.auctions.length} مزاد
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchSession}
                  className="bg-secondary border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 px-4 py-2 rounded-xl flex items-center"
                >
                  <RefreshCw className="w-4 h-4 ml-2" />
                  تحديث
                </button>

                {session.status === "scheduled" && (
                  <button
                    onClick={() => updateStatus("active")}
                    disabled={sessionActionLoading}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl transition-all duration-300 flex items-center disabled:opacity-50"
                  >
                    {sessionActionLoading ? (
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 ml-2" />
                    )}
                    بدء الجلسة
                  </button>
                )}

                {session.status === "active" && (
                  <button
                    onClick={() => updateStatus("completed")}
                    disabled={sessionActionLoading}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl transition-all duration-300 flex items-center disabled:opacity-50"
                  >
                    {sessionActionLoading ? (
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    ) : (
                      <Square className="w-4 h-4 ml-2" />
                    )}
                    إنهاء الجلسة
                  </button>
                )}

                {session.status !== "completed" &&
                  session.status !== "cancelled" && (
                    <button
                      onClick={() => updateStatus("cancelled")}
                      disabled={sessionActionLoading}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-xl transition-all duration-300 flex items-center disabled:opacity-50"
                    >
                      {sessionActionLoading ? (
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 ml-2" />
                      )}
                      إلغاء الجلسة
                    </button>
                  )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">
                    إجمالي المزادات
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {stats.total}
                  </p>
                </div>
                <div className="bg-blue-500/10 p-3 rounded-xl">
                  <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">نشطة</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {stats.live}
                  </p>
                </div>
                <div className="bg-emerald-500/10 p-3 rounded-xl">
                  <Zap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">مجدولة</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {stats.scheduled}
                  </p>
                </div>
                <div className="bg-amber-500/10 p-3 rounded-xl">
                  <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">مكتملة/منتهية</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                    {stats.finished}
                  </p>
                </div>
                <div className="bg-purple-500/10 p-3 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Auctions Table */}
          <div className="bg-card rounded-2xl border border-border shadow-md overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                مزادات الجلسة ({session.auctions.length})
              </h2>
            </div>

            {session.auctions.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                لا توجد مزادات مضافة إلى هذه الجلسة بعد.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                        السيارة
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                        سعر الافتتاح
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                        الحالة
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {session.auctions.map((a) => (
                      <tr
                        key={a.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="bg-primary/10 p-2 rounded-xl">
                              <CarIcon className="w-4 h-4 text-primary" />
                            </div>
                            <div className="mr-4">
                              <div className="text-sm font-medium text-foreground">
                                {a.car.make} {a.car.model}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {a.car.year} • Auction ID: {a.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-primary font-semibold">
                          {(a.opening_price ?? 0).toLocaleString()} ر.س
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                              statusConfig[a.status]?.color ??
                              "bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            {statusConfig[a.status]?.label ?? a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

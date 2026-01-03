"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Users,
  Car,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Play,
  TrendingUp,
  UserCheck,
  Zap,
  BarChart3,
  Eye,
  ChevronLeft,
  Download,
  RefreshCw,
  Loader2,
  Video,
  Satellite,
  Settings,
  Sparkles,
  TrendingUp as TrendIcon,
  Radio,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GlobalLoader from "@/components/GlobalLoader";

// Dynamic imports for heavy admin components
const AdminAuctionApproval = dynamic(() => import("@/components/admin/AuctionApproval"), {
  loading: () => <GlobalLoader />,
  ssr: false,
});

const AdminCarsPage = dynamic(() => import("./cars/page"), {
  loading: () => <GlobalLoader />,
  ssr: false,
});

// ✅ FIX: استخدم نفس مكوّنات صفحة إدارة البث الشغالة عندك
const BroadcastForm = dynamic(() => import("@/components/BroadCastForm"), {
  loading: () => <GlobalLoader />,
  ssr: false,
});

const UnifiedBroadcastManagement = dynamic(() => import("@/components/UnifiedBroadcastManagement"), {
  loading: () => <GlobalLoader />,
  ssr: false,
});

// ===== Types =====
type UserStatus = "active" | "pending" | "rejected" | string;

interface RecentUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  type?: string;
  status: UserStatus;
  is_active?: boolean;
  created_at?: string;
}

interface DashboardApiData {
  total_users?: number;
  pending_users?: number;

  total_auctions?: number;
  active_auctions?: number;
  completed_auctions?: number;

  pending_verifications?: number;
  pending_auction_approvals?: number;

  recent_users?: RecentUser[];

  active_users?: number;
  dealers_count?: number;
  regular_users_count?: number;
  pending_auctions?: number;
  cached_at?: string;
}

interface DashboardApiResponseV1 {
  success: boolean;
  data: DashboardApiData;
}

interface DashboardApiResponseV2 {
  status: "success" | "error";
  data: DashboardApiData;
  message?: string;
}

interface DashboardStats {
  totalUsers: number;
  pendingUsers: number;
  totalAuctions: number;
  activeAuctions: number;
  completedAuctions: number;
  pendingVerifications: number;
  pendingAuctionApprovals: number;
}

/** ===== Broadcast Stats (زي الصفحة اللي بعتها) ===== */
type Broadcast = {
  id: number;
  title?: string;
  description?: string;
  is_live: boolean;
  scheduled_start_time?: string | null;
  actual_start_time?: string | null;
  end_time?: string | null;
  youtube_embed_url?: string | null;
  youtube_chat_embed_url?: string | null;
  viewers?: number;
};

interface BroadcastStats {
  total: number;
  live: number;
  scheduled: number;
  completed: number;
  viewers: number;
}

function calcBroadcastStats(rows: Broadcast[]): BroadcastStats {
  const now = new Date();
  const total = rows.length;
  const live = rows.filter((b) => b.is_live).length;
  const completed = rows.filter((b) => !!b.end_time).length;
  const scheduled = rows.filter(
    (b) =>
      !b.is_live &&
      !b.end_time &&
      !!b.scheduled_start_time &&
      new Date(b.scheduled_start_time as string).getTime() > now.getTime()
  ).length;

  const viewers = rows.reduce((sum, b) => sum + (typeof b.viewers === "number" ? b.viewers : 0), 0) || 0;
  return { total, live, scheduled, completed, viewers };
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<"dashboard" | "cars" | "broadcast" | "auctions">("dashboard");

  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingUsers: 0,
    totalAuctions: 0,
    activeAuctions: 0,
    completedAuctions: 0,
    pendingVerifications: 0,
    pendingAuctionApprovals: 0,
  });

  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentUsersNotActivated, setNotActivatedUsers] = useState<RecentUser[]>([]);
  const [processingUserId, setProcessingUserId] = useState<number | null>(null);

  // ✅ Broadcast tab stats
  const [broadcastStats, setBroadcastStats] = useState<BroadcastStats>({
    total: 0,
    live: 0,
    scheduled: 0,
    completed: 0,
    viewers: 0,
  });
  const [broadcastStatsLoading, setBroadcastStatsLoading] = useState(false);

  const notActivated = useMemo(() => recentUsers.filter((u) => u.status === "pending"), [recentUsers]);

  useEffect(() => {
    setNotActivatedUsers(notActivated);
  }, [notActivated]);

  const normalizeDashboardResponse = (raw: any): DashboardApiData | null => {
    if (!raw) return null;
    if (raw.success === true && raw.data) return (raw as DashboardApiResponseV1).data;
    if (raw.status === "success" && raw.data) return (raw as DashboardApiResponseV2).data;
    if (raw.data?.success === true && raw.data?.data) return raw.data.data as DashboardApiData;
    if (raw.data?.status === "success" && raw.data?.data) return raw.data.data as DashboardApiData;
    return null;
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/admin/dashboard");
      const data = normalizeDashboardResponse(response.data);

      if (!data) {
        console.error("❌ Unexpected dashboard response shape:", response.data);
        toast.error("صيغة بيانات لوحة التحكم غير متوقعة");
        return;
      }

      setStats({
        totalUsers: data.total_users ?? 0,
        pendingUsers: data.pending_users ?? 0,
        totalAuctions: data.total_auctions ?? 0,
        activeAuctions: data.active_auctions ?? 0,
        completedAuctions: data.completed_auctions ?? 0,
        pendingVerifications: data.pending_verifications ?? 0,
        pendingAuctionApprovals: data.pending_auction_approvals ?? 0,
      });

      setRecentUsers(Array.isArray(data.recent_users) ? data.recent_users : []);
    } catch (error) {
      console.error("❌ Dashboard API error:", error);
      toast.error("فشل في تحميل بيانات لوحة المعلومات");
      setStats({
        totalUsers: 0,
        pendingUsers: 0,
        totalAuctions: 0,
        activeAuctions: 0,
        completedAuctions: 0,
        pendingVerifications: 0,
        pendingAuctionApprovals: 0,
      });
      setRecentUsers([]);
      setNotActivatedUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ broadcast stats (زي الصفحة السابقة)
  const fetchBroadcastStats = useCallback(async () => {
    try {
      setBroadcastStatsLoading(true);
      const res = await api.get("/api/admin/all-broadcasts");
      const data = res.data?.data;

      // يدعم: data.data (pagination) أو data array مباشرة
      const rows: Broadcast[] = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : Array.isArray(res.data)
        ? res.data
        : [];

      setBroadcastStats(calcBroadcastStats(rows));
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "تعذر تحميل إحصائيات البث");
      setBroadcastStats({ total: 0, live: 0, scheduled: 0, completed: 0, viewers: 0 });
    } finally {
      setBroadcastStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ✅ لما تفتح تبويب البث لأول مرة، هات الإحصائيات
  useEffect(() => {
    if (tab === "broadcast") {
      fetchBroadcastStats();
    }
  }, [tab, fetchBroadcastStats]);

  const handleUserActivation = async (userId: number) => {
    setProcessingUserId(userId);
    try {
      const response = await api.post(`/api/admin/users/${userId}/toggle-status`, {
        status: "active",
        is_active: true,
      });

      const ok =
        response.data?.status === "success" ||
        response.data?.success === true ||
        response.data?.data?.status === "success" ||
        response.data?.data?.success === true;

      if (ok) {
        toast.success("تم تفعيل المستخدم بنجاح");
        setRecentUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: true, status: "active" } : u)));
        await fetchDashboardData();
      } else {
        toast.error(response.data?.message || "فشل في تفعيل المستخدم");
      }
    } catch (error: any) {
      console.error("Error activating user:", error);
      toast.error(error?.response?.data?.message || "فشل في تفعيل المستخدم");
    } finally {
      setProcessingUserId(null);
    }
  };

  const refreshData = async () => {
    await fetchDashboardData();
    toast.success("تم تحديث البيانات");
  };

  const tabTriggerClass =
    "relative h-14 rounded-none px-3 " +
    "text-sm md:text-base font-medium " +
    "text-muted-foreground " +
    "hover:text-foreground hover:bg-muted/40 dark:hover:bg-muted/30 " +
    "data-[state=active]:text-foreground " +
    "data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-primary/20 " +
    "data-[state=active]:border-b-2 data-[state=active]:border-primary " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 " +
    "ring-offset-background transition-all";

  const badgeBase =
    "inline-flex items-center flex-row-reverse gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border";

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-background text-foreground p-4 md:p-6 text-right">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="w-full">
          <h1 className="text-2xl md:text-3xl font-bold text-primary">لوحة التحكم الإدارية</h1>

          <div className="mt-2 inline-flex items-center flex-row-reverse gap-2 text-muted-foreground">
            <Clock size={16} />
            <span className="text-sm">
              {new Date().toLocaleDateString("ar-SA", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={refreshData}
            disabled={loading}
            className="inline-flex items-center flex-row-reverse gap-2 bg-card hover:bg-muted/40 dark:hover:bg-muted/30
                       disabled:opacity-60 disabled:cursor-not-allowed text-foreground/90 transition-all duration-300
                       px-4 py-2 rounded-lg border border-border w-full md:w-auto justify-center"
          >
            <RefreshCw size={18} className={`${loading ? "animate-spin" : ""}`} />
            تحديث البيانات
          </button>

          <button
            className="inline-flex items-center flex-row-reverse gap-2 bg-primary hover:bg-primary/90 text-primary-foreground
                       transition-all duration-300 px-4 py-2 rounded-lg w-full md:w-auto justify-center"
            type="button"
          >
            <Download size={18} />
            تصدير تقرير
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
        {/* ✅ Controlled Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full" dir="rtl">
          {/* Tabs Header */}
          <div className="border-b border-border px-3 sm:px-6 bg-card">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1 bg-transparent p-1 md:p-0 h-auto md:h-14">
              <TabsTrigger value="dashboard" className={tabTriggerClass} type="button">
                <div className="inline-flex items-center flex-row-reverse gap-2 justify-center w-full">
                  <BarChart3 size={18} />
                  <span className="truncate">الإحصائيات</span>
                </div>
              </TabsTrigger>

              <TabsTrigger value="cars" className={tabTriggerClass} type="button">
                <div className="inline-flex items-center flex-row-reverse gap-2 justify-center w-full">
                  <Car size={18} />
                  <span className="truncate">إدارة السيارات</span>
                </div>
              </TabsTrigger>

              <TabsTrigger value="broadcast" className={tabTriggerClass} type="button">
                <div className="inline-flex items-center flex-row-reverse gap-2 justify-center w-full">
                  <Play size={18} />
                  <span className="truncate">إدارة البث</span>
                </div>
              </TabsTrigger>

              <TabsTrigger value="auctions" className={tabTriggerClass} type="button">
                <div className="inline-flex items-center flex-row-reverse gap-2 justify-center w-full">
                  <DollarSign size={18} />
                  <span className="truncate">موافقة المزادات</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="m-0 p-4 md:p-6 space-y-8">
            {loading && (
              <div className="w-full">
                <GlobalLoader />
              </div>
            )}

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-background rounded-xl p-5 border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/30 group">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-sm">إجمالي المستخدمين</p>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                    <div className="inline-flex items-center flex-row-reverse gap-2">
                      <TrendingUp size={14} className="text-green-500" />
                      <span className="text-xs text-green-500">—</span>
                    </div>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-xl group-hover:bg-primary/20 transition-all duration-300">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </div>

              <div className="bg-background rounded-xl p-5 border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:border-secondary/30 group">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-sm">المزادات النشطة</p>
                    <p className="text-2xl font-bold">{stats.activeAuctions}</p>
                    <div className="inline-flex items-center flex-row-reverse gap-2">
                      <Zap size={14} className="text-secondary" />
                      <span className="text-xs text-secondary">من أصل {stats.totalAuctions} مزاد</span>
                    </div>
                  </div>
                  <div className="bg-secondary/10 p-3 rounded-xl group-hover:bg-secondary/20 transition-all duration-300">
                    <Car className="w-6 h-6 text-secondary" />
                  </div>
                </div>
              </div>

              <div className="bg-background rounded-xl p-5 border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:border-amber-500/30 group">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-sm">طلبات التحقق</p>
                    <p className="text-2xl font-bold">{stats.pendingVerifications}</p>
                    <div className="inline-flex items-center flex-row-reverse gap-2">
                      <AlertTriangle size={14} className="text-amber-500" />
                      <span className="text-xs text-amber-500">بانتظار المراجعة</span>
                    </div>
                  </div>
                  <div className="bg-amber-500/10 p-3 rounded-xl group-hover:bg-amber-500/20 transition-all duration-300">
                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                  </div>
                </div>
              </div>

              <div className="bg-background rounded-xl p-5 border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:border-purple-500/30 group">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-sm">المستخدمين المعلقين</p>
                    <p className="text-2xl font-bold">{stats.pendingUsers}</p>
                    <div className="inline-flex items-center flex-row-reverse gap-2">
                      <UserCheck size={14} className="text-purple-500" />
                      <span className="text-xs text-purple-500">بحاجة للتفعيل</span>
                    </div>
                  </div>
                  <div className="bg-purple-500/10 p-3 rounded-xl group-hover:bg-purple-500/20 transition-all duration-300">
                    <UserCheck className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Users Table */}
              <div className="bg-background rounded-xl border border-border shadow-lg overflow-hidden">
                <div className="p-5 border-b border-border">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">أحدث المستخدمين المسجلين</h2>
                    <Link
                      href="/admin/users"
                      className="text-primary hover:text-primary/80 text-sm inline-flex items-center flex-row-reverse gap-1 transition-colors duration-300"
                    >
                      <ChevronLeft size={16} />
                      عرض الكل
                    </Link>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border">
                        <th className="py-3 px-4 text-right text-sm font-medium text-muted-foreground">الاسم</th>
                        <th className="py-3 px-4 text-right text-sm font-medium text-muted-foreground">
                          البريد الإلكتروني
                        </th>
                        <th className="py-3 px-4 text-right text-sm font-medium text-muted-foreground">الحالة</th>
                        <th className="py-3 px-4 text-right text-sm font-medium text-muted-foreground">الإجراءات</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-border">
                      {recentUsers.slice(0, 5).map((user) => (
                        <tr key={user.id} className="hover:bg-muted/30 transition-colors duration-200">
                          <td className="py-3 px-4 text-sm">{`${user.first_name} ${user.last_name}`}</td>

                          <td dir="ltr" className="py-3 px-4 text-sm text-muted-foreground text-left">
                            {user.email}
                          </td>

                          <td className="py-3 px-4 text-sm">
                            {user.status === "active" ? (
                              <span className={`${badgeBase} bg-green-500/15 text-green-500 border-green-500/25`}>
                                <CheckCircle className="w-3 h-3" />
                                مفعل
                              </span>
                            ) : user.status === "rejected" ? (
                              <span className={`${badgeBase} bg-red-500/15 text-red-500 border-red-500/25`}>
                                <AlertTriangle className="w-3 h-3" />
                                مرفوض
                              </span>
                            ) : (
                              <span className={`${badgeBase} bg-amber-500/15 text-amber-500 border-amber-500/25`}>
                                <Clock className="w-3 h-3" />
                                في الانتظار
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-sm">
                            <div className="flex items-center justify-start flex-row-reverse gap-2">
                              <Link
                                href={`/admin/users/${user.id}`}
                                className="text-primary hover:text-primary/80 transition-colors duration-200 p-1 rounded"
                                aria-label="عرض المستخدم"
                              >
                                <Eye size={16} />
                              </Link>

                              {(user.status === "pending" || user.status === "rejected") && (
                                <button
                                  type="button"
                                  onClick={() => handleUserActivation(user.id)}
                                  disabled={processingUserId === user.id}
                                  className="text-green-500 hover:text-green-400 transition-colors duration-200 p-1 rounded disabled:opacity-60 disabled:cursor-not-allowed"
                                  aria-label="تفعيل المستخدم"
                                >
                                  {processingUserId === user.id ? (
                                    <Loader2 size={16} className="animate-spin" />
                                  ) : (
                                    <UserCheck size={16} />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}

                      {recentUsers.length === 0 && !loading && (
                        <tr>
                          <td className="py-6 px-4 text-center text-sm text-muted-foreground" colSpan={4}>
                            لا يوجد مستخدمين لعرضهم
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pending Activation Users Table */}
              <div className="bg-background rounded-xl border border-border shadow-lg overflow-hidden">
                <div className="p-5 border-b border-border">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">مستخدمين بإنتظار التفعيل</h2>
                    <Link
                      href="/admin/users"
                      className="text-primary hover:text-primary/80 text-sm inline-flex items-center flex-row-reverse gap-1 transition-colors duration-300"
                    >
                      <ChevronLeft size={16} />
                      عرض الكل
                    </Link>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border">
                        <th className="py-3 px-4 text-right text-sm font-medium text-muted-foreground">الاسم</th>
                        <th className="py-3 px-4 text-right text-sm font-medium text-muted-foreground">
                          البريد الإلكتروني
                        </th>
                        <th className="py-3 px-4 text-right text-sm font-medium text-muted-foreground">الحالة</th>
                        <th className="py-3 px-4 text-right text-sm font-medium text-muted-foreground">الإجراءات</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-border">
                      {recentUsersNotActivated.slice(0, 5).map((user) => (
                        <tr key={user.id} className="hover:bg-muted/30 transition-colors duration-200">
                          <td className="py-3 px-4 text-sm">
                            {user.first_name} {user.last_name}
                          </td>

                          <td dir="ltr" className="py-3 px-4 text-sm text-muted-foreground text-left">
                            {user.email}
                          </td>

                          <td className="py-3 px-4 text-sm">
                            <span className={`${badgeBase} bg-amber-500/15 text-amber-500 border-amber-500/25`}>
                              <Clock className="w-3 h-3" />
                              في الانتظار
                            </span>
                          </td>

                          <td className="py-3 px-4 text-sm">
                            <div className="flex items-center justify-start flex-row-reverse gap-2">
                              <Link
                                href={`/admin/users/${user.id}`}
                                className="text-primary hover:text-primary/80 transition-colors duration-200 p-1 rounded"
                                aria-label="عرض المستخدم"
                              >
                                <Eye size={16} />
                              </Link>

                              <button
                                type="button"
                                onClick={() => handleUserActivation(user.id)}
                                disabled={processingUserId === user.id}
                                className="text-green-500 hover:text-green-400 transition-colors duration-200 p-1 rounded disabled:opacity-60 disabled:cursor-not-allowed"
                                aria-label="تفعيل المستخدم"
                              >
                                {processingUserId === user.id ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <UserCheck size={16} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {recentUsersNotActivated.length === 0 && !loading && (
                        <tr>
                          <td className="py-6 px-4 text-center text-sm text-muted-foreground" colSpan={4}>
                            لا يوجد مستخدمين في الانتظار
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Cars */}
          <TabsContent value="cars" className="m-0 p-4 md:p-6">
            <Suspense fallback={<GlobalLoader />}>
              <AdminCarsPage />
            </Suspense>
          </TabsContent>

          {/* ✅ Broadcast (FIXED) */}
          <TabsContent value="broadcast" className="m-0 p-0">
            <div className="p-4 md:p-6">
              {/* نفس روح الصفحة السابقة + متوافق مع الثيم */}
              <div className="rounded-2xl border border-border overflow-hidden bg-background dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 dark:text-white">
                {/* Header */}
                <div className="p-5 md:p-6 border-b border-border dark:border-gray-700/50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground dark:text-white">
                      إدارة البث المباشر
                    </h2>
                    <p className="text-muted-foreground dark:text-gray-400 mt-1 text-sm">
                      إدارة وتنظيم جلسات البث المباشر والمزادات الحية
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full lg:w-auto">
                    <button
                      type="button"
                      onClick={fetchBroadcastStats}
                      className="w-full lg:w-auto bg-card dark:bg-gray-800 border border-border dark:border-gray-700 text-foreground dark:text-gray-200
                                 hover:bg-muted/40 dark:hover:bg-gray-700 transition px-4 py-2 rounded-xl inline-flex items-center flex-row-reverse gap-2 justify-center"
                      title="تحديث الإحصائيات"
                      disabled={broadcastStatsLoading}
                    >
                      <RefreshCw className={`w-4 h-4 ${broadcastStatsLoading ? "animate-spin" : ""}`} />
                      تحديث
                    </button>

                    <div className="hidden lg:flex bg-gradient-to-r from-purple-500/10 to-pink-600/10 border border-purple-500/20 rounded-xl p-3">
                      <Satellite className="w-6 h-6 text-purple-400" />
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="p-5 md:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <StatCard title="إجمالي البثوث" value={broadcastStats.total} icon={<Video className="w-6 h-6 text-purple-400" />} />
                    <StatCard title="بثوث مباشرة الآن" value={broadcastStats.live} icon={<div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />} />
                    <StatCard title="بثوث مجدولة" value={broadcastStats.scheduled} icon={<Clock className="w-6 h-6 text-amber-400" />} />
                    <StatCard title="بثوث مكتملة" value={broadcastStats.completed} icon={<CheckCircle className="w-6 h-6 text-green-400" />} />
                    <StatCard title="مشاهدين نشطين" value={broadcastStats.viewers} icon={<Eye className="w-6 h-6 text-cyan-400" />} />
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Form */}
                    <div className="xl:col-span-2">
                      <div className="bg-card dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-border dark:border-gray-700/50 shadow-2xl overflow-hidden">
                        <div className="border-b border-border dark:border-gray-700/50 p-6">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-xl">
                              <Settings className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-foreground dark:text-white">إنشاء بث جديد</h3>
                              <p className="text-muted-foreground dark:text-gray-400 text-sm mt-1">
                                إعداد بث مباشر جديد للمزادات أو العروض
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-6">
                          <Suspense fallback={<GlobalLoader />}>
                            <BroadcastForm />
                          </Suspense>
                        </div>
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="space-y-6">
                      <div className="bg-card dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-border dark:border-gray-700/50 p-6 shadow-2xl">
                        <div className="flex items-center space-x-3 space-x-reverse mb-6">
                          <Sparkles className="w-5 h-5 text-purple-400" />
                          <h3 className="text-lg font-semibold text-foreground dark:text-white">إجراءات سريعة</h3>
                        </div>

                        <div className="space-y-3">
                          <button
                            type="button"
                            className="w-full bg-gradient-to-r from-purple-500/10 to-pink-600/10 border border-purple-500/20 text-purple-500 dark:text-purple-300
                                       hover:bg-purple-500/20 hover:text-foreground dark:hover:text-white transition py-3 px-4 rounded-xl text-right
                                       flex items-center justify-between"
                          >
                            <span>البثوث النشطة</span>
                            <Radio className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            className="w-full bg-gradient-to-r from-amber-500/10 to-orange-600/10 border border-amber-500/20 text-amber-500 dark:text-amber-300
                                       hover:bg-amber-500/20 hover:text-foreground dark:hover:text-white transition py-3 px-4 rounded-xl text-right
                                       flex items-center justify-between"
                          >
                            <span>الجداول الزمنية</span>
                            <Clock className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            className="w-full bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 text-cyan-500 dark:text-cyan-300
                                       hover:bg-cyan-500/20 hover:text-foreground dark:hover:text-white transition py-3 px-4 rounded-xl text-right
                                       flex items-center justify-between"
                          >
                            <span>إحصائيات المشاهدين</span>
                            <Users className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="bg-card dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-border dark:border-gray-700/50 p-6 shadow-2xl">
                        <div className="flex items-center space-x-3 space-x-reverse mb-6">
                          <TrendIcon className="w-5 h-5 text-green-400" />
                          <h3 className="text-lg font-semibold text-foreground dark:text-white">حالة النظام</h3>
                        </div>

                        <div className="space-y-4 text-sm">
                          <Row label="خوادم البث" value="نشطة" dot="bg-green-400" />
                          <Row label="جودة البث" value="ممتازة" />
                          <Row label="الإتصال" value="مستقر" />
                          <Row label="المهلة" value="منخفضة" valueClass="text-amber-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Unified management */}
                  <div className="mt-8">
                    <div className="bg-card dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-border dark:border-gray-700/50 shadow-2xl overflow-hidden">
                      <div className="border-b border-border dark:border-gray-700/50 p-6">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-xl">
                            <Video className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-foreground dark:text-white">إدارة البثوث</h3>
                            <p className="text-muted-foreground dark:text-gray-400 text-sm mt-1">
                              عرض وإدارة جميع البثوث المباشرة والمجدولة
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <Suspense fallback={<GlobalLoader />}>
                          <UnifiedBroadcastManagement role="admin" />
                        </Suspense>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Auctions */}
          <TabsContent value="auctions" className="m-0 p-4 md:p-6">
            <Suspense fallback={<GlobalLoader />}>
              <AdminAuctionApproval />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-card dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-border dark:border-gray-700/50 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground dark:text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-foreground dark:text-white mt-1">{value}</p>
        </div>
        <div className="bg-purple-500/10 p-3 rounded-xl">{icon}</div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  dot,
  valueClass,
}: {
  label: string;
  value: string;
  dot?: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground dark:text-gray-400">{label}</span>
      <span className={`flex items-center ${valueClass || "text-green-400"}`}>
        {dot ? <span className={`w-2 h-2 rounded-full ml-2 ${dot}`} /> : null}
        {value}
      </span>
    </div>
  );
}

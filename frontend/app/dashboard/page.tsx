// app/dashboard/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Package,
  Activity,
  Clock,
  Calendar,
  Loader2,
  Sparkles,
  Rocket,
  Settings,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import LoadingLink from "@/components/LoadingLink";

type ProfileResponse = {
  success?: boolean;
  status?: string;
  data?: any;
  message?: string;
};

type ActivityItem = {
  id: number | string;
  title: string;
  date: string;
  type: string;
};

export default function DashboardPage() {
  const { user, isLoggedIn } = useAuth();
  const router = useLoadingRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // نخزن بروفايل من API عشان نقرأ الاسم/created_at حتى لو useAuth مش محمّل كل حاجة
  const [profile, setProfile] = useState<any>(null);

  const [stats, setStats] = useState({
    purchases: 0,
    sales: 0,
    walletBalance: 0,
    activeOrders: 0,
  });

  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const userName = useMemo(() => {
    const src = profile || user;
    if (!src) return "مستخدم";
    const n =
      `${src.first_name || ""} ${src.last_name || ""}`.trim() ||
      src.name ||
      "مستخدم";
    return n;
  }, [profile, user]);

  const memberSinceYear = useMemo(() => {
    const createdAt = (profile?.created_at || user?.created_at) as
      | string
      | undefined;
    if (!createdAt) return "";
    const d = new Date(createdAt);
    return Number.isNaN(d.getTime()) ? "" : String(d.getFullYear());
  }, [profile, user]);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login?returnUrl=/dashboard");
    }
  }, [isLoggedIn, router]);

  const fetchUserData = async () => {
    if (!isLoggedIn) return;

    try {
      const profileResponse =
        await api.get<ProfileResponse>("/api/user/profile");

      const ok =
        profileResponse.data?.success === true ||
        profileResponse.data?.status === "success";

      if (!ok) {
        // فشل/Unauthorized
        throw new Error(
          profileResponse.data?.message || "Failed to load profile",
        );
      }

      const data = profileResponse.data.data || {};

      // ✅ الباك الحالي بيرجع بيانات بروفايل فقط (مش stats)
      setProfile(data);

      // لو في المستقبل ضفتهم في الباك، الكود ده هيلتقطهم تلقائي
      setStats({
        purchases: Number(data.purchases_count ?? 0),
        sales: Number(data.sales_count ?? 0),
        walletBalance: Number(data.wallet_balance ?? 0),
        activeOrders: Number(data.active_orders_count ?? 0),
      });

      setActivities(Array.isArray(data.activities) ? data.activities : []);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      toast.error("تعذر تحميل بيانات لوحة التحكم. يرجى المحاولة لاحقًا.");

      setProfile(null);
      setStats({ purchases: 0, sales: 0, walletBalance: 0, activeOrders: 0 });
      setActivities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUserData();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return <ShoppingCart className="w-3 h-3 text-sky-400" />;
      case "sale":
        return <Package className="w-3 h-3 text-emerald-400" />;
      case "deposit":
      case "withdrawal":
        return <DollarSign className="w-3 h-3 text-amber-400" />;
      default:
        return <Activity className="w-3 h-3 text-gray-400" />;
    }
  };

  const getActivityBgColor = (type: string) => {
    switch (type) {
      case "purchase":
        return "bg-primary/10";
      case "sale":
        return "bg-secondary/10";
      case "deposit":
      case "withdrawal":
        return "bg-amber-500/10";
      default:
        return "bg-border";
    }
  };

  const statItems = [
    {
      label: "المشتريات",
      value: stats.purchases,
      bg: "bg-primary/10",
      border: "border-primary/20",
      glow: "shadow-primary/20",
      text: "text-primary",
      icon: ShoppingCart,
      trend: "+12%",
    },
    {
      label: "المبيعات",
      value: stats.sales,
      bg: "bg-secondary/10",
      border: "border-secondary/20",
      glow: "shadow-secondary/20",
      text: "text-secondary",
      icon: TrendingUp,
      trend: "+8%",
    },
    {
      label: "رصيد المحفظة",
      value: stats.walletBalance
        ? `${stats.walletBalance.toLocaleString()}`
        : "0",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      glow: "shadow-amber-500/20",
      text: "text-amber-500",
      icon: DollarSign,
      trend: "+5%",
    },
    {
      label: "الطلبات النشطة",
      value: stats.activeOrders,
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      glow: "shadow-purple-500/20",
      text: "text-purple-500",
      icon: Package,
      trend: "+3%",
    },
  ];

  // بيانات افتراضية للنشاطات إذا لم توجد بيانات
  const defaultActivities: ActivityItem[] = [
    { id: 1, title: "مرحباً بك في منصة داسم", date: "الآن", type: "welcome" },
    { id: 2, title: "ابدأ بإضافة سياراتك الأولى", date: "اليوم", type: "info" },
    { id: 3, title: "استكشف المزادات المتاحة", date: "اليوم", type: "info" },
  ];

  const displayActivities =
    activities.length > 0 ? activities : defaultActivities;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card backdrop-blur-2xl border border-border rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-primary text-primary-foreground rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                مرحباً بك، <span className="text-primary">{userName}</span>
              </h1>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2 py-1 bg-secondary/20 text-secondary rounded-lg text-xs border border-secondary/30">
                {(profile?.type || user?.type) === "user" ||
                (profile?.type || user?.type) === "dealer"
                  ? "الاشتراك: مجاني"
                  : ""}
              </span>
              <span className="px-2 py-1 bg-primary/20 text-primary rounded-lg text-xs border border-primary/30">
                عضو منذ {memberSinceYear}
              </span>
            </div>

            <p className="text-foreground/80 text-sm leading-relaxed">
              أنت على بعد نقرة من إدارة حسابك بكل سهولة وأمان. استعرض بياناتك
              وتابع نشاطك.
            </p>
          </div>

          <div className="flex gap-2">
            <LoadingLink href="/dashboard/profile">
              <button className="p-2 bg-border rounded-xl border border-border hover:bg-border/80 transition-all duration-300 hover:scale-105">
                <Settings className="w-4 h-4 text-purple-400" />
              </button>
            </LoadingLink>

            <LoadingLink
              href="/auctions"
              className="p-2 bg-primary rounded-xl border border-primary/30 hover:scale-105 transition-all duration-300 flex items-center justify-center"
            >
              <Rocket className="w-4 h-4 text-primary-foreground" />
            </LoadingLink>
          </div>
        </div>
      </motion.div>

      {/* Stats & Activities */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative w-16 h-16">
            <Loader2 className="absolute inset-0 w-full h-full animate-spin text-primary" />
            <div className="absolute inset-0 w-full h-full rounded-full border-4 border-transparent border-t-primary animate-spin opacity-60"></div>
          </div>
          <p className="mt-4 text-lg text-foreground/70 font-medium">
            جاري تحميل لوحة التحكم...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Stats Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <div className="p-1.5 bg-primary text-primary-foreground rounded-lg">
                  <Activity className="w-4 h-4" />
                </div>
                إحصائيات سريعة
              </h2>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1 px-3 py-1.5 bg-card border border-border rounded-lg hover:bg-border transition-all duration-300 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`}
                />
                <span className="text-xs">تحديث</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {statItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={cn(
                      "p-4 rounded-xl border backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl",
                      item.bg,
                      item.border,
                      item.glow,
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-lg bg-white/10">
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-300 rounded border border-green-500/30">
                        {item.trend}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/80 mb-1">
                      {item.label}
                    </p>
                    <p className={cn("text-lg font-bold", item.text)}>
                      {item.value}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <div className="p-1.5 bg-primary text-primary-foreground rounded-lg">
                  <Clock className="w-4 h-4" />
                </div>
                آخر النشاطات
              </h2>
              <button className="text-xs text-foreground/70 hover:text-foreground transition-colors">
                عرض الكل
              </button>
            </div>

            <div className="bg-card backdrop-blur-xl border border-border rounded-xl p-4">
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {displayActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-border transition-all duration-300 border border-border/70 hover:border-border group"
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg transition-transform duration-300 group-hover:scale-110",
                        getActivityBgColor(activity.type),
                      )}
                    >
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-foreground/80 transition-colors leading-tight">
                        {activity.title}
                      </p>
                      <p className="text-xs text-foreground/50 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {activity.date}
                      </p>
                    </div>
                    <div className="w-1.5 h-1.5 bg-border rounded-full group-hover:bg-current transition-colors duration-300"></div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

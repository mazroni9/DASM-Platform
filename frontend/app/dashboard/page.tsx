// app/dashboard/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import api from "@/lib/axios";
import {
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Package,
  Activity,
  Loader2,
  Sparkles,
  Rocket,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import LoadingLink from "@/components/LoadingLink";

type StatsResponse = {
  purchases_count: number;
  sales_count: number;
  wallet_balance: number;
  active_orders_count: number;
  purchases_trend: number;
  sales_trend: number;
  wallet_trend: number;
  active_orders_trend: number;
};

function formatTrend(t: number): string {
  if (t > 0) return `+${t}%`;
  if (t < 0) return `${t}%`;
  return "0%";
}

export default function DashboardPage() {
  const { user, isLoggedIn } = useAuth();
  const router = useLoadingRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [profile, setProfile] = useState<any>(null);

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
    const createdAt = (profile?.created_at || user?.created_at) as string | undefined;
    if (!createdAt) return "";
    const d = new Date(createdAt);
    return Number.isNaN(d.getTime()) ? "" : String(d.getFullYear());
  }, [profile, user]);

  useEffect(() => {
    if (!isLoggedIn) router.push("/auth/login?returnUrl=/dashboard");
  }, [isLoggedIn, router]);

  const fetchData = async () => {
    if (!isLoggedIn) return;
    setError(null);
    try {
      setRefreshing(true);
      const [statsRes, profileRes] = await Promise.all([
        api.get("/api/dashboard/stats"),
        api.get("/api/user/profile"),
      ]);

      const ok = statsRes.data?.status === "success";
      if (!ok) throw new Error(statsRes.data?.message || "فشل تحميل الإحصائيات");
      setStats(statsRes.data.data);

      const profOk = profileRes.data?.success === true || profileRes.data?.status === "success";
      if (profOk && profileRes.data?.data) setProfile(profileRes.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "تعذر تحميل بيانات لوحة التحكم");
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isLoggedIn]);

  const statItems = useMemo(
    () =>
      stats
        ? [
            {
              label: "المشتريات",
              value: stats.purchases_count,
              trend: formatTrend(stats.purchases_trend),
              bg: "bg-primary/10",
              border: "border-primary/20",
              text: "text-primary",
              icon: ShoppingCart,
            },
            {
              label: "المبيعات",
              value: stats.sales_count,
              trend: formatTrend(stats.sales_trend),
              bg: "bg-secondary/10",
              border: "border-secondary/20",
              text: "text-secondary",
              icon: TrendingUp,
            },
            {
              label: "رصيد المحفظة",
              value: stats.wallet_balance ? `${stats.wallet_balance.toLocaleString("ar-SA")}` : "0",
              trend: formatTrend(stats.wallet_trend),
              bg: "bg-amber-500/10",
              border: "border-amber-500/20",
              text: "text-amber-500",
              icon: DollarSign,
            },
            {
              label: "الطلبات النشطة",
              value: stats.active_orders_count,
              trend: formatTrend(stats.active_orders_trend),
              bg: "bg-purple-500/10",
              border: "border-purple-500/20",
              text: "text-purple-500",
              icon: Package,
            },
          ]
        : [],
    [stats]
  );

  return (
    <div className="space-y-6" dir="rtl">
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
                {(profile?.type || user?.type) === "user" || (profile?.type || user?.type) === "dealer"
                  ? "الاشتراك: مجاني"
                  : ""}
              </span>
              <span className="px-2 py-1 bg-primary/20 text-primary rounded-lg text-xs border border-primary/30">
                عضو منذ {memberSinceYear}
              </span>
            </div>
            <p className="text-foreground/80 text-sm leading-relaxed">
              أنت على بعد نقرة من إدارة حسابك بكل سهولة وأمان. استعرض بياناتك وتابع نشاطك.
            </p>
          </div>
          <LoadingLink
            href="/auctions"
            className="p-2 bg-primary rounded-xl border border-primary/30 hover:scale-105 transition-all duration-300 flex items-center justify-center"
          >
            <Rocket className="w-4 h-4 text-primary-foreground" />
          </LoadingLink>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="mt-4 text-foreground/70">جاري تحميل لوحة التحكم...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl border border-destructive/30 bg-destructive/10 text-center">
          <p className="text-destructive font-medium mb-4">{error}</p>
          <button
            onClick={() => fetchData()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <div className="p-1.5 bg-primary text-primary-foreground rounded-lg">
                <Activity className="w-4 h-4" />
              </div>
              إحصائيات سريعة
            </h2>
            <button
              onClick={() => fetchData()}
              disabled={refreshing}
              className="flex items-center gap-1 px-3 py-1.5 bg-card border border-border rounded-lg hover:bg-border transition-all disabled:opacity-50"
            >
              <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
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
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "p-4 rounded-xl border-2 bg-card/80 backdrop-blur-sm",
                    item.bg,
                    item.border,
                  )}
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className={cn("p-2 rounded-lg bg-black/10 dark:bg-white/15", item.text)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={cn(
                        "text-sm font-semibold px-2 py-1 rounded-md border",
                        parseFloat(item.trend) >= 0
                          ? "bg-green-500/25 text-green-700 dark:text-green-300 border-green-500/40"
                          : "bg-red-500/25 text-red-700 dark:text-red-300 border-red-500/40",
                      )}
                    >
                      {item.trend}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 mb-1">{item.label}</p>
                  <p className={cn("text-lg font-bold", item.text)}>{item.value}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

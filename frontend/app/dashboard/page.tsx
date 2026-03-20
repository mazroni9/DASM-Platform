// app/dashboard/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import api from "@/lib/axios";
import {
  Activity,
  Loader2,
  Sparkles,
  Rocket,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import LoadingLink from "@/components/LoadingLink";
import AIPricingWidget from "@/components/AIPricingWidget";

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
            },
            {
              label: "المبيعات",
              value: stats.sales_count,
              trend: formatTrend(stats.sales_trend),
            },
            {
              label: "رصيد المحفظة",
              value: stats.wallet_balance ? `${stats.wallet_balance.toLocaleString("ar-SA")}` : "0",
              trend: formatTrend(stats.wallet_trend),
            },
            {
              label: "الطلبات النشطة",
              value: stats.active_orders_count,
              trend: formatTrend(stats.active_orders_trend),
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
        className="bg-card border border-border rounded-2xl shadow-sm p-3 md:p-5 lg:p-5"
      >
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 md:gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 md:gap-2.5 mb-1 md:mb-1.5">
              <div className="p-1 md:p-1.5 bg-primary/10 text-primary rounded-lg shrink-0">
                <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </div>
              <h1 className="text-base md:text-xl font-bold text-foreground truncate">
                مرحباً بك، <span className="text-primary">{userName}</span>
              </h1>
            </div>
            <div className="flex flex-wrap gap-1 md:gap-1.5">
              {(profile?.type || user?.type) === "user" || (profile?.type || user?.type) === "dealer" ? (
                <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-muted/60 text-muted-foreground border border-border">
                  الاشتراك: مجاني
                </span>
              ) : null}
              {memberSinceYear ? (
                <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-muted/60 text-muted-foreground border border-border">
                  عضو منذ {memberSinceYear}
                </span>
              ) : null}
            </div>
          </div>
          <LoadingLink
            href="/auctions"
            className="shrink-0 p-2 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors flex items-center justify-center"
          >
            <Rocket className="w-4 h-4 text-primary" />
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
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <div className="p-1 bg-primary/10 text-primary rounded-md">
                <Activity className="w-3.5 h-3.5" />
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
            {statItems.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 rounded-xl border border-border bg-card shadow-sm border-l-2 border-l-primary/30"
              >
                <div className="flex justify-end items-center mb-1.5">
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded border",
                      parseFloat(item.trend) >= 0
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400/90 border-emerald-500/25"
                        : "bg-red-500/15 text-red-700 dark:text-red-400/90 border-red-500/25",
                    )}
                  >
                    {item.trend}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
                <p className="text-lg font-bold text-foreground">{item.value}</p>
              </motion.div>
            ))}
          </div>

          <AIPricingWidget mode="manual" />
        </div>
      )}
    </div>
  );
}

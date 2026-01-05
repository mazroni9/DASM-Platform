"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import {
  FiRefreshCw,
  FiPlusCircle,
  FiBarChart2,
  FiSettings,
  FiExternalLink,
  FiTruck,
  FiStar,
  FiDollarSign,
  FiAlertTriangle,
} from "react-icons/fi";
import { BsCarFront } from "react-icons/bs";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { DynamicComponents } from "@/lib/dynamic-imports";
import GlobalLoader from "@/components/GlobalLoader";
import api from "@/lib/axios";

// recharts (فقط اللي نحتاجه)
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// Dynamic imports
const Header = DynamicComponents.ExhibitorHeader;
const Sidebar = DynamicComponents.ExhibitorSidebar;

// ===== Helpers =====
const nf = new Intl.NumberFormat("ar-EG");
const money = (v: number, c = "SAR") =>
  new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: c,
    maximumFractionDigits: 2,
  }).format(v);

const dshort = (s: string) =>
  new Date(s).toLocaleDateString("ar-EG", { month: "short", day: "numeric" });

const dtShort = (s: string) =>
  new Date(s).toLocaleString("ar-EG", { month: "short", day: "numeric" });

function todayISODate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function Skel({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-muted/40 ${className}`} />;
}

function Kpi({
  icon,
  title,
  value,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  sub?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card border border-border p-4 shadow-lg"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-secondary">{icon}</div>
        <div className="flex-1">
          <div className="text-muted-foreground text-xs">{title}</div>
          <div className="text-foreground font-extrabold text-xl">{value}</div>
          {sub && <div className="text-muted-foreground text-xs mt-0.5">{sub}</div>}
        </div>
      </div>
    </motion.div>
  );
}

// ===== Safe fetch utils (لا تسقط الصفحة لو API فشل) =====
type FetchState<T> = { data: T | null; error: string | null };

async function safeGet<T = any>(url: string, params?: any): Promise<FetchState<T>> {
  try {
    const res = await api.get(url, { params });
    return { data: (res as any).data, error: null };
  } catch (e: any) {
    const msg =
      e?.response?.data?.message ||
      e?.response?.data?.first_error ||
      e?.message ||
      "خطأ غير متوقع";
    return { data: null, error: msg };
  }
}

function pickArray(payload: any): any[] {
  if (!payload) return [];
  // Laravel paginator: { data: [...] }
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  // wrappers: { success: true, data: { data: [...] } }
  if (payload?.data && Array.isArray(payload.data?.data)) return payload.data.data;
  return [];
}

function pickDataObject<T = any>(payload: any, fallback: T | null = null): T | null {
  if (!payload) return fallback;
  // common: { success: true, data: {...} }
  if (payload?.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    return payload.data as T;
  }
  // raw object
  if (typeof payload === "object" && !Array.isArray(payload)) return payload as T;
  return fallback;
}

// ===== Normalizers (حسب الكنترولرز اللي عندك) =====
type AnalyticsOverviewPayload = {
  success?: boolean;
  data?: {
    kpis?: {
      total_cars?: number;
      active_auctions?: number;
      finished_auctions?: number;
      avg_final_price?: number;
      bids_count?: number;
      commission_sum?: number;
      ratings_avg?: number | null;
      ratings_count?: number;
      shipments_count?: number;
    };
    lists?: { recent_cars?: any[] };
  };
};

function normalizeAnalyticsOverview(p: any) {
  const obj = pickDataObject<AnalyticsOverviewPayload["data"]>(p, null);
  const kpis = obj?.kpis ?? {};
  const recentCars = obj?.lists?.recent_cars ?? [];
  return { kpis, recentCars };
}

type RatingsSummaryPayload = {
  success?: boolean;
  data?: {
    platform?: number;
    customer?: number;
    overall?: number;
    counts?: Record<string, number>;
  };
};

function normalizeRatingsSummary(p: any) {
  const obj = pickDataObject<RatingsSummaryPayload["data"]>(p, null);
  const counts = obj?.counts ?? {};
  const total = Object.values(counts).reduce((a, b) => a + Number(b || 0), 0);
  return {
    platform: obj?.platform ?? null,
    customer: obj?.customer ?? null,
    overall: obj?.overall ?? null,
    counts,
    totalCount: total,
  };
}

type CommissionSummaryPayload = {
  success?: boolean;
  data?: {
    commissionValue?: number;
    commissionCurrency?: string;
    commissionNote?: string | null;
    recentCommissions?: Array<{ id: number; date?: string; car?: string; value?: number }>;
  };
};

function normalizeCommissionSummary(p: any) {
  const obj = pickDataObject<CommissionSummaryPayload["data"]>(p, null);
  return {
    commissionValue: obj?.commissionValue ?? null,
    commissionCurrency: obj?.commissionCurrency ?? "SAR",
    commissionNote: obj?.commissionNote ?? null,
    recentCommissions: obj?.recentCommissions ?? [],
  };
}

function normalizeWallet(p: any) {
  const obj = pickDataObject<any>(p, null);
  if (!obj) return null;

  // WalletController: balance + balance_sar + currency
  const currency = obj?.currency ?? "SAR";

  // لو balance_sar موجود يبقى الرصيد الأساسي غالبًا "هللات"
  const balanceSar =
    obj?.balance_sar != null
      ? Number(obj.balance_sar)
      : obj?.balance != null
      ? Number(obj.balance)
      : 0;

  const rawBalance = obj?.balance != null ? Number(obj.balance) : null;
  const usesCents = obj?.balance_sar != null && rawBalance != null;

  return { ...obj, currency, balance_sar: balanceSar, _usesCents: usesCents };
}

function shipmentStatusKey(sh: any): string {
  // ShipmentController يستخدم shipping_status كـ int (0..3)
  const v = sh?.shipping_status ?? sh?.status;
  if (typeof v === "number") {
    return ["pending", "in_transit", "out_for_delivery", "delivered"][v] ?? String(v);
  }
  if (typeof v === "string" && v.trim() !== "") return v;
  return "unknown";
}

function toSarAmount(v: any, usesCents: boolean): number {
  const n = Number(v ?? 0) || 0;
  return usesCents ? n / 100 : n;
}

// ===== Page =====
export default function ExhibitorDashboard() {
  const router = useLoadingRouter();

  const [isClient, setIsClient] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [sectionErrors, setSectionErrors] = useState<Record<string, string>>({});

  // data
  const [profile, setProfile] = useState<any>(null);

  const [wallet, setWallet] = useState<any>(null);
  const [txs, setTxs] = useState<any[]>([]);

  const [overviewKpis, setOverviewKpis] = useState<any>(null);
  const [recentCars, setRecentCars] = useState<any[]>([]);

  const [sessions, setSessions] = useState<any[]>([]);
  const [ratingsSummary, setRatingsSummary] = useState<any>(null);
  const [commissionSummary, setCommissionSummary] = useState<any>(null);

  const [shipments, setShipments] = useState<any[]>([]);
  const [serviceReqs, setServiceReqs] = useState<any[]>([]);

  useEffect(() => setIsClient(true), []);
  useEffect(() => {
    try {
      /* @ts-ignore */ router?.prefetch?.("/exhibitor");
    } catch {}
  }, [router]);

  const fetchAll = async () => {
    setSectionErrors({});
    const errs: Record<string, string> = {};
    const _setErr = (k: string, v: string | null) => {
      if (v) errs[k] = v;
    };

    const run = async () => {
      const results = await Promise.allSettled([
        safeGet("/api/user/profile"),
        safeGet<AnalyticsOverviewPayload>("/api/exhibitor/analytics/overview"),
        safeGet("/api/exhibitor/wallet"),
        safeGet("/api/exhibitor/sessions", { date_from: todayISODate() }),
        safeGet<RatingsSummaryPayload>("/api/exhibitor/ratings/summary"),
        safeGet<CommissionSummaryPayload>("/api/exhibitor/commission/summary"),
        safeGet("/api/exhibitor/shipments", { per_page: 50 }),
        safeGet("/api/exhibitor/extra-services/requests", { per_page: 20 }),
        (async () => {
          const a = await safeGet("/api/exhibitor/wallet/transactions");
          if (!a.error) return a;
          const b = await safeGet("/api/exhibitor/wallet/transcations");
          return b.error ? { data: null, error: a.error } : b;
        })(),
      ]);

      // profile
      {
        const r =
          results[0].status === "fulfilled"
            ? results[0].value
            : { data: null, error: "تعذر تحميل الملف الشخصي" };
        _setErr("profile", (r as any).error);
        setProfile(pickDataObject((r as any).data, null));
      }

      // analytics overview
      {
        const r =
          results[1].status === "fulfilled"
            ? results[1].value
            : { data: null, error: "تعذر تحميل لوحة المؤشرات" };
        _setErr("analytics_overview", (r as any).error);

        const { kpis, recentCars } = normalizeAnalyticsOverview((r as any).data);
        setOverviewKpis(kpis);
        setRecentCars(Array.isArray(recentCars) ? recentCars : []);
      }

      // wallet
      {
        const r =
          results[2].status === "fulfilled"
            ? results[2].value
            : { data: null, error: "تعذر تحميل المحفظة" };
        _setErr("wallet", (r as any).error);
        setWallet(normalizeWallet((r as any).data));
      }

      // sessions
      {
        const r =
          results[3].status === "fulfilled"
            ? results[3].value
            : { data: null, error: "تعذر تحميل الجلسات" };
        _setErr("sessions", (r as any).error);
        setSessions(pickArray((r as any).data));
      }

      // ratings summary
      {
        const r =
          results[4].status === "fulfilled"
            ? results[4].value
            : { data: null, error: "تعذر تحميل التقييم" };
        _setErr("ratings", (r as any).error);
        setRatingsSummary(normalizeRatingsSummary((r as any).data));
      }

      // commission summary
      {
        const r =
          results[5].status === "fulfilled"
            ? results[5].value
            : { data: null, error: "تعذر تحميل العمولات" };
        _setErr("commission", (r as any).error);
        setCommissionSummary(normalizeCommissionSummary((r as any).data));
      }

      // shipments
      {
        const r =
          results[6].status === "fulfilled"
            ? results[6].value
            : { data: null, error: "تعذر تحميل الشحنات" };
        _setErr("shipments", (r as any).error);
        setShipments(pickArray((r as any).data));
      }

      // extra service requests
      {
        const r =
          results[7].status === "fulfilled"
            ? results[7].value
            : { data: null, error: "تعذر تحميل طلبات الخدمات" };
        _setErr("extra_services", (r as any).error);
        setServiceReqs(pickArray((r as any).data));
      }

      // transactions
      {
        const r =
          results[8].status === "fulfilled"
            ? results[8].value
            : { data: null, error: "تعذر تحميل المعاملات" };
        _setErr("transactions", (r as any).error);
        setTxs(pickArray((r as any).data));
      }

      setSectionErrors(errs);
    };

    if (loading && !refreshing) {
      setLoading(true);
      try {
        await run();
      } finally {
        setLoading(false);
      }
    } else {
      setRefreshing(true);
      try {
        await run();
      } finally {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    if (isClient) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]);

  // ===== Derived =====
  const currency = wallet?.currency ?? "SAR";
  const usesCents = Boolean(wallet?._usesCents);

  const cars = useMemo(() => (Array.isArray(recentCars) ? recentCars : []), [recentCars]);
  const totalCars = useMemo(
    () => Number(overviewKpis?.total_cars ?? cars.length ?? 0),
    [overviewKpis, cars]
  );

  const walletBalanceSar = useMemo(() => Number(wallet?.balance_sar ?? 0), [wallet]);

  const carsByStatus = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of cars) {
      const s = String(c?.auction_status ?? "غير محدد");
      m.set(s, (m.get(s) ?? 0) + 1);
    }
    return Array.from(m.entries())
      .map(([status, value]) => ({ status, value }))
      .sort((a, b) => b.value - a.value);
  }, [cars]);

  // ✅ بديل "مضمون" للعرض بدل BarChart (يشتغل Light/Dark بدون مشاكل)
  const statusBars = useMemo(() => {
    const max = Math.max(...carsByStatus.map((x) => x.value), 1);
    return carsByStatus.map((x) => ({
      ...x,
      pct: Math.round((x.value / max) * 100),
    }));
  }, [carsByStatus]);

  const txSeries = useMemo(() => {
    return (txs ?? [])
      .slice(0, 10)
      .map((t: any) => {
        const date = t?.created_at ?? t?.date ?? "";
        const rawAmount = t?.amount ?? t?.value ?? 0;
        const amount = Math.abs(toSarAmount(rawAmount, usesCents));
        return { date, amount };
      })
      .reverse();
  }, [txs, usesCents]);

  const shipCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of shipments ?? []) {
      const key = shipmentStatusKey(s);
      m[key] = (m[key] ?? 0) + 1;
    }
    return m;
  }, [shipments]);

  const reqCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of serviceReqs ?? []) {
      const st = String(r?.status ?? "pending");
      m[st] = (m[st] ?? 0) + 1;
    }
    return m;
  }, [serviceReqs]);

  const ratingOverall = ratingsSummary?.overall ?? null;
  const ratingCount = ratingsSummary?.totalCount ?? null;

  const commissionSum = overviewKpis?.commission_sum ?? null;

  const shipmentsInProgress = useMemo(() => {
    const fromList =
      (shipCounts["pending"] ?? 0) +
      (shipCounts["in_transit"] ?? 0) +
      (shipCounts["out_for_delivery"] ?? 0);
    if ((shipments ?? []).length > 0) return fromList;
    return Number(overviewKpis?.shipments_count ?? 0);
  }, [shipCounts, shipments, overviewKpis]);

  const shipmentsDelivered = useMemo(() => {
    const fromList = shipCounts["delivered"] ?? 0;
    if ((shipments ?? []).length > 0) return fromList;
    return 0;
  }, [shipCounts, shipments]);

  if (!isClient) {
    return (
      <div dir="rtl" className="min-h-dvh flex items-center justify-center bg-background">
        <p className="text-foreground animate-pulse">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-dvh bg-background text-foreground flex relative">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-72 shrink-0 sticky top-0 min-h-dvh bg-card/50 border-l border-border">
        <Suspense fallback={<GlobalLoader />}>
          <Sidebar />
        </Suspense>
      </aside>

      {/* Drawer (Mobile) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            key="drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            key="drawer-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed inset-y-0 left-0 right-auto z-50 md:hidden w-72 bg-card border-l border-border shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <Suspense fallback={<GlobalLoader />}>
              <Sidebar />
            </Suspense>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <section className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30">
          <Suspense fallback={<GlobalLoader />}>
            <Header />
          </Suspense>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="relative px-3 md:px-6 py-4 space-y-6">
            {/* تحذيرات الأقسام */}
            {Object.keys(sectionErrors).length > 0 && (
              <div className="rounded-xl border border-amber-600/40 bg-amber-900/20 text-amber-200 px-4 py-3">
                <div className="flex items-start gap-2">
                  <FiAlertTriangle className="mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-semibold">تم تحميل الصفحة جزئياً</div>
                    <ul className="list-disc pr-4 text-sm">
                      {Object.entries(sectionErrors).map(([k, v]) => (
                        <li key={k}>
                          <span className="text-muted-foreground">قسم {k}:</span> {v}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Header row */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  أهلًا {profile?.first_name ? `، ${profile.first_name}` : ""} 👋
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  هذه لمحة سريعة عن أداء المعرض — يمكنك التوسّع من صفحة التحليلات أو الأقسام الجانبية.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push?.("/exhibitor/analytics")}
                  className="inline-flex items-center gap-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border px-3 py-2 transition text-sm"
                >
                  <FiBarChart2 /> التحليلات
                </button>
                <button
                  onClick={() => router.push?.("/exhibitor/add-car")}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 px-3 py-2 transition text-sm text-primary-foreground"
                >
                  <FiPlusCircle /> إضافة سيارة
                </button>
                <button
                  onClick={fetchAll}
                  className="inline-flex items-center gap-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border px-3 py-2 transition text-sm"
                  disabled={refreshing}
                >
                  <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
                  {refreshing ? "يُحدِّث..." : "تحديث"}
                </button>
              </div>
            </div>

            {/* KPIs */}
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {loading ? (
                <>
                  <Skel className="h-24" />
                  <Skel className="h-24" />
                  <Skel className="h-24" />
                  <Skel className="h-24" />
                </>
              ) : (
                <>
                  <Kpi
                    icon={<FiDollarSign size={18} />}
                    title="رصيد المحفظة"
                    value={money(walletBalanceSar, currency)}
                  />
                  <Kpi
                    icon={<BsCarFront size={18} />}
                    title="إجمالي السيارات"
                    value={nf.format(totalCars)}
                    sub={cars?.length ? `أحدث السيارات: ${nf.format(cars.length)}` : undefined}
                  />
                  <Kpi
                    icon={<FiTruck size={18} />}
                    title="الشحنات قيد التنفيذ"
                    value={nf.format(shipmentsInProgress)}
                    sub={`مكتملة: ${nf.format(shipmentsDelivered)}`}
                  />
                  <Kpi
                    icon={<FiStar size={18} />}
                    title="متوسط التقييم"
                    value={ratingOverall != null ? String(ratingOverall) : "—"}
                    sub={ratingCount != null ? `${nf.format(ratingCount)} مراجعة` : undefined}
                  />
                </>
              )}
            </section>

            {/* Charts */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ✅ Status snapshot (بديل مضمون بدل الرسم اللي كان بايظ) */}
              <div className="rounded-2xl p-4 bg-card border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">حالة المزادات</h3>
                  <a
                    href="/exhibitor/all-cars"
                    className="text-xs text-primary hover:text-primary/80 inline-flex items-center gap-1"
                  >
                    إدارة السيارات <FiExternalLink />
                  </a>
                </div>

                {loading ? (
                  <Skel className="h-64" />
                ) : (
                  <div className="h-64 overflow-y-auto pr-1">
                    {statusBars.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        لا توجد بيانات لعرضها.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {statusBars.map((s) => (
                          <div key={s.status} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-semibold text-foreground">{s.status}</span>
                              <span className="text-muted-foreground">{nf.format(s.value)}</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-2 rounded-full bg-primary"
                                style={{ width: `${s.pct}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Wallet recent amounts (تم تصليح ألوانه لـ Light/Dark) */}
              <div className="rounded-2xl p-4 bg-card border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">حركة المحفظة (آخر عمليات)</h3>
                  <a
                    href="/exhibitor/wallet"
                    className="text-xs text-primary hover:text-primary/80 inline-flex items-center gap-1"
                  >
                    المحفظة <FiExternalLink />
                  </a>
                </div>

                {loading ? (
                  <Skel className="h-64" />
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={txSeries}>
                        <defs>
                          <linearGradient id="gwl" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />

                        <XAxis
                          dataKey="date"
                          tickFormatter={(v: any) => (v ? dshort(v) : "")}
                          stroke="hsl(var(--muted-foreground))"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        />
                        <YAxis
                          stroke="hsl(var(--muted-foreground))"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        />

                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--popover))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 12,
                            color: "hsl(var(--popover-foreground))",
                          }}
                          labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                          labelFormatter={(v: any) => (v ? `التاريخ: ${dshort(v)}` : "")}
                          formatter={(v: any) => [money(Number(v), currency), "القيمة"]}
                        />

                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="hsl(var(--primary))"
                          fill="url(#gwl)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </section>

            {/* Two tables */}
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Recent cars */}
              <div className="rounded-2xl overflow-hidden border border-border bg-card">
                <div className="flex items-center justify-between p-4">
                  <h3 className="font-bold">أحدث السيارات</h3>
                  <a
                    href="/exhibitor/all-cars"
                    className="text-xs text-primary hover:text-primary/80 inline-flex items-center gap-1"
                  >
                    عرض الكل <FiExternalLink />
                  </a>
                </div>

                {loading ? (
                  <Skel className="h-40" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-muted">
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">#</th>
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">السيارة</th>
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">السنة</th>
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">التقييم</th>
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">حالة المزاد</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(cars ?? []).slice(0, 8).map((c: any, i: number) => (
                          <tr
                            key={c?.id ?? i}
                            className="border-t border-border hover:bg-muted/40"
                          >
                            <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-secondary text-muted-foreground">
                                  <BsCarFront />
                                </div>
                                <div className="font-semibold">
                                  {c?.make} {c?.model}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{c?.year ?? "—"}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {c?.evaluation_price != null ? money(Number(c.evaluation_price), currency) : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs px-2 py-1 rounded-full bg-secondary border border-border text-foreground">
                                {c?.auction_status ?? "—"}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {(cars ?? []).length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                              لا توجد سيارات.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Extra service requests */}
              <div className="rounded-2xl overflow-hidden border border-border bg-card">
                <div className="flex items-center justify-between p-4">
                  <h3 className="font-bold">طلبات الخدمات الإضافية</h3>
                  <a
                    href="/exhibitor/extra-services"
                    className="text-xs text-primary hover:text-primary/80 inline-flex items-center gap-1"
                  >
                    الخدمات <FiExternalLink />
                  </a>
                </div>

                {loading ? (
                  <Skel className="h-40" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-muted">
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">الخدمة</th>
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">الكمية</th>
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">الإجمالي</th>
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">الحالة</th>
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">التاريخ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(serviceReqs ?? []).slice(0, 8).map((r: any, i: number) => (
                          <tr
                            key={r?.id ?? i}
                            className="border-t border-border hover:bg-muted/40"
                          >
                            <td className="px-4 py-3 text-foreground">{r?.service?.name ?? "—"}</td>
                            <td className="px-4 py-3 text-muted-foreground">{r?.quantity ?? 1}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {r?.total_price != null
                                ? money(Number(r.total_price), r?.currency ?? currency)
                                : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs px-2 py-1 rounded-full bg-secondary border border-border text-foreground">
                                {r?.status ?? "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-sm">
                              {r?.created_at ? dshort(r.created_at) : "—"}
                            </td>
                          </tr>
                        ))}
                        {(serviceReqs ?? []).length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                              لا توجد طلبات بعد.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {!loading && (
                  <div className="p-4 border-t border-border text-sm text-muted-foreground flex flex-wrap gap-3">
                    <span>
                      pending: <strong>{nf.format(reqCounts["pending"] ?? 0)}</strong>
                    </span>
                    <span>
                      approved: <strong>{nf.format(reqCounts["approved"] ?? 0)}</strong>
                    </span>
                    <span>
                      rejected: <strong>{nf.format(reqCounts["rejected"] ?? 0)}</strong>
                    </span>
                    <span>
                      completed: <strong>{nf.format(reqCounts["completed"] ?? 0)}</strong>
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* Sessions + financial quick view */}
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Upcoming sessions */}
              <div className="xl:col-span-2 rounded-2xl overflow-hidden border border-border bg-card">
                <div className="flex items-center justify-between p-4">
                  <h3 className="font-bold">أقرب الجلسات</h3>
                  <a
                    href="/exhibitor/sessions"
                    className="text-xs text-primary hover:text-primary/80 inline-flex items-center gap-1"
                  >
                    الجلسات <FiExternalLink />
                  </a>
                </div>

                {loading ? (
                  <Skel className="h-36" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-muted">
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">الاسم</th>
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">النوع</th>
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">الحالة</th>
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">تاريخ الجلسة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(sessions ?? []).slice(0, 6).map((s: any, i: number) => (
                          <tr
                            key={s?.id ?? i}
                            className="border-t border-border hover:bg-muted/40"
                          >
                            <td className="px-4 py-3 text-foreground">
                              {s?.name ?? `جلسة رقم ${s?.id ?? ""}`}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{s?.type ?? "—"}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs px-2 py-1 rounded-full bg-secondary border border-border text-foreground">
                                {s?.status ?? "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {s?.session_date ? dtShort(s.session_date) : "—"}
                            </td>
                          </tr>
                        ))}
                        {(sessions ?? []).length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                              لا توجد جلسات قادمة.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Commission + quick wallet facts */}
              <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="font-bold mb-3">نظرة مالية سريعة</h3>

                {loading ? (
                  <Skel className="h-24" />
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">رصيد المحفظة</span>
                      <span className="font-bold">{money(walletBalanceSar, currency)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">إجمالي العمولات</span>
                      <span className="font-bold">
                        {commissionSum != null ? money(Number(commissionSum), currency) : "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">إعداد العمولة</span>
                      <span className="font-bold">
                        {commissionSummary?.commissionValue != null
                          ? money(
                              Number(commissionSummary.commissionValue),
                              commissionSummary?.commissionCurrency ?? "SAR"
                            )
                          : "—"}
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a
                    href="/exhibitor/commission"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border px-3 py-2 text-sm transition"
                  >
                    <FiSettings /> العمولات
                  </a>
                  <a
                    href="/exhibitor/shipments"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border px-3 py-2 text-sm transition"
                  >
                    <FiTruck /> الشحنات
                  </a>
                </div>
              </div>
            </section>
          </div>
        </main>
      </section>

      {/* FAB (mobile) */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed bottom-6 left-6 z-40 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-white shadow-lg hover:bg-primary/90 active:scale-95 transition-transform"
        aria-label="فتح القائمة"
      >
        <Menu size={22} />
      </button>
    </div>
  );
}

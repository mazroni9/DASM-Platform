"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import {
  FiMenu,
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

// recharts
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// Dynamic imports we keep
const Header = DynamicComponents.ExhibitorHeader;
const Sidebar = DynamicComponents.ExhibitorSidebar;

// ===== Helpers =====
const nf = new Intl.NumberFormat("ar-EG");
const money = (v: number, c = "SAR") =>
  new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: c,
    maximumFractionDigits: 0,
  }).format(v);
const dshort = (s: string) =>
  new Date(s).toLocaleDateString("ar-EG", { month: "short", day: "numeric" });

function Skel({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-muted/40 ${className}`} />
  );
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
          {sub && (
            <div className="text-muted-foreground text-xs mt-0.5">{sub}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ===== Safe fetch utils (لا تسقط الصفحة لو API فشل) =====
type FetchState<T> = { data: T | null; error: string | null };

async function safeGet<T = any>(
  url: string,
  params?: any
): Promise<FetchState<T>> {
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
  // Laravel paginator
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  // بعض الكنترولرز بيرجعوا {data: {...}} وفيها data تانية
  if (payload?.data && Array.isArray(payload.data.data))
    return payload.data.data;
  return [];
}

function pickValue<T = any>(payload: any, fallback: T | null = null): T | null {
  if (!payload) return fallback;
  if (payload?.data && typeof payload.data === "object")
    return payload.data as T;
  return (payload as T) ?? fallback;
}

// ===== Page =====
export default function ExhibitorDashboard() {
  const router = useLoadingRouter();

  const [isClient, setIsClient] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // تجميع أخطاء الأقسام بدل ما نظهر raw 500
  const [sectionErrors, setSectionErrors] = useState<Record<string, string>>(
    {}
  );

  // data
  const [profile, setProfile] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [carsPage, setCarsPage] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [ratingsSummary, setRatingsSummary] = useState<any>(null);
  const [commissionSummary, setCommissionSummary] = useState<any>(null);
  const [shipments, setShipments] = useState<any[]>([]);
  const [serviceReqs, setServiceReqs] = useState<any[]>([]);
  const [txs, setTxs] = useState<any[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);
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
      // نستخدم allSettled عشان ما يسقطش كله
      const results = await Promise.allSettled([
        safeGet("/api/user/profile"),
        safeGet("/api/exhibitor/wallet"),
        safeGet("/api/cars", { per_page: 8 }),
        safeGet("/api/exhibitor/sessions", { per_page: 5 }),
        safeGet("/api/exhibitor/ratings/summary"),
        safeGet("/api/exhibitor/commission/summary"),
        safeGet("/api/exhibitor/shipments", { per_page: 50 }),
        safeGet("/api/exhibitor/extra-services/requests", { per_page: 20 }),
        // transactions: جرّب الجديد ولو فشل جرّب legacy
        (async () => {
          const a = await safeGet("/api/exhibitor/wallet/transactions", {
            limit: 10,
          });
          if (!a.error) return a;
          const b = await safeGet("/api/exhibitor/wallet/transcations", {
            limit: 10,
          });
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
        setProfile(pickValue((r as any).data, null));
      }
      // wallet
      {
        const r =
          results[1].status === "fulfilled"
            ? results[1].value
            : { data: null, error: "تعذر تحميل المحفظة" };
        _setErr("wallet", (r as any).error);
        setWallet(pickValue((r as any).data, null));
      }
      // cars
      {
        const r =
          results[2].status === "fulfilled"
            ? results[2].value
            : { data: null, error: "تعذر تحميل السيارات" };
        _setErr("cars", (r as any).error);
        setCarsPage((r as any).data);
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
        setRatingsSummary(pickValue((r as any).data, null));
      }
      // commission summary
      {
        const r =
          results[5].status === "fulfilled"
            ? results[5].value
            : { data: null, error: "تعذر تحميل العمولات" };
        _setErr("commission", (r as any).error);
        setCommissionSummary(pickValue((r as any).data, null));
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
    if (isClient) fetchAll(); /* eslint-disable-next-line */
  }, [isClient]);

  // derived
  const cars = useMemo(() => {
    const d = carsPage?.data ?? carsPage?.items ?? carsPage ?? [];
    return Array.isArray(d) ? d : [];
  }, [carsPage]);

  const totalCars = useMemo(() => {
    return carsPage?.total ?? carsPage?.meta?.total ?? cars?.length ?? 0;
  }, [carsPage, cars]);

  const currency = wallet?.currency ?? "SAR";

  const carsByStatus = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of cars) {
      const s = c?.auction_status ?? "غير محدد";
      m.set(s, (m.get(s) ?? 0) + 1);
    }
    return Array.from(m.entries())
      .map(([status, value]) => ({ status, value }))
      .sort((a, b) => b.value - a.value);
  }, [cars]);

  const txSeries = useMemo(() => {
    const a = (txs ?? [])
      .slice(0, 10)
      .map((t: any) => ({
        date: t?.created_at ?? t?.date ?? "",
        amount: Math.abs(Number(t?.amount ?? t?.value ?? 0)) || 0,
      }))
      .reverse();
    return a;
  }, [txs]);

  const shipCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of shipments ?? []) {
      const st = s?.status ?? "unknown";
      m[st] = (m[st] ?? 0) + 1;
    }
    return m;
  }, [shipments]);

  const reqCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of serviceReqs ?? []) {
      const st = r?.status ?? "pending";
      m[st] = (m[st] ?? 0) + 1;
    }
    return m;
  }, [serviceReqs]);

  if (!isClient) {
    return (
      <div
        dir="rtl"
        className="min-h-dvh flex items-center justify-center bg-background"
      >
        <p className="text-foreground animate-pulse">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-dvh bg-background text-foreground flex relative"
    >
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
          {/* خلفية رقيقة */}
          <div className="relative">{/* Gradient removed */}</div>

          <div className="relative px-3 md:px-6 py-4 space-y-6">
            {/* تحذيرات الأقسام (لو API وقع) */}
            {Object.keys(sectionErrors).length > 0 && (
              <div className="rounded-xl border border-amber-600/40 bg-amber-900/20 text-amber-200 px-4 py-3">
                <div className="flex items-start gap-2">
                  <FiAlertTriangle className="mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-semibold">تم تحميل الصفحة جزئياً</div>
                    <ul className="list-disc pr-4 text-sm">
                      {Object.entries(sectionErrors).map(([k, v]) => (
                        <li key={k}>
                          <span className="text-muted-foreground">
                            قسم {k}:
                          </span>{" "}
                          {v}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Header row: welcome + actions */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  أهلًا {profile?.first_name ? `، ${profile.first_name}` : ""}{" "}
                  👋
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  هذه لمحة سريعة عن أداء المعرض — يمكنك التوسّع من صفحة
                  التحليلات أو الأقسام الجانبية.
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
                    value={money(
                      Number(wallet?.balance ?? 0),
                      wallet?.currency ?? "SAR"
                    )}
                    sub={
                      wallet?.hold_amount
                        ? `محجوز: ${money(
                            Number(wallet.hold_amount),
                            wallet?.currency ?? "SAR"
                          )}`
                        : undefined
                    }
                  />
                  <Kpi
                    icon={<BsCarFront size={18} />}
                    title="إجمالي السيارات"
                    value={nf.format(totalCars)}
                    sub={
                      cars?.length
                        ? `المعروضة الآن: ${nf.format(cars.length)}`
                        : undefined
                    }
                  />
                  <Kpi
                    icon={<FiTruck size={18} />}
                    title="الشحنات قيد التنفيذ"
                    value={nf.format(
                      (shipCounts["pending"] ?? 0) +
                        (shipCounts["in_transit"] ?? 0)
                    )}
                    sub={`مكتملة: ${nf.format(shipCounts["delivered"] ?? 0)}`}
                  />
                  <Kpi
                    icon={<FiStar size={18} />}
                    title="متوسط التقييم"
                    value={
                      ratingsSummary?.avg ? String(ratingsSummary.avg) : "—"
                    }
                    sub={
                      ratingsSummary?.count
                        ? `${nf.format(ratingsSummary.count)} مراجعة`
                        : undefined
                    }
                  />
                </>
              )}
            </section>

            {/* Charts */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cars status snapshot */}
              <div className="rounded-2xl p-4 bg-card border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">
                    حالة المزادات (لقطة من آخر السيارات)
                  </h3>
                  <a
                    href="/exhibitor/add-car"
                    className="text-xs text-primary hover:text-primary/80 inline-flex items-center gap-1"
                  >
                    إدارة السيارات <FiExternalLink />
                  </a>
                </div>
                {loading ? (
                  <Skel className="h-64" />
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={carsByStatus}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="status"
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis
                          allowDecimals={false}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--popover))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 12,
                            color: "hsl(var(--popover-foreground))",
                          }}
                          formatter={(v: any) => [v, "عدد"]}
                        />
                        <Bar
                          dataKey="value"
                          fill="hsl(var(--primary))"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Wallet recent amounts */}
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
                            <stop
                              offset="0%"
                              stopColor="#22d3ee"
                              stopOpacity={0.5}
                            />
                            <stop
                              offset="100%"
                              stopColor="#22d3ee"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(v: any) => (v ? dshort(v) : "")}
                          stroke="#94a3b8"
                        />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{
                            background: "#0f172a",
                            border: "1px solid #1f2937",
                            borderRadius: 12,
                          }}
                          labelFormatter={(v: any) =>
                            v ? `التاريخ: ${dshort(v)}` : ""
                          }
                          formatter={(v: any) => [
                            money(Number(v), wallet?.currency ?? "SAR"),
                            "القيمة",
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="#22d3ee"
                          fill="url(#gwl)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </section>

            {/* Two tables: recent cars + service requests */}
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
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">
                            #
                          </th>
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">
                            السيارة
                          </th>
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">
                            السنة
                          </th>
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">
                            التقييم
                          </th>
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">
                            حالة المزاد
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(cars ?? []).slice(0, 8).map((c: any, i: number) => (
                          <tr
                            key={c?.id ?? i}
                            className="border-t border-border hover:bg-muted/40"
                          >
                            <td className="px-4 py-3 text-muted-foreground">
                              {i + 1}
                            </td>
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
                            <td className="px-4 py-3 text-muted-foreground">
                              {c?.year ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {c?.evaluation_price != null
                                ? money(
                                    Number(c.evaluation_price),
                                    wallet?.currency ?? "SAR"
                                  )
                                : "—"}
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
                            <td
                              colSpan={5}
                              className="px-4 py-6 text-center text-muted-foreground"
                            >
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
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">
                            الخدمة
                          </th>
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">
                            الكمية
                          </th>
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">
                            الإجمالي
                          </th>
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">
                            الحالة
                          </th>
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">
                            التاريخ
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(serviceReqs ?? [])
                          .slice(0, 8)
                          .map((r: any, i: number) => (
                            <tr
                              key={r?.id ?? i}
                              className="border-t border-border hover:bg-muted/40"
                            >
                              <td className="px-4 py-3 text-foreground">
                                {r?.service?.name ?? "—"}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {r?.quantity ?? 1}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {r?.total_price != null
                                  ? money(
                                      Number(r.total_price),
                                      r?.currency ?? wallet?.currency ?? "SAR"
                                    )
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
                            <td
                              colSpan={5}
                              className="px-4 py-6 text-center text-muted-foreground"
                            >
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
                      قيد المراجعة:{" "}
                      <strong>{nf.format(reqCounts["pending"] ?? 0)}</strong>
                    </span>
                    <span>
                      مقبول:{" "}
                      <strong>{nf.format(reqCounts["approved"] ?? 0)}</strong>
                    </span>
                    <span>
                      مرفوض:{" "}
                      <strong>{nf.format(reqCounts["rejected"] ?? 0)}</strong>
                    </span>
                    <span>
                      مكتمل:{" "}
                      <strong>{nf.format(reqCounts["completed"] ?? 0)}</strong>
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* Sessions + transactions compact */}
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
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">
                            العنوان
                          </th>
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">
                            الحالة
                          </th>
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">
                            التاريخ
                          </th>
                          <th className="px-4 py-3 text-right text-muted-foreground text-xs font-bold">
                            زمن الإنشاء
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(sessions ?? [])
                          .slice(0, 6)
                          .map((s: any, i: number) => (
                            <tr
                              key={s?.id ?? i}
                              className="border-t border-border hover:bg-muted/40"
                            >
                              <td className="px-4 py-3 text-foreground">
                                {s?.title ??
                                  s?.name ??
                                  `جلسة رقم ${s?.id ?? ""}`}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs px-2 py-1 rounded-full bg-secondary border border-border text-foreground">
                                  {s?.status ?? "—"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {s?.scheduled_at
                                  ? new Date(s.scheduled_at).toLocaleString(
                                      "ar-EG"
                                    )
                                  : "—"}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground text-sm">
                                {s?.created_at ? dshort(s.created_at) : "—"}
                              </td>
                            </tr>
                          ))}
                        {(sessions ?? []).length === 0 && (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-4 py-6 text-center text-muted-foreground"
                            >
                              لا توجد جلسات حالية.
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
                      <span className="text-muted-foreground">
                        رصيد المحفظة
                      </span>
                      <span className="font-bold">
                        {money(
                          Number(wallet?.balance ?? 0),
                          wallet?.currency ?? "SAR"
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        عمولات مُحتسبة
                      </span>
                      <span className="font-bold">
                        {commissionSummary?.total != null
                          ? money(
                              Number(commissionSummary.total),
                              wallet?.currency ?? "SAR"
                            )
                          : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">هذا الشهر</span>
                      <span className="font-bold">
                        {commissionSummary?.month_total != null
                          ? money(
                              Number(commissionSummary.month_total),
                              wallet?.currency ?? "SAR"
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

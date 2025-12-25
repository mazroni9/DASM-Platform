"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "../../../components/exhibitor/Header";
import { Sidebar } from "../../../components/exhibitor/sidebar";
import { FiMenu } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  Coins,
  Info,
  Search,
  Filter,
  RefreshCw,
  Download,
  Copy,
  Calculator,
  CheckCircle2,
} from "lucide-react";

/* =========================
   Types
========================= */
type Currency = string;

interface RecentCommission {
  id: number;
  date: string; // ISO
  car: string | null;
  value: number;
}

interface CommissionSummary {
  commissionValue: number;
  commissionCurrency: Currency;
  commissionNote?: string | null;
  recentCommissions: RecentCommission[];
}

interface Operation {
  id: number;
  date: string; // ISO
  car: string | null;
  value: number;
  currency: Currency;
  description?: string | null;
}

type Paginator<T> = {
  data: T[];
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
};

/* =========================
   Helpers
========================= */
const fmtMoney = (n: number) =>
  new Intl.NumberFormat("ar-SA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const formatDate = (iso: string) => new Date(iso).toLocaleString("ar-SA");

/* =========================
   Minimal Gauge
========================= */
function Gauge({ value, max = 2000 }: { value: number; max?: number }) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  const R = 56;
  const CIRC = 2 * Math.PI * R;
  const off = CIRC - (CIRC * percent) / 100;

  return (
    <div className="relative w-32 h-32 sm:w-36 sm:h-36 shrink-0">
      <svg viewBox="0 0 140 140" className="w-full h-full">
        <defs>
          <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary))" />
          </linearGradient>
        </defs>
        <circle
          cx="70"
          cy="70"
          r={R}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="14"
        />
        <circle
          cx="70"
          cy="70"
          r={R}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="14"
          strokeDasharray={CIRC}
          strokeDashoffset={off}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .9s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl sm:text-3xl font-extrabold text-primary">
          {fmtMoney(value)}
        </span>
        <span className="text-[11px] text-muted-foreground">ريال</span>
      </div>
    </div>
  );
}

/* =========================
   Page
========================= */
export default function ExhibitorCommissionPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Summary + settings
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summary, setSummary] = useState<CommissionSummary | null>(null);

  // Settings form
  const [valInput, setValInput] = useState<string>("0");
  const [curInput, setCurInput] = useState<Currency>("SAR");
  const [noteInput, setNoteInput] = useState<string>("");

  // Operations
  const [loadingOps, setLoadingOps] = useState(true);
  const [paginator, setPaginator] = useState<Paginator<Operation> | null>(null);
  const [ops, setOps] = useState<Operation[]>([]);
  const [serverPage, setServerPage] = useState(1);

  // Filters
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Estimator
  const [estPrice, setEstPrice] = useState<string>(""); // string للتحكم الكامل
  const [estMode, setEstMode] = useState<"flat" | "progressive">("flat");
  const [estResult, setEstResult] = useState<number | null>(null);
  const [estimating, setEstimating] = useState(false);

  useEffect(() => setIsClient(true), []);

  /* -------------------------
     Fetchers
  ------------------------- */
  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const { data } = await api.get("/api/exhibitor/commission/summary");
      if (data?.success && data?.data) {
        const s: CommissionSummary = data.data;
        setSummary(s);
        // seed settings form
        setValInput(String(s.commissionValue ?? 0));
        setCurInput((s.commissionCurrency || "SAR").toUpperCase());
        setNoteInput(s.commissionNote || "");
      } else {
        throw new Error("Invalid summary payload");
      }
    } catch (e: any) {
      console.error(e);
      toast.error("تعذّر تحميل الملخّص");
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchOps = async (page = 1) => {
    setLoadingOps(true);
    try {
      const params = new URLSearchParams();
      params.set("per_page", "10");
      if (q.trim()) params.set("q", q.trim());
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      params.set("page", String(page));

      const { data } = await api.get(
        `/api/exhibitor/commission/operations?${params.toString()}`
      );

      // Laravel paginator
      if (
        data?.data &&
        Array.isArray(data.data) &&
        typeof data.current_page === "number"
      ) {
        const p: Paginator<Operation> = data;
        setPaginator(p);
        setOps(p.data || []);
        setServerPage(p.current_page || 1);
      } else if (Array.isArray(data)) {
        // array fallback
        const p: Paginator<Operation> = {
          data,
          current_page: 1,
          per_page: data.length,
          last_page: 1,
          total: data.length,
        };
        setPaginator(p);
        setOps(data);
        setServerPage(1);
      } else {
        // object fallback
        const p: Paginator<Operation> = {
          data: data?.data || [],
          current_page: data?.current_page || 1,
          per_page: data?.per_page || (data?.data?.length ?? 10),
          last_page: data?.last_page || 1,
          total: data?.total || (data?.data?.length ?? 0),
        };
        setPaginator(p);
        setOps(p.data || []);
        setServerPage(p.current_page || 1);
      }
    } catch (e: any) {
      console.error(e);
      toast.error("تعذّر تحميل العمليات");
      setPaginator(null);
      setOps([]);
    } finally {
      setLoadingOps(false);
    }
  };

  useEffect(() => {
    if (!isClient) return;
    fetchSummary();
    fetchOps(1);
  }, [isClient]);

  /* -------------------------
     Actions
  ------------------------- */
  const saveSettings = async () => {
    try {
      const value = Number(valInput);
      if (Number.isNaN(value) || value < 0) {
        toast.error("قيمة السعي غير صالحة");
        return;
      }
      const payload = {
        commission_value: value,
        commission_currency: (curInput || "SAR").toUpperCase(),
        commission_note: noteInput || null,
      };
      await api.put("/api/exhibitor/commission/settings", payload);
      toast.success("تم حفظ الإعدادات");
      fetchSummary();
    } catch (e: any) {
      console.error(e);
      toast.error("تعذّر حفظ الإعدادات");
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchSummary(), fetchOps(serverPage)]);
    toast.success("تم التحديث");
  };

  const handlePrev = async () => {
    if (!paginator || paginator.current_page <= 1) return;
    await fetchOps(paginator.current_page - 1);
  };

  const handleNext = async () => {
    if (!paginator || paginator.current_page >= paginator.last_page) return;
    await fetchOps(paginator.current_page + 1);
  };

  const applyFilters = async () => {
    await fetchOps(1);
  };

  const exportCSV = () => {
    const rows = [
      ["#", "التاريخ", "السيارة", "قيمة السعي", "العملة", "الوصف"],
      ...ops.map((o) => [
        String(o.id),
        formatDate(o.date),
        o.car ?? "",
        String(o.value),
        o.currency || "",
        (o.description || "").replace(/\n/g, " "),
      ]),
    ];
    const csv = rows
      .map((r) =>
        r
          .map((c) => {
            const v = String(c ?? "");
            return /[,"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commission_ops_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("تم تنزيل CSV");
  };

  const copyTable = async () => {
    try {
      const header = [
        "#",
        "التاريخ",
        "السيارة",
        "قيمة السعي",
        "العملة",
        "الوصف",
      ];
      const body = ops.map(
        (o) =>
          `${o.id}\t${formatDate(o.date)}\t${o.car ?? ""}\t${o.value}\t${
            o.currency ?? ""
          }\t${o.description ?? ""}`
      );
      await navigator.clipboard.writeText(
        [header.join("\t"), ...body].join("\n")
      );
      toast.success("تم نسخ الجدول");
    } catch {
      toast.error("تعذّر النسخ للحافظة");
    }
  };

  const estimate = async () => {
    // تنظيف وتحقق
    const cleaned = estPrice.replace(/[^\d]/g, "");
    const priceNum = Number(cleaned);
    if (!priceNum || Number.isNaN(priceNum) || priceNum <= 0) {
      toast.error("أدخل سعر صالح للحساب");
      return;
    }
    setEstimating(true);
    setEstResult(null);
    try {
      const { data } = await api.post("/api/exhibitor/commission/estimate", {
        price: priceNum,
        mode: estMode, // 'flat' | 'progressive'
      });
      const amt = Number(data?.data?.amount ?? 0);
      setEstResult(Number.isFinite(amt) ? amt : 0);
    } catch (e: any) {
      console.error(e);
      toast.error("فشل حساب التقدير");
      setEstResult(null);
    } finally {
      setEstimating(false);
    }
  };

  /* -------------------------
     Derivations
  ------------------------- */
  const recent = useMemo(() => summary?.recentCommissions ?? [], [summary]);
  const resultCurrency = summary?.commissionCurrency || "SAR";

  /* -------------------------
     Skeleton (client)
  ------------------------- */
  if (!isClient) {
    return (
      <div dir="rtl" className="flex min-h-screen bg-background">
        <div className="hidden md:block w-72 bg-card border-l border-border animate-pulse" />
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-card border-b border-border animate-pulse" />
          <main className="p-6 flex-1 bg-background" />
        </div>
      </div>
    );
  }

  /* -------------------------
     UI (Contained, No Overflow)
  ------------------------- */
  return (
    <div
      dir="rtl"
      className="flex min-h-screen bg-background text-foreground overflow-x-hidden"
    >
      {/* Sidebar Desktop */}
      <div className="hidden md:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* Sidebar Mobile Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 md:hidden flex"
            role="dialog"
            aria-modal="true"
          >
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="إغلاق القائمة"
            />
            <motion.div className="relative w-72 ml-auto h-full">
              <Sidebar />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col w-0">
        <Header />

        <main className="flex-1">
          {/* Container */}
          <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 md:px-6 py-4 md:py-6">
            {/* Title + Actions */}
            <div className="mb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
                  <Coins className="w-5 h-5 text-primary" />
                  خانة السعي
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  إدارة قيمة السعي الخاصة بمعرضك، استعراض آخر العمليات، وحساب
                  تقديري وفق الشرائح.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={refreshAll}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-foreground hover:bg-muted"
                >
                  <RefreshCw className="w-4 h-4" />
                  تحديث
                </button>
              </div>
            </div>

            {/* Top: Current Commission + Note + Recent */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              {/* Card: Current Commission */}
              <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-4 min-w-0 overflow-hidden">
                <Gauge value={Number(summary?.commissionValue ?? 0)} />
                <div className="flex-1 min-w-0">
                  <div className="text-muted-foreground text-sm">
                    قيمة السعي الحالية
                  </div>
                  {loadingSummary ? (
                    <div className="mt-2 h-8 w-36 bg-muted rounded animate-pulse" />
                  ) : (
                    <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-primary truncate">
                      {fmtMoney(Number(summary?.commissionValue ?? 0))}{" "}
                      <span className="text-sm text-muted-foreground">
                        {summary?.commissionCurrency || "SAR"}
                      </span>
                    </div>
                  )}
                  <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 shrink-0" /> يمكنك تعديل القيمة
                    من لوحة الإعدادات أدناه.
                  </div>
                </div>
              </div>

              {/* Card: Note */}
              <div className="rounded-2xl border border-border bg-card p-4 min-w-0 overflow-hidden">
                <div className="text-muted-foreground text-sm font-semibold mb-2">
                  ملاحظة السعي
                </div>
                {loadingSummary ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm leading-6 min-h-[48px] whitespace-pre-wrap break-words">
                    {summary?.commissionNote || "—"}
                  </p>
                )}
              </div>

              {/* Card: Recent operations */}
              <div className="rounded-2xl border border-border bg-card p-4 min-w-0 overflow-hidden">
                <div className="text-muted-foreground text-sm font-semibold mb-2">
                  العمليات الأخيرة
                </div>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {loadingSummary ? (
                    [...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="h-10 bg-muted rounded animate-pulse"
                      />
                    ))
                  ) : recent.length ? (
                    recent.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2"
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="text-foreground text-sm truncate">
                            {r.car || "عملية سعي"}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {formatDate(r.date)}
                          </span>
                        </div>
                        <div className="text-primary font-bold whitespace-nowrap">
                          {fmtMoney(r.value)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      لا توجد عمليات حديثة
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="rounded-2xl border border-border bg-card p-4 md:p-5 mb-6 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="text-foreground font-semibold">
                  إعدادات السعي
                </div>
                <div className="text-xs text-muted-foreground">
                  تطبيق التغييرات فوريًا
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    قيمة السعي
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    step="1"
                    min={0}
                    value={valInput}
                    onChange={(e) => setValInput(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    العملة
                  </label>
                  <input
                    type="text"
                    value={curInput}
                    onChange={(e) => setCurInput(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="SAR"
                    maxLength={3}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">
                    ملاحظة
                  </label>
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="وصف موجز لمكونات السعي"
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={saveSettings}
                  className="px-4 py-2.5 rounded-lg text-primary-foreground font-semibold bg-primary hover:bg-primary/90 shadow-lg inline-flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  حفظ الإعدادات
                </button>
              </div>
            </div>

            {/* Toolbar: Filters + estimator + export */}
            <div className="rounded-2xl border border-border bg-card p-4 md:p-5 mb-4 overflow-hidden">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Filters */}
                <div className="col-span-2 min-w-0">
                  <div className="flex flex-col xl:flex-row xl:flex-wrap gap-3 xl:items-end">
                    <div className="relative flex-1 min-w-0">
                      <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="ابحث بالسيارة / الوصف..."
                        className="w-full pr-9 pl-3 py-2.5 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">
                          من تاريخ
                        </label>
                        <input
                          type="date"
                          value={from}
                          onChange={(e) => setFrom(e.target.value)}
                          className="px-3 py-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">
                          إلى تاريخ
                        </label>
                        <input
                          type="date"
                          value={to}
                          onChange={(e) => setTo(e.target.value)}
                          className="px-3 py-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    </div>
                    <div className="flex items-end gap-2 flex-wrap">
                      <button
                        onClick={applyFilters}
                        className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted"
                      >
                        <Filter className="w-4 h-4" />
                        تطبيق الفلترة
                      </button>
                      <button
                        onClick={() => {
                          setQ("");
                          setFrom("");
                          setTo("");
                          fetchOps(1);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted"
                      >
                        إعادة تعيين
                      </button>
                    </div>
                  </div>
                </div>

                {/* Estimator (شرائح) — تم إصلاح الـ overflow */}
                <div className="col-span-1">
                  <div className="rounded-xl border border-border bg-muted/50 p-3 overflow-hidden">
                    <div className="text-muted-foreground text-sm font-semibold mb-2 flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-primary" />
                      حاسبة تقديرية (شرائح)
                    </div>

                    {/* اللف التلقائي + عناصر بعرض كامل على الموبايل */}
                    <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="سعر السيارة"
                        value={estPrice}
                        onChange={(e) =>
                          setEstPrice(e.target.value.replace(/[^\d]/g, ""))
                        }
                        className="w-full sm:flex-1 px-3 py-2.5 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <select
                        value={estMode}
                        onChange={(e) =>
                          setEstMode(
                            (e.target.value as "flat" | "progressive") || "flat"
                          )
                        }
                        className="w-full sm:w-40 px-3 py-2.5 rounded-lg bg-background border border-border text-foreground"
                      >
                        <option value="flat">Flat</option>
                        <option value="progressive">Progressive</option>
                      </select>
                      <button
                        onClick={estimate}
                        disabled={
                          estimating || !estPrice || Number(estPrice) <= 0
                        }
                        className={`w-full sm:w-auto px-3 py-2.5 rounded-lg text-primary-foreground font-semibold shadow-lg
                          ${
                            estimating || !estPrice || Number(estPrice) <= 0
                              ? "bg-muted text-muted-foreground border-border cursor-not-allowed"
                              : "bg-primary hover:bg-primary/90"
                          }`}
                      >
                        {estimating ? "جارِ الحساب…" : "احسب"}
                      </button>
                    </div>

                    <div className="mt-2 text-muted-foreground text-sm">
                      النتيجة:{" "}
                      <span className="text-primary font-bold">
                        {estResult != null
                          ? `${fmtMoney(estResult)} ${resultCurrency}`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Export */}
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={exportCSV}
                  className="px-3 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
                <button
                  onClick={copyTable}
                  className="px-3 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted inline-flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  نسخ
                </button>
              </div>
            </div>

            {/* Table (contained & scrollable) */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[880px] w-full table-auto text-sm">
                  <thead className="bg-muted border-b border-border text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-right">#</th>
                      <th className="px-4 py-3 text-right">التاريخ</th>
                      <th className="px-4 py-3 text-right">السيارة</th>
                      <th className="px-4 py-3 text-right">قيمة السعي</th>
                      <th className="px-4 py-3 text-right">العملة</th>
                      <th className="px-4 py-3 text-right">الوصف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loadingOps ? (
                      [...Array(8)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-4 py-3">
                            <div className="h-4 w-10 bg-muted rounded" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-4 w-40 bg-muted rounded" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-4 w-56 bg-muted rounded" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-4 w-20 bg-muted rounded" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-4 w-12 bg-muted rounded" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-4 w-64 bg-muted rounded" />
                          </td>
                        </tr>
                      ))
                    ) : ops.length ? (
                      ops.map((o) => (
                        <tr
                          key={o.id}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {o.id}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {formatDate(o.date)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {o.car ? (
                              <span className="truncate block max-w-[380px]">
                                {o.car}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/50">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-bold text-primary">
                              {fmtMoney(o.value)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {o.currency || "SAR"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {o.description ? (
                              <span className="block truncate max-w-[520px]">
                                {o.description}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/50">
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          className="px-4 py-10 text-center text-muted-foreground"
                          colSpan={6}
                        >
                          لا توجد عمليات مطابقة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Server Pagination */}
              {!loadingOps && paginator && paginator.last_page > 1 && (
                <div className="flex items-center justify-between p-3 border-t border-border text-sm text-muted-foreground">
                  <button
                    onClick={handlePrev}
                    disabled={paginator.current_page <= 1}
                    className={`px-3 py-2 rounded-lg border ${
                      paginator.current_page <= 1
                        ? "border-border text-muted-foreground/50 cursor-not-allowed"
                        : "border-border hover:bg-muted text-foreground"
                    }`}
                  >
                    السابق
                  </button>
                  <div className="text-muted-foreground">
                    صفحة{" "}
                    <span className="text-foreground">
                      {paginator.current_page}
                    </span>{" "}
                    من{" "}
                    <span className="text-foreground">
                      {paginator.last_page}
                    </span>
                  </div>
                  <button
                    onClick={handleNext}
                    disabled={paginator.current_page >= paginator.last_page}
                    className={`px-3 py-2 rounded-lg border ${
                      paginator.current_page >= paginator.last_page
                        ? "border-border text-muted-foreground/50 cursor-not-allowed"
                        : "border-border hover:bg-muted text-foreground"
                    }`}
                  >
                    التالي
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* FAB (Mobile) لفتح القائمة */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed bottom-6 right-6 bg-primary text-primary-foreground p-4 rounded-full shadow-xl z-50 hover:bg-primary/90 transition-all duration-200 flex items-center justify-center"
        aria-label="فتح القائمة"
        title="القائمة"
      >
        <FiMenu size={22} />
      </button>
    </div>
  );
}

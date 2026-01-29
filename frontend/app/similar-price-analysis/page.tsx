/**
 * Similar Price Analysis (Public) - FULLY FIXED
 * Path: Frontend-local/app/similar-price-analysis/page.tsx
 */

"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LoadingLink from "@/components/LoadingLink";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Filter,
  Search,
  RefreshCw,
  Loader2,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Award,
  Car,
  Gauge,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  List,
  Eye,
  Layers,
  ChevronDown,
  Hash,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   Types
═══════════════════════════════════════════════════════════════════════════ */

type Stats = {
  count: number;
  avg_price: number | null;
  min_price: number | null;
  max_price: number | null;
  median_price: number | null;
  mode?: string;
};

type MarketCar = any;

type ResultMeta = {
  fallback?: boolean;
  mode?: string;
  message?: string;
  resolved?: any;
};

/* ═══════════════════════════════════════════════════════════════════════════
   Utility Functions - أرقام مضمونة
═══════════════════════════════════════════════════════════════════════════ */

function numOrEmpty(v: string): string {
  const t = v.trim();
  if (!t) return "";
  const n = Number(t.replace(/,/g, ""));
  return Number.isFinite(n) ? String(n) : "";
}

/** تنسيق الأرقام - يُرجع string عادي بدون أي components */
function formatNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  const num = Number(n);
  if (!Number.isFinite(num)) return "—";
  return num.toLocaleString("en-US", { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 2 
  });
}

/** تنسيق السعر مع رمز العملة */
function formatPrice(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  const num = Number(n);
  if (!Number.isFinite(num)) return "—";
  // يمكنك تغيير SAR لأي عملة تريدها
  return `${num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ر.س`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   🔥 StatCard - الحل النهائي للأرقام المتقطعة
═══════════════════════════════════════════════════════════════════════════ */

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string; // ← مهم: string فقط وليس ReactNode
  hint?: string;
  loading?: boolean;
  isPrice?: boolean;
}

const StatCard = ({ icon: Icon, title, value, hint, loading, isPrice }: StatCardProps) => (
  <div
    className="relative bg-card rounded-2xl p-4 border border-border/50 
               shadow-sm hover:shadow-md hover:border-primary/20 
               transition-all duration-300 overflow-hidden"
  >
    {/* Background decoration */}
    <div 
      className="absolute -top-6 -end-6 w-20 h-20 rounded-full 
                 bg-gradient-to-br from-primary/10 to-transparent"
      aria-hidden="true"
    />
    
    <div className="relative flex items-start gap-3">
      {/* Icon */}
      <div className="shrink-0 p-2.5 rounded-xl bg-primary/10">
        <Icon className="w-5 h-5 text-primary" strokeWidth={1.8} />
      </div>
      
      {/* Content - الجزء المهم */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <p className="text-xs font-medium text-muted-foreground mb-1">
          {title}
        </p>
        
        {/* Value - 🔥 الحل الجذري للأرقام المتقطعة */}
        {loading ? (
          <div className="h-7 w-24 bg-muted animate-pulse rounded" />
        ) : (
          <p 
            className="text-lg sm:text-xl font-bold text-foreground 
                       whitespace-nowrap overflow-hidden text-ellipsis
                       tabular-nums tracking-tight leading-none"
            dir="ltr" /* ← مهم جداً: يجبر الأرقام على LTR */
            title={value}
          >
            {value}
          </p>
        )}
        
        {/* Hint */}
        {hint && (
          <p className="text-[10px] text-muted-foreground/70 mt-1.5 leading-snug">
            {hint}
          </p>
        )}
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   Input Component
═══════════════════════════════════════════════════════════════════════════ */

interface InputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ElementType;
  type?: "text" | "number";
}

const Input = ({ label, placeholder, value, onChange, icon: Icon, type = "text" }: InputProps) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-foreground/80">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      )}
      <input
        type={type}
        inputMode={type === "number" ? "numeric" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`
          w-full rounded-xl border border-border bg-background 
          px-3 py-2.5 text-sm text-foreground
          placeholder:text-muted-foreground/50
          outline-none transition-all duration-200
          focus:ring-2 focus:ring-primary/20 focus:border-primary/40
          ${Icon ? "ps-9" : ""}
        `}
      />
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   Select Component
═══════════════════════════════════════════════════════════════════════════ */

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
}

const Select = ({ label, value, onChange, options }: SelectProps) => (
  <div className="space-y-1.5">
    {label && (
      <label className="block text-xs font-semibold text-foreground/80">
        {label}
      </label>
    )}
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full appearance-none rounded-xl border border-border bg-background 
          px-3 py-2.5 pe-8 text-sm text-foreground
          outline-none transition-all duration-200
          focus:ring-2 focus:ring-primary/20 focus:border-primary/40
          cursor-pointer
        "
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute end-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   Car Card
═══════════════════════════════════════════════════════════════════════════ */

const CarCard = ({ car }: { car: MarketCar }) => {
  const img = car?.images?.[0] || car?.car?.images?.[0] || "/placeholder-car.jpg";
  const make = car?.make || car?.car?.make || "";
  const model = car?.model || car?.car?.model || "";
  const year = car?.year || car?.car?.year || "";
  const odometer = car?.odometer || car?.car?.odometer;
  const price = car?.evaluation_price ?? car?.car?.evaluation_price ?? car?.active_auction?.current_bid ?? 0;
  const id = car?.id || car?.car?.id;
  
  const title = [make, model, year].filter(Boolean).join(" ") || "سيارة";

  return (
    <div
      className="group flex flex-col rounded-2xl overflow-hidden bg-card 
                 border border-border/50 hover:border-primary/30 
                 shadow-sm hover:shadow-lg transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={img}
          alt={title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover 
                     transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder-car.jpg";
          }}
        />
        
        {/* Price Badge - أرقام ثابتة */}
        <div className="absolute bottom-2 start-2">
          <div 
            className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold
                       bg-white/95 dark:bg-black/80 backdrop-blur-sm shadow-md
                       whitespace-nowrap"
            dir="ltr"
          >
            {formatPrice(Number(price) || 0)}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3">
        <h3 
          className="text-sm font-bold text-foreground mb-2 line-clamp-1 
                     group-hover:text-primary transition-colors"
          title={title}
        >
          {title}
        </h3>
        
        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          {odometer && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap" dir="ltr">
              <Gauge className="w-3.5 h-3.5" />
              {Number(odometer).toLocaleString()} كم
            </span>
          )}
          {year && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {year}
            </span>
          )}
        </div>
        
        {/* Button */}
        <div className="mt-auto">
          {id ? (
            <LoadingLink href={`/carDetails/${id}`} className="block">
              <button 
                className="w-full flex items-center justify-center gap-1.5 
                           px-3 py-2 rounded-xl font-semibold text-xs
                           bg-primary text-primary-foreground 
                           hover:bg-primary/90 active:scale-[0.98]
                           transition-all duration-200"
              >
                <Eye className="w-3.5 h-3.5" />
                عرض التفاصيل
              </button>
            </LoadingLink>
          ) : (
            <button 
              disabled
              className="w-full px-3 py-2 rounded-xl font-semibold text-xs
                         bg-muted text-muted-foreground cursor-not-allowed"
            >
              غير متاح
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   Section Wrapper
═══════════════════════════════════════════════════════════════════════════ */

interface SectionProps {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

const Section = ({ icon: Icon, title, subtitle, action, children }: SectionProps) => (
  <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
    {/* Header */}
    <div className="flex items-center justify-between gap-3 p-4 border-b border-border/40 bg-muted/30">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
          <Icon className="w-4 h-4 text-primary" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-foreground truncate">{title}</h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
    
    {/* Content */}
    <div className="p-4">{children}</div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   Empty State
═══════════════════════════════════════════════════════════════════════════ */

const EmptyState = ({ 
  icon: Icon = List, 
  title, 
  description 
}: { 
  icon?: React.ElementType; 
  title: string; 
  description?: string;
}) => (
  <div className="flex flex-col items-center justify-center py-10 text-center">
    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
      <Icon className="w-7 h-7 text-muted-foreground/50" />
    </div>
    <p className="text-sm font-semibold text-foreground/80 mb-0.5">{title}</p>
    {description && (
      <p className="text-xs text-muted-foreground max-w-[200px]">{description}</p>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   Alert
═══════════════════════════════════════════════════════════════════════════ */

const Alert = ({ 
  variant = "info", 
  children 
}: { 
  variant?: "info" | "error" | "warning"; 
  children: ReactNode;
}) => {
  const styles = {
    info: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
    error: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
    warning: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200",
  };
  
  return (
    <div className={`rounded-xl p-3 border text-xs ${styles[variant]}`}>
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <p className="leading-relaxed">{children}</p>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   🚀 Main Page Component
═══════════════════════════════════════════════════════════════════════════ */

export default function SimilarPriceAnalysisPage() {
  // Form State
  const [q, setQ] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [odometerFrom, setOdometerFrom] = useState("");
  const [odometerTo, setOdometerTo] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [condition, setCondition] = useState("");
  const [auctionStatus, setAuctionStatus] = useState("");
  const [includeMine, setIncludeMine] = useState(true);

  // Results State
  const [stats, setStats] = useState<Stats | null>(null);
  const [cars, setCars] = useState<MarketCar[]>([]);
  const [meta, setMeta] = useState<ResultMeta | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  
  // UI State
  const [autoUpdating, setAutoUpdating] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  // Refs
  const seqRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  // Computed
  const canAnalyze = useMemo(() => {
    return [q, make, model, yearFrom, yearTo, odometerFrom, odometerTo, priceFrom, priceTo, condition, auctionStatus]
      .some(v => v.trim().length > 0);
  }, [q, make, model, yearFrom, yearTo, odometerFrom, odometerTo, priceFrom, priceTo, condition, auctionStatus]);

  const statsParams = useMemo(() => {
    const params: Record<string, any> = {
      q: q.trim() || undefined,
      make: make.trim() || undefined,
      model: model.trim() || undefined,
      year_from: numOrEmpty(yearFrom) || undefined,
      year_to: numOrEmpty(yearTo) || undefined,
      odometer_from: numOrEmpty(odometerFrom) || undefined,
      odometer_to: numOrEmpty(odometerTo) || undefined,
      price_from: numOrEmpty(priceFrom) || undefined,
      price_to: numOrEmpty(priceTo) || undefined,
      condition: condition || undefined,
      auction_status: auctionStatus || undefined,
      include_mine: includeMine ? true : undefined,
    };
    Object.keys(params).forEach(k => params[k] === undefined && delete params[k]);
    return params;
  }, [q, make, model, yearFrom, yearTo, odometerFrom, odometerTo, priceFrom, priceTo, condition, auctionStatus, includeMine]);

  const carsParams = useCallback(
    (pageNum: number) => ({
      ...statsParams,
      per_page: perPage,
      page: pageNum,
      sort_by: "created_at",
      sort_dir: "desc",
    }),
    [statsParams, perPage]
  );

  const statsKey = useMemo(() => JSON.stringify(statsParams), [statsParams]);
  const carsKey = useMemo(() => JSON.stringify({ ...statsParams, per_page: perPage }), [statsParams, perPage]);

  // Fetch Data
  const fetchData = useCallback(async () => {
    if (!canAnalyze) {
      setStats(null);
      setCars([]);
      setMeta(null);
      setError(null);
      setAutoUpdating(false);
      return;
    }

    const currentSeq = ++seqRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    setAutoUpdating(true);
    setPage(1);

    try {
      const [statsRes, carsRes] = await Promise.all([
        api.get("/api/market/explorer/cars/stats", {
          params: statsParams,
          signal: controller.signal as any,
        }),
        api.get("/api/market/explorer/cars", {
          params: carsParams(1),
          signal: controller.signal as any,
        }),
      ]);

      if (seqRef.current !== currentSeq) return;

      const sp = statsRes?.data?.stats;
      setStats(sp ? {
        count: Number(sp.count || 0),
        avg_price: sp.avg_price === null ? null : Number(sp.avg_price),
        min_price: sp.min_price === null ? null : Number(sp.min_price),
        max_price: sp.max_price === null ? null : Number(sp.max_price),
        median_price: sp.median_price === null ? null : Number(sp.median_price),
        mode: sp.mode,
      } : null);

      const list = carsRes?.data?.data?.data ?? carsRes?.data?.data ?? [];
      setCars(Array.isArray(list) ? list : []);

      setMeta({
        fallback: Boolean(carsRes?.data?.fallback),
        mode: carsRes?.data?.mode,
        message: carsRes?.data?.message,
        resolved: carsRes?.data?.resolved,
      });
    } catch (e: any) {
      if (controller.signal.aborted) return;
      setStats(null);
      setCars([]);
      setMeta(null);
      setError(e?.response?.data?.message || "تعذر جلب البيانات");
    } finally {
      if (seqRef.current === currentSeq) {
        setAutoUpdating(false);
      }
    }
  }, [canAnalyze, statsParams, carsParams]);

  useEffect(() => {
    if (!canAnalyze) {
      setStats(null);
      setCars([]);
      setMeta(null);
      setError(null);
      setAutoUpdating(false);
      return;
    }
    const t = setTimeout(fetchData, 400);
    return () => clearTimeout(t);
  }, [canAnalyze, statsKey, carsKey, fetchData]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    setError(null);
    try {
      const nextPage = page + 1;
      const res = await api.get("/api/market/explorer/cars", { params: carsParams(nextPage) });
      const list = res?.data?.data?.data ?? res?.data?.data ?? [];
      setCars(prev => [...prev, ...(Array.isArray(list) ? list : [])]);
      setPage(nextPage);
    } catch (e: any) {
      setError(e?.response?.data?.message || "تعذر تحميل المزيد");
    } finally {
      setLoadingMore(false);
    }
  }, [carsParams, page]);

  const resetForm = () => {
    abortRef.current?.abort();
    setQ(""); setMake(""); setModel("");
    setYearFrom(""); setYearTo("");
    setOdometerFrom(""); setOdometerTo("");
    setPriceFrom(""); setPriceTo("");
    setCondition(""); setAuctionStatus("");
    setIncludeMine(true);
    setStats(null); setCars([]); setMeta(null);
    setPage(1); setError(null); setAutoUpdating(false);
  };

  const activeFilters = [q, make, model, yearFrom, yearTo, odometerFrom, odometerTo, priceFrom, priceTo, condition, auctionStatus]
    .filter(v => v.trim()).length;

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-7xl">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-4 overflow-x-auto">
          <LoadingLink href="/" className="hover:text-primary transition-colors shrink-0">
            الرئيسية
          </LoadingLink>
          <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
          <span className="shrink-0">أدوات</span>
          <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
          <span className="text-foreground font-medium shrink-0">تحليل الأسعار</span>
        </nav>

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10">
              <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                تحليل الأسعار المشابهة
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                يتم التحديث تلقائيًا عند تغيير الفلاتر
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {autoUpdating && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span className="hidden sm:inline">جاري التحديث...</span>
              </div>
            )}
            <button
              onClick={resetForm}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border 
                         bg-card hover:bg-accent text-xs font-medium transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>إعادة ضبط</span>
            </button>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          
          {/* ═══════════════════════════════════════════════════════════════
              SIDEBAR - Filters
          ═══════════════════════════════════════════════════════════════ */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="lg:sticky lg:top-4">
              <Section
                icon={SlidersHorizontal}
                title="الفلاتر"
                subtitle={activeFilters > 0 ? `${activeFilters} فلتر نشط` : undefined}
                action={
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden p-1.5 rounded-lg hover:bg-accent transition-colors"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
                  </button>
                }
              >
                <div className={`space-y-4 ${showFilters ? "block" : "hidden lg:block"}`}>
                  <Input label="بحث عام" placeholder="Toyota / أبيض..." value={q} onChange={setQ} icon={Search} />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="الماركة" placeholder="Toyota" value={make} onChange={setMake} icon={Car} />
                    <Input label="الموديل" placeholder="Camry" value={model} onChange={setModel} icon={Car} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input label="سنة من" placeholder="2018" value={yearFrom} onChange={setYearFrom} type="number" icon={Calendar} />
                    <Input label="سنة إلى" placeholder="2024" value={yearTo} onChange={setYearTo} type="number" icon={Calendar} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input label="ممشى من" placeholder="0" value={odometerFrom} onChange={setOdometerFrom} type="number" icon={Gauge} />
                    <Input label="ممشى إلى" placeholder="120000" value={odometerTo} onChange={setOdometerTo} type="number" icon={Gauge} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input label="سعر من" placeholder="20000" value={priceFrom} onChange={setPriceFrom} type="number" icon={DollarSign} />
                    <Input label="سعر إلى" placeholder="50000" value={priceTo} onChange={setPriceTo} type="number" icon={DollarSign} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="الحالة"
                      value={condition}
                      onChange={setCondition}
                      options={[
                        { label: "الكل", value: "" },
                        { label: "ممتازة", value: "excellent" },
                        { label: "جيدة جداً", value: "very_good" },
                        { label: "جيدة", value: "good" },
                        { label: "مقبولة", value: "fair" },
                        { label: "تحتاج إصلاح", value: "needs_repair" },
                      ]}
                    />
                    <Select
                      label="حالة المزاد"
                      value={auctionStatus}
                      onChange={setAuctionStatus}
                      options={[
                        { label: "الكل", value: "" },
                        { label: "في المزاد", value: "in_auction" },
                        { label: "مباعة", value: "sold" },
                        { label: "معلقة", value: "pending" },
                        { label: "مؤرشفة", value: "archived" },
                      ]}
                    />
                  </div>

                  {error && <Alert variant="error">{error}</Alert>}
                  {!canAnalyze && <Alert variant="info">أدخل فلتر للبدء</Alert>}
                </div>
              </Section>
            </div>
          </aside>

          {/* ═══════════════════════════════════════════════════════════════
              MAIN CONTENT
          ═══════════════════════════════════════════════════════════════ */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-4">
            
            {/* ─────────────────────────────────────────────────────────────
                STATS SECTION - 🔥 الأرقام المصلحة
            ───────────────────────────────────────────────────────────── */}
            <Section
              icon={TrendingUp}
              title="نتائج التحليل"
              subtitle={stats ? `${formatNum(stats.count)} نتيجة` : undefined}
            >
              {!stats && !autoUpdating ? (
                <EmptyState
                  icon={TrendingUp}
                  title="لا توجد بيانات"
                  description="أدخل فلتر لبدء التحليل"
                />
              ) : (
                <div className="space-y-4">
                  {meta?.message && <Alert variant="info">{meta.message}</Alert>}

                  {/* 🔥 Stats Grid - الحل النهائي */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <StatCard
                      icon={Hash}
                      title="عدد النتائج"
                      value={formatNum(stats?.count)}
                      loading={autoUpdating}
                    />
                    <StatCard
                      icon={TrendingUp}
                      title="متوسط السعر"
                      value={formatPrice(stats?.avg_price)}
                      loading={autoUpdating}
                      isPrice
                    />
                    <StatCard
                      icon={Award}
                      title="الوسيط"
                      value={formatPrice(stats?.median_price)}
                      hint="مفيد عند وجود قيم شاذة"
                      loading={autoUpdating}
                      isPrice
                    />
                    <StatCard
                      icon={ArrowDownLeft}
                      title="أقل سعر"
                      value={formatPrice(stats?.min_price)}
                      loading={autoUpdating}
                      isPrice
                    />
                    <StatCard
                      icon={ArrowUpRight}
                      title="أعلى سعر"
                      value={formatPrice(stats?.max_price)}
                      loading={autoUpdating}
                      isPrice
                    />
                  </div>

                  {stats?.count === 0 && (
                    <Alert variant="warning">لا تتوفر بيانات لهذه الفلاتر</Alert>
                  )}
                </div>
              )}
            </Section>

            {/* ─────────────────────────────────────────────────────────────
                CARS SECTION
            ───────────────────────────────────────────────────────────── */}
            <Section
              icon={Car}
              title="السيارات"
              action={
                <div className="w-24">
                  <Select
                    label=""
                    value={String(perPage)}
                    onChange={(v) => setPerPage(Number(v))}
                    options={[
                      { label: "12", value: "12" },
                      { label: "24", value: "24" },
                      { label: "48", value: "48" },
                    ]}
                  />
                </div>
              }
            >
              {autoUpdating ? (
                <div className="flex flex-col items-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                  <p className="text-xs text-muted-foreground">جاري التحميل...</p>
                </div>
              ) : cars.length === 0 ? (
                <EmptyState
                  icon={canAnalyze ? Car : Filter}
                  title={canAnalyze ? "لا توجد سيارات" : "أدخل فلتر للبدء"}
                  description={canAnalyze ? "لا توجد نتائج مطابقة" : "ستظهر النتائج تلقائيًا"}
                />
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {cars.map((car, idx) => (
                      <CarCard key={car?.id || idx} car={car} />
                    ))}
                  </div>

                  <div className="flex justify-center pt-2">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl 
                                 font-semibold text-sm bg-primary text-primary-foreground
                                 hover:bg-primary/90 disabled:opacity-60 
                                 transition-all active:scale-[0.98]"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          جاري التحميل...
                        </>
                      ) : (
                        <>
                          <ArrowDownLeft className="w-4 h-4" />
                          تحميل المزيد
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </Section>
          </main>
        </div>
      </div>
    </div>
  );
}

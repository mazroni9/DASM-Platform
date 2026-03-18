"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Header } from "../../../components/exhibitor/Header";
import { Sidebar } from "../../../components/exhibitor/sidebar";
import { FiMenu } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Car as CarIcon,
  Gauge,
  Calendar,
  Layers,
  Eye,
  X,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

/* =========================
   Types (Laravel Resource + Paginator)
========================= */
type PaginatorMeta = {
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
};

type ResourceCollection<T> = {
  success?: boolean;
  data: T[];
  meta?: Partial<PaginatorMeta>;
  links?: any;
  current_page?: number;
  per_page?: number;
  last_page?: number;
  total?: number;
};

type ResourceItem<T> = {
  success?: boolean;
  data: T;
};

type MarketCar = {
  id: number;
  make: string | null;
  model: string | null;
  year: number | null;

  color?: string | null;
  engine?: string | null;
  transmission?: string | null;
  odometer?: number | null;
  condition?: string | null;

  evaluation_price?: number | null;
  auction_status?: string | null;

  created_at?: string | null;
  dealer_label?: string | null;

  description?: string | null;

  // in case backend returns nested relations
  dealer?: any;
  user?: any;
};

/* =========================
   Helpers
========================= */
const fmtInt = (n?: number | null) =>
  typeof n === "number" && Number.isFinite(n)
    ? new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(n)
    : "—";

const fmtMoney = (n?: number | null) =>
  typeof n === "number" && Number.isFinite(n)
    ? new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(n)
    : "—";

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("ar-SA") : "—";

const pickUserDisplay = (u: any): string | null => {
  if (!u) return null;
  return (
    u.full_name ??
    u.name ??
    u.username ??
    u.email ??
    u.phone ??
    (typeof u.id === "number" ? `#${u.id}` : null)
  );
};

const normalizeCar = (raw: any): MarketCar => {
  const r = raw ?? {};
  const dealerLabel =
    r.dealer_label ??
    r.dealerLabel ??
    r.dealer?.label ??
    r.dealer?.name ??
    pickUserDisplay(r.dealer?.user) ??
    pickUserDisplay(r.user) ??
    null;

  return {
    id: Number(r.id),
    make: r.make ?? null,
    model: r.model ?? null,
    year: r.year != null ? Number(r.year) : null,

    color: r.color ?? null,
    engine: r.engine ?? null,
    transmission: r.transmission ?? null,
    odometer: r.odometer != null ? Number(r.odometer) : null,
    condition: r.condition ?? null,

    evaluation_price:
      r.evaluation_price != null ? Number(r.evaluation_price) : null,
    auction_status: r.auction_status ?? null,

    created_at: r.created_at ?? r.createdAt ?? null,
    dealer_label: dealerLabel,

    description: r.description ?? null,

    dealer: r.dealer,
    user: r.user,
  };
};

const parseMeta = (
  payload: any,
  fallbackPage: number,
  fallbackPerPage: number
): PaginatorMeta => {
  const m = payload?.meta ?? {};
  const current_page =
    Number(m.current_page ?? payload?.current_page ?? fallbackPage) || fallbackPage;
  const per_page =
    Number(m.per_page ?? payload?.per_page ?? fallbackPerPage) || fallbackPerPage;
  const last_page =
    Number(m.last_page ?? payload?.last_page ?? 1) || 1;
  const total =
    Number(m.total ?? payload?.total ?? (Array.isArray(payload?.data) ? payload.data.length : 0)) ||
    0;

  return { current_page, per_page, last_page, total };
};

/* =========================
   Small UI helper
========================= */
function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-muted/40 border border-border px-3 py-2 flex items-center justify-between gap-2 min-w-0">
      <span className="text-muted-foreground text-xs sm:text-sm shrink-0">
        {label}
      </span>
      <span className="text-foreground text-xs sm:text-sm break-words text-left min-w-0">
        {children}
      </span>
    </div>
  );
}

/* =========================
   Page
========================= */
export default function ExhibitorCarsDataPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // ===== Filters
  const [q, setQ] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [odoFrom, setOdoFrom] = useState("");
  const [odoTo, setOdoTo] = useState("");
  const [condition, setCondition] = useState("");
  const [auctionStatus, setAuctionStatus] = useState("");
  const [includeMine, setIncludeMine] = useState(true);

  const [perPage, setPerPage] = useState(12);
  const [sortBy, setSortBy] = useState<
    "created_at" | "year" | "odometer" | "evaluation_price"
  >("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // ===== Data
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<PaginatorMeta>({
    current_page: 1,
    per_page: 12,
    last_page: 1,
    total: 0,
  });
  const [cars, setCars] = useState<MarketCar[]>([]);

  // Details modal
  const [selected, setSelected] = useState<MarketCar | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => setIsClient(true), []);

  const buildParams = useCallback(
    (page: number, overrides?: Partial<Record<string, any>>) => {
      const params: Record<string, any> = {
        per_page: perPage,
        page,
        sort_by: sortBy,
        sort_dir: sortDir,
        include_mine: includeMine ? 1 : 0,
        ...overrides,
      };

      const add = (key: string, val: any) => {
        if (val === undefined || val === null) return;
        const s = String(val).trim();
        if (s) params[key] = s;
      };

      add("q", q);
      add("make", make);
      add("model", model);

      add("year_from", yearFrom);
      add("year_to", yearTo);

      add("price_from", priceFrom);
      add("price_to", priceTo);

      add("odometer_from", odoFrom);
      add("odometer_to", odoTo);

      add("condition", condition);
      add("auction_status", auctionStatus);

      return params;
    },
    [
      perPage,
      sortBy,
      sortDir,
      includeMine,
      q,
      make,
      model,
      yearFrom,
      yearTo,
      priceFrom,
      priceTo,
      odoFrom,
      odoTo,
      condition,
      auctionStatus,
    ]
  );

  const fetchCars = useCallback(
    async (page = 1, overrides?: Partial<Record<string, any>>) => {
      setLoading(true);
      try {
        const { data } = await api.get<ResourceCollection<any>>(
          "/api/exhibitor/market/cars",
          { params: buildParams(page, overrides) }
        );

        const listRaw = Array.isArray(data?.data) ? data.data : [];
        const list = listRaw.map(normalizeCar);

        setCars(list);
        setMeta(parseMeta(data, page, perPage));
      } catch (e: any) {
        console.error(e);
        toast.error("تعذّر تحميل السيارات");
        setCars([]);
        setMeta({
          current_page: 1,
          per_page: perPage,
          last_page: 1,
          total: 0,
        });
      } finally {
        setLoading(false);
      }
    },
    [buildParams, perPage]
  );

  const openDetails = useCallback(async (car: MarketCar) => {
    setSelected(car);
    setLoadingDetails(true);
    try {
      const { data } = await api.get<ResourceItem<any>>(
        `/api/exhibitor/market/cars/${car.id}`
      );
      if (data?.data) setSelected(normalizeCar(data.data));
    } catch (e) {
      console.error(e);
      // نكتفي بالبيانات الحالية
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  const applyFilters = useCallback(() => {
    fetchCars(1);
  }, [fetchCars]);

  const resetFilters = useCallback(() => {
    setQ("");
    setMake("");
    setModel("");
    setYearFrom("");
    setYearTo("");
    setPriceFrom("");
    setPriceTo("");
    setOdoFrom("");
    setOdoTo("");
    setCondition("");
    setAuctionStatus("");
    setSortBy("created_at");
    setSortDir("desc");
    setPerPage(12);
    // includeMine يظل كما هو حسب طلبك
    fetchCars(1, {
      q: "",
      make: "",
      model: "",
      year_from: "",
      year_to: "",
      price_from: "",
      price_to: "",
      odometer_from: "",
      odometer_to: "",
      condition: "",
      auction_status: "",
      sort_by: "created_at",
      sort_dir: "desc",
      per_page: 12,
    });
  }, [fetchCars]);

  const refresh = useCallback(() => {
    fetchCars(meta.current_page || 1);
  }, [fetchCars, meta.current_page]);

  const prevPage = useCallback(() => {
    if (meta.current_page <= 1) return;
    fetchCars(meta.current_page - 1);
  }, [fetchCars, meta.current_page]);

  const nextPage = useCallback(() => {
    if (meta.current_page >= meta.last_page) return;
    fetchCars(meta.current_page + 1);
  }, [fetchCars, meta.current_page, meta.last_page]);

  // First load
  useEffect(() => {
    if (!isClient) return;
    fetchCars(1);
  }, [isClient, fetchCars]);

  // Auto refresh for include/perPage/sort changes (server-side)
  useEffect(() => {
    if (!isClient) return;
    fetchCars(1);
  }, [includeMine, perPage, sortBy, sortDir, isClient, fetchCars]);

  const hasPagination = useMemo(
    () => !loading && meta.last_page > 1,
    [loading, meta.last_page]
  );

  /* -------------------------
     Skeleton
  ------------------------- */
  if (!isClient) {
    return (
      <div dir="rtl" className="flex min-h-screen bg-background overflow-x-hidden">
        <div className="hidden md:block w-72 bg-card border-l border-border animate-pulse" />
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-card border-b border-border animate-pulse" />
          <main className="p-6 flex-1 bg-background" />
        </div>
      </div>
    );
  }

  /* -------------------------
     UI (Light, no dark styling, no page overflow)
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
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="إغلاق القائمة"
            />
            <motion.div className="relative w-72 ml-auto h-full bg-background border-l border-border shadow-2xl">
              <Sidebar />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col w-0">
        <Header />

        <main className="flex-1">
          <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 py-4 md:py-6">
            {/* Title + Actions */}
            <div className="mb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  قاعدة بيانات السيارات (سوق المعارض)
                </h1>
              
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={refresh}
                  className="h-11 inline-flex items-center gap-2 px-3 rounded-lg border border-border hover:bg-muted"
                >
                  <RefreshCw className="w-4 h-4" />
                  تحديث
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="rounded-2xl border border-border bg-card p-4 md:p-5 mb-5 overflow-hidden">
              {/* Row: Search */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                <div className="lg:col-span-6 min-w-0">
                  <label className="block text-xs text-muted-foreground mb-1">
                    بحث عام
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                      placeholder="الماركة / الموديل / اللون / الوصف..."
                      className="w-full h-11 pr-9 pl-3 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-xs text-muted-foreground mb-1">
                    الماركة
                  </label>
                  <input
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="مثال: Toyota"
                    className="w-full h-11 px-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-xs text-muted-foreground mb-1">
                    الموديل
                  </label>
                  <input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="مثال: Camry"
                    className="w-full h-11 px-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Row: Year / Price / Odo */}
              <div className="mt-3 grid grid-cols-1 lg:grid-cols-12 gap-3">
                <div className="lg:col-span-3">
                  <label className="block text-xs text-muted-foreground mb-1">
                    السنة (من / إلى)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={yearFrom}
                      onChange={(e) => setYearFrom(e.target.value)}
                      placeholder="من"
                      className="h-11 px-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      value={yearTo}
                      onChange={(e) => setYearTo(e.target.value)}
                      placeholder="إلى"
                      className="h-11 px-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-xs text-muted-foreground mb-1">
                    السعر المرجعي (من / إلى)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={priceFrom}
                      onChange={(e) => setPriceFrom(e.target.value)}
                      placeholder="من"
                      className="h-11 px-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      value={priceTo}
                      onChange={(e) => setPriceTo(e.target.value)}
                      placeholder="إلى"
                      className="h-11 px-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-xs text-muted-foreground mb-1">
                    العداد (من / إلى)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={odoFrom}
                      onChange={(e) => setOdoFrom(e.target.value)}
                      placeholder="من"
                      className="h-11 px-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      value={odoTo}
                      onChange={(e) => setOdoTo(e.target.value)}
                      placeholder="إلى"
                      className="h-11 px-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-xs text-muted-foreground mb-1">
                    الحالة / حالة المزاد
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      placeholder="الحالة"
                      className="h-11 px-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <input
                      value={auctionStatus}
                      onChange={(e) => setAuctionStatus(e.target.value)}
                      placeholder="المزاد"
                      className="h-11 px-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
              </div>

              {/* Row: include / perPage / sort / actions */}
              <div className="mt-3 grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
                <div className="lg:col-span-4 grid grid-cols-2 gap-2">
                  <label className="h-11 inline-flex items-center gap-2 px-3 rounded-lg bg-background border border-border cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeMine}
                      onChange={(e) => setIncludeMine(e.target.checked)}
                      className="accent-primary"
                    />
                    <span className="text-sm">تضمين سيارتي</span>
                  </label>

                  <select
                    value={perPage}
                    onChange={(e) => setPerPage(parseInt(e.target.value) || 12)}
                    className="h-11 px-3 rounded-lg bg-background border border-border text-foreground"
                    title="لكل صفحة"
                  >
                    <option value={8}>8 / صفحة</option>
                    <option value={12}>12 / صفحة</option>
                    <option value={16}>16 / صفحة</option>
                    <option value={24}>24 / صفحة</option>
                  </select>
                </div>

                <div className="lg:col-span-4 grid grid-cols-2 gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="h-11 px-3 rounded-lg bg-background border border-border text-foreground"
                  >
                    <option value="created_at">الأحدث</option>
                    <option value="evaluation_price">السعر</option>
                    <option value="year">السنة</option>
                    <option value="odometer">العداد</option>
                  </select>

                  <select
                    value={sortDir}
                    onChange={(e) => setSortDir(e.target.value as any)}
                    className="h-11 px-3 rounded-lg bg-background border border-border text-foreground"
                  >
                    <option value="desc">تنازلي</option>
                    <option value="asc">تصاعدي</option>
                  </select>
                </div>

                <div className="lg:col-span-4 flex gap-2 lg:justify-end flex-wrap">
                  <button
                    onClick={applyFilters}
                    className="h-11 inline-flex items-center justify-center gap-2 px-4 rounded-lg border border-border hover:bg-muted"
                  >
                    <Filter className="w-4 h-4" />
                    تطبيق
                  </button>
                  <button
                    onClick={resetFilters}
                    className="h-11 inline-flex items-center justify-center gap-2 px-4 rounded-lg border border-border hover:bg-muted"
                  >
                    إعادة ضبط
                  </button>
                </div>
              </div>
            </div>

            {/* Results (Mobile Cards) */}
            <div className="md:hidden space-y-3">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-border bg-card p-4 animate-pulse"
                  >
                    <div className="h-4 w-2/3 bg-muted rounded" />
                    <div className="mt-3 h-3 w-1/2 bg-muted rounded" />
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="h-10 bg-muted rounded" />
                      <div className="h-10 bg-muted rounded" />
                    </div>
                  </div>
                ))
              ) : cars.length ? (
                cars.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-2xl border border-border bg-card p-4 overflow-hidden"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/40 border border-border shrink-0">
                        <CarIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold truncate">
                          {c.make || "—"} {c.model || ""}{" "}
                          {c.year ? `• ${c.year}` : ""}
                        </div>
                        {c.dealer_label && (
                          <div className="text-xs text-muted-foreground truncate mt-0.5">
                            {c.dealer_label}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => openDetails(c)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-border hover:bg-muted text-sm shrink-0"
                      >
                        <Eye className="w-4 h-4" />
                        تفاصيل
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <InfoRow label="السعر">
                        <span className="text-primary font-bold">
                          {fmtMoney(c.evaluation_price)}{" "}
                          <span className="text-xs text-muted-foreground">SAR</span>
                        </span>
                      </InfoRow>
                      <InfoRow label="العداد">
                        <span className="inline-flex items-center gap-1">
                          <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
                          {fmtInt(c.odometer)} كم
                        </span>
                      </InfoRow>
                      <InfoRow label="الحالة">{c.condition || "—"}</InfoRow>
                      <InfoRow label="المزاد">{c.auction_status || "—"}</InfoRow>
                      <InfoRow label="التاريخ">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          {fmtDate(c.created_at)}
                        </span>
                      </InfoRow>
                      <InfoRow label="اللون">{c.color || "—"}</InfoRow>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-border bg-card p-6 text-center text-muted-foreground">
                  لا توجد نتائج مطابقة
                </div>
              )}
            </div>

            {/* Results (Desktop Table) */}
            <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="min-w-[1100px] w-full table-auto text-sm">
                  <thead className="bg-muted/40 border-b border-border text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-right">#</th>
                      <th className="px-4 py-3 text-right">السيارة</th>
                      <th className="px-4 py-3 text-right">السعر المرجعي</th>
                      <th className="px-4 py-3 text-right">العداد</th>
                      <th className="px-4 py-3 text-right">الحالة</th>
                      <th className="px-4 py-3 text-right">ناقل الحركة</th>
                      <th className="px-4 py-3 text-right">المحرك</th>
                      <th className="px-4 py-3 text-right">اللون</th>
                      <th className="px-4 py-3 text-right">حالة المزاد</th>
                      <th className="px-4 py-3 text-right">تاريخ الإضافة</th>
                      <th className="px-4 py-3 text-right">إجراء</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {loading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          {Array.from({ length: 11 }).map((__, j) => (
                            <td key={j} className="px-4 py-3">
                              <div className="h-4 w-full bg-muted rounded" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : cars.length ? (
                      cars.map((c) => (
                        <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {c.id}
                          </td>

                          <td className="px-4 py-3 text-foreground">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted/40 border border-border shrink-0">
                                <CarIcon className="w-4 h-4 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold truncate">
                                  {c.make || "—"} {c.model || ""}{" "}
                                  {c.year ? `• ${c.year}` : ""}
                                </div>
                                {c.dealer_label && (
                                  <div className="text-[11px] text-muted-foreground truncate">
                                    {c.dealer_label}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-bold text-primary">
                              {fmtMoney(c.evaluation_price)}{" "}
                              <span className="text-xs text-muted-foreground">
                                SAR
                              </span>
                            </span>
                          </td>

                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            <span className="inline-flex items-center gap-1">
                              <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
                              {fmtInt(c.odometer)} كم
                            </span>
                          </td>

                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {c.condition || "—"}
                          </td>

                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {c.transmission || "—"}
                          </td>

                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {c.engine || "—"}
                          </td>

                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {c.color || "—"}
                          </td>

                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full bg-muted/40 border border-border inline-block">
                              {c.auction_status || "غير محدد"}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                              {fmtDate(c.created_at)}
                            </span>
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() => openDetails(c)}
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-border hover:bg-muted"
                            >
                              <Eye className="w-4 h-4" />
                              تفاصيل
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          className="px-4 py-10 text-center text-muted-foreground"
                          colSpan={11}
                        >
                          لا توجد نتائج مطابقة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {hasPagination && (
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-card p-3 text-sm overflow-hidden">
                <button
                  onClick={prevPage}
                  disabled={meta.current_page <= 1}
                  className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg border ${
                    meta.current_page <= 1
                      ? "border-border text-muted-foreground/60 cursor-not-allowed"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                  السابق
                </button>

                <div className="text-muted-foreground whitespace-nowrap">
                  صفحة{" "}
                  <span className="text-foreground font-semibold">
                    {meta.current_page}
                  </span>{" "}
                  من{" "}
                  <span className="text-foreground font-semibold">
                    {meta.last_page}
                  </span>{" "}
                  — إجمالي{" "}
                  <span className="text-foreground font-semibold">
                    {fmtInt(meta.total)}
                  </span>
                </div>

                <button
                  onClick={nextPage}
                  disabled={meta.current_page >= meta.last_page}
                  className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg border ${
                    meta.current_page >= meta.last_page
                      ? "border-border text-muted-foreground/60 cursor-not-allowed"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  التالي
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* FAB (Mobile) */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed bottom-6 right-6 bg-primary text-primary-foreground p-4 rounded-full shadow-xl z-40 hover:bg-primary/90 transition-all duration-200 flex items-center justify-center"
        aria-label="القائمة"
        title="القائمة"
      >
        <FiMenu size={22} />
      </button>

      {/* Details Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="w-full md:max-w-2xl bg-card border border-border rounded-2xl overflow-hidden mx-2 md:mx-0"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="min-w-0">
                  <div className="text-foreground font-semibold truncate">
                    {selected.make || "—"} {selected.model || ""}{" "}
                    {selected.year ? `• ${selected.year}` : ""}
                  </div>
                  {selected.dealer_label && (
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {selected.dealer_label}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelected(null)}
                  className="text-muted-foreground hover:text-foreground p-2 rounded-lg"
                  aria-label="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 md:p-5 overflow-hidden">
                <div className="h-36 rounded-xl mb-4 bg-muted/40 border border-border flex items-center justify-center">
                  <CarIcon className="w-10 h-10 text-primary/80" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <InfoRow label="السعر المرجعي">
                    <span className="text-primary font-bold">
                      {fmtMoney(selected.evaluation_price)}{" "}
                      <span className="text-xs text-muted-foreground">SAR</span>
                    </span>
                  </InfoRow>
                  <InfoRow label="العداد">{fmtInt(selected.odometer)} كم</InfoRow>
                  <InfoRow label="الحالة">{selected.condition || "—"}</InfoRow>
                  <InfoRow label="ناقل الحركة">
                    {selected.transmission || "—"}
                  </InfoRow>
                  <InfoRow label="المحرك">{selected.engine || "—"}</InfoRow>
                  <InfoRow label="اللون">{selected.color || "—"}</InfoRow>
                  <InfoRow label="تاريخ الإضافة">
                    {fmtDate(selected.created_at)}
                  </InfoRow>
                  <InfoRow label="حالة المزاد">
                    {selected.auction_status || "—"}
                  </InfoRow>
                </div>

                <div className="mt-4">
                  <div className="text-foreground text-sm mb-1">الوصف</div>
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap break-words">
                    {loadingDetails ? "جارِ التحميل…" : selected.description || "—"}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

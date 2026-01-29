"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import LoadingLink from "@/components/LoadingLink";
import AuctionCard from "@/components/AuctionCard";
import {
  ArrowLeft,
  Bus,
  RefreshCw,
  AlertCircle,
  Layers,
  Clock,
  Columns,
  ChevronDown,
  RotateCcw,
  X,
} from "lucide-react";
import axios from "@/lib/axios";

import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import PaginationItem from "@mui/material/PaginationItem";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

type CarItem = {
  id: number | string;
  make?: string;
  model?: string;
  year?: number | string;
  images?: string[] | string | null;

  status?: string | boolean;
  approved?: boolean;
  is_approved?: boolean;
  approval_status?: string;

  active_auction?: {
    id: number | string;
    current_price?: number | string;
    status?: string;
  } | null;

  activeAuction?: {
    id: number | string;
    current_price?: number | string;
    status?: string;
  } | null;

  auction_status?: string;
  active_status?: string;
  current_price?: number | string;
  auction_result?: any;
};

type PaginationInfo = {
  total: number;
  last_page: number;
  current_page?: number;
  per_page?: number;
};

const MARKET = "buses";

// ================= التحكم بعدد الأعمدة (Layout) + حفظ =================
const GRID_COLS_STORAGE_KEY = "buses_market_grid_cols_v1";

const GRID_OPTIONS: Array<{ value: 1 | 2 | 3 | 4; label: string }> = [
  { value: 1, label: "عمود واحد" },
  { value: 2, label: "عمودان" },
  { value: 3, label: "3 أعمدة" },
  { value: 4, label: "4 أعمدة" },
];

function loadSavedGridCols(): 1 | 2 | 3 | 4 {
  if (typeof window === "undefined") return 3;
  try {
    const raw = window.localStorage.getItem(GRID_COLS_STORAGE_KEY);
    const n = Number(raw);
    if (n === 1 || n === 2 || n === 3 || n === 4) return n;
    return 3;
  } catch {
    return 3;
  }
}

function saveGridCols(v: 1 | 2 | 3 | 4) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GRID_COLS_STORAGE_KEY, String(v));
  } catch {
    // ignore
  }
}

function toNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

const resolveMarketEndpoint = () => {
  try {
    const base = (axios as any).defaults?.baseURL ?? "";
    return String(base).endsWith("/api") ? "/market/cars" : "/api/market/cars";
  } catch {
    return "/api/market/cars";
  }
};

const isApproved = (it: CarItem) => {
  const v: any = it.status ?? it.approval_status ?? it.approved ?? it.is_approved;
  if (typeof v === "string") {
    const s = v.toLowerCase();
    return s === "approved" || s === "accept" || s === "accepted";
  }
  return Boolean(v);
};

const isActiveAuction = (it: CarItem) => {
  const s = (
    it.active_auction?.status ??
    it.activeAuction?.status ??
    it.auction_status ??
    it.active_status ??
    ""
  )
    .toString()
    .toLowerCase();

  return s === "active" || s === "on" || s === "running";
};

const firstImage = (images: CarItem["images"]) => {
  try {
    if (!images) return "/placeholder-car.jpg";
    if (Array.isArray(images)) return images[0] || "/placeholder-car.jpg";
    const str = String(images);

    if (str.trim().startsWith("[")) {
      const arr = JSON.parse(str);
      return Array.isArray(arr) && arr[0] ? arr[0] : "/placeholder-car.jpg";
    }

    return str || "/placeholder-car.jpg";
  } catch {
    return "/placeholder-car.jpg";
  }
};

const titleOf = (item: CarItem) => {
  const parts = [item.year, item.make, item.model].filter(Boolean);
  return parts.length ? parts.join(" - ") : "مركبة";
};

const priceOf = (item: CarItem) =>
  item.active_auction?.current_price ?? item.activeAuction?.current_price ?? item.current_price ?? null;

/**
 * يدعم أكثر من شكل للريسبونس:
 * - { status, data: [...], pagination: {...} }
 * - { status, data: { data: [...], pagination: {...} } }
 * - { status, data: paginator } (Laravel paginate)
 */
function extractListAndPagination(resData: any): { list: any[]; pagination: PaginationInfo } {
  const empty: PaginationInfo = { total: 0, last_page: 1, current_page: 1, per_page: 12 };

  const directList = resData?.data;
  const directPagination = resData?.pagination;

  const container = resData?.data;

  const list: any[] =
    Array.isArray(directList)
      ? directList
      : Array.isArray(container?.data)
      ? container.data
      : Array.isArray(container)
      ? container
      : [];

  const pg =
    directPagination && typeof directPagination === "object"
      ? directPagination
      : container?.pagination && typeof container.pagination === "object"
      ? container.pagination
      : container && typeof container === "object" && typeof container?.last_page !== "undefined"
      ? container
      : empty;

  const pagination: PaginationInfo = {
    total: toNumber(pg?.total, 0),
    last_page: Math.max(1, toNumber(pg?.last_page, 1)),
    current_page: toNumber(pg?.current_page, 1),
    per_page: toNumber(pg?.per_page, 12),
  };

  return { list, pagination };
}

function formatDateTime(d: Date) {
  try {
    return new Intl.DateTimeFormat("ar", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

export default function BusesMarketPage() {
  const [items, setItems] = useState<CarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    last_page: 1,
    current_page: 1,
    per_page: 12,
  });

  const [page, setPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ✅ التحكم بعدد أعمدة الشبكة + حفظ
  const [showColumns, setShowColumns] = useState(false);
  const [gridCols, setGridCols] = useState<1 | 2 | 3 | 4>(() => loadSavedGridCols());

  const setColsAndSave = (v: 1 | 2 | 3 | 4) => {
    setGridCols(v);
    saveGridCols(v);
  };

  const gridClassName = useMemo(() => {
    // نفس فكرة "التحكم بالأعمدة" لكن للـ cards grid
    switch (gridCols) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-1 sm:grid-cols-2";
      case 3:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      case 4:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
      default:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    }
  }, [gridCols]);

  const fetchMarketCars = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(true);
        setErr(null);

        const endpoint = resolveMarketEndpoint();

        const res = await axios.get(endpoint, {
          params: { market: MARKET, per_page: 12, page },
          headers: { Accept: "application/json; charset=UTF-8" },
          signal: signal as any,
        });

        const { list, pagination: pg } = extractListAndPagination(res.data);

        // ✅ نفس الفلترة (بدون تغيير ربط الباك اند)
        const filtered = (list as CarItem[]).filter((it) => isApproved(it) && isActiveAuction(it));

        setItems(filtered);
        setPagination(pg);
        setLastUpdated(new Date());
      } catch (e: any) {
        if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
        setErr(e?.message || "تعذر جلب بيانات السوق");
        setItems([]);
        setPagination({ total: 0, last_page: 1, current_page: 1, per_page: 12 });
      } finally {
        setLoading(false);
      }
    },
    [page]
  );

  useEffect(() => {
    const ctrl = new AbortController();
    fetchMarketCars(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchMarketCars]);

  const showPagination = useMemo(() => {
    return !loading && (pagination?.last_page ?? 1) > 1;
  }, [loading, pagination]);

  const shownCount = useMemo(() => items.length, [items]);

  const onRefresh = () => {
    const ctrl = new AbortController();
    fetchMarketCars(ctrl.signal);
  };

  const resetColumns = () => {
    setColsAndSave(3);
    setShowColumns(false);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      {/* خلفية موحدة */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-background to-background" />
      <div className="absolute inset-0 -z-10 opacity-40 [background:radial-gradient(70%_55%_at_50%_0%,hsl(var(--primary)/0.18),transparent_70%)]" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-8">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <LoadingLink
            href="/auctions"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors px-4 py-2 text-sm rounded-full border border-primary/20 bg-primary/10 hover:bg-primary/15"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            العودة إلى المزادات
          </LoadingLink>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowColumns((v) => !v)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:bg-muted transition"
              title="التحكم بالأعمدة"
            >
              <Columns className="w-4 h-4" />
              <span className="text-xs">الأعمدة</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showColumns ? "rotate-180" : ""}`} />
            </button>

            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:bg-muted transition"
              title="تحديث"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="text-xs">تحديث</span>
            </button>
          </div>
        </div>

        {/* ✅ Panel: التحكم بالأعمدة (Grid Layout) */}
        {showColumns && (
          <div className="bg-card/70 backdrop-blur-xl border border-border rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm text-foreground/80">
                اختر عدد الأعمدة لعرض البطاقات (يتم الحفظ تلقائيًا).
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetColumns}
                  className="px-3 py-2 text-sm rounded-xl border border-border hover:bg-muted transition inline-flex items-center gap-2"
                  title="إعادة افتراضي"
                >
                  <RotateCcw className="w-4 h-4" />
                  افتراضي
                </button>
                <button
                  onClick={() => setShowColumns(false)}
                  className="px-3 py-2 text-sm rounded-xl border border-border hover:bg-muted transition inline-flex items-center gap-2"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                  إغلاق
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GRID_OPTIONS.map((opt) => {
                const active = gridCols === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setColsAndSave(opt.value);
                      setShowColumns(false);
                    }}
                    className={`px-3 py-3 rounded-2xl border text-sm transition ${
                      active
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-background/60 hover:bg-muted text-foreground/80"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Hero */}
        <div className="bg-card/70 backdrop-blur-xl border border-border rounded-3xl p-6 md:p-8 shadow-sm overflow-hidden relative">
          <div className="absolute inset-0 opacity-30 pointer-events-none [background:radial-gradient(60%_60%_at_20%_10%,hsl(var(--primary)/0.25),transparent_65%)]" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 text-xs font-semibold w-fit">
              <Bus className="w-4 h-4" />
              سوق الحافلات
            </div>

            <h1 className="mt-3 text-2xl md:text-3xl font-bold text-foreground">سوق الحافلات</h1>

            <p className="mt-2 text-sm md:text-base text-muted-foreground leading-relaxed max-w-3xl">
              اكتشف الحافلات المتاحة واطّلع على التفاصيل لاختيار الأنسب لاحتياجك.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-background/60 border border-border text-xs text-muted-foreground">
                <Layers className="w-4 h-4 text-primary" />
                <span>
                  المعروض:{" "}
                  <span className="font-semibold text-foreground">{loading ? "—" : shownCount}</span>
                </span>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-background/60 border border-border text-xs text-muted-foreground">
                <span>
                  الصفحة <span className="font-semibold text-foreground">{page}</span>
                  {" / "}
                  <span className="font-semibold text-foreground">{pagination.last_page || 1}</span>
                </span>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-background/60 border border-border text-xs text-muted-foreground">
                <Clock className="w-4 h-4 text-primary" />
                <span>
                  آخر تحديث:{" "}
                  <span className="font-semibold text-foreground">
                    {lastUpdated ? formatDateTime(lastUpdated) : "—"}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {err && (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold text-foreground">حدث خطأ</div>
              <div className="text-muted-foreground mt-1">{err}</div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-card/60 backdrop-blur-xl border border-border rounded-3xl shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 border-b border-border/70 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-foreground">الحافلات المتاحة</h2>
              <p className="text-sm text-muted-foreground mt-1">تصفح القائمة واختر ما يناسبك.</p>
            </div>

            {!loading && (
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-background/60 border border-border text-xs text-muted-foreground">
                <span>
                  إجمالي النتائج:{" "}
                  <span className="font-semibold text-foreground">{pagination.total}</span>
                </span>
              </div>
            )}
          </div>

          <div className="p-5 md:p-6">
            {loading ? (
              <div className="rounded-3xl border border-border bg-background/60 p-10 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Bus className="w-7 h-7 text-primary animate-pulse" />
                </div>
                <div className="text-sm text-muted-foreground">جاري تحميل الحافلات المتاحة...</div>
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-3xl border border-border bg-background/60 p-10 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Bus className="w-7 h-7 text-primary" />
                </div>
                <div className="text-lg font-bold text-foreground">لا توجد حافلات متاحة حالياً</div>
                <div className="text-sm text-muted-foreground mt-2">جرّب التحديث أو عد لاحقًا.</div>
              </div>
            ) : (
              <div className={`grid ${gridClassName} gap-6`}>
                {items.map((it) => {
                  const cardProps: any = {
                    title: titleOf(it),
                    image: firstImage(it.images),
                    current_price: priceOf(it),
                    auction_result: it.auction_result ?? null,
                    id: it.id,
                  };
                  return <AuctionCard key={String(it.id)} {...cardProps} />;
                })}
              </div>
            )}

            {showPagination && (
              <Stack dir="rtl" spacing={2} className="mt-10 flex justify-center">
                <Pagination
                  className="flex justify-center"
                  dir="rtl"
                  count={pagination.last_page}
                  page={page}
                  variant="outlined"
                  color="primary"
                  renderItem={(item) => (
                    <PaginationItem
                      slots={{
                        previous: NavigateNextIcon,
                        next: NavigateBeforeIcon,
                      }}
                      {...item}
                    />
                  )}
                  onChange={(_, newPage) => setPage(newPage)}
                />
              </Stack>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

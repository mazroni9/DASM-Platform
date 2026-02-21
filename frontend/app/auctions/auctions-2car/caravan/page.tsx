"use client";

import React, { useEffect, useMemo, useState } from "react";
import LoadingLink from "@/components/LoadingLink";
import CaravanCard from "@/components/CaravanCard";
import api from "@/lib/axios";

import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import PaginationItem from "@mui/material/PaginationItem";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

import {
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Caravan,
  Clock,
  Columns,
  ChevronDown,
  RotateCcw,
  X,
} from "lucide-react";

type PaginationInfo = {
  total: number;
  last_page: number;
  current_page?: number;
  per_page?: number;
};

// ================= التحكم بعدد الأعمدة (Layout) + حفظ =================
const GRID_COLS_STORAGE_KEY = "caravan_market_grid_cols_v1";

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

/**
 * يدعم أكثر من شكل للريسبونس:
 * 1) { status, data: [...], pagination: {...} }
 * 2) { status, data: { data: [...], pagination: {...} } }
 * 3) { status, data: paginator }
 */
function extractCarsAndPagination(resData: any): {
  cars: any[];
  pagination: PaginationInfo;
} {
  const empty: PaginationInfo = {
    total: 0,
    last_page: 1,
    current_page: 1,
    per_page: 10,
  };

  const directCars = resData?.data;
  const directPagination = resData?.pagination;

  const container = resData?.data;

  const carsArray: any[] =
    Array.isArray(directCars)
      ? directCars
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
      : container &&
        typeof container === "object" &&
        typeof container?.last_page !== "undefined"
      ? container
      : empty;

  const pagination: PaginationInfo = {
    total: toNumber(pg?.total, 0),
    last_page: Math.max(1, toNumber(pg?.last_page, 1)),
    current_page: toNumber(pg?.current_page, 1),
    per_page: toNumber(pg?.per_page, 10),
  };

  return { cars: carsArray, pagination };
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

function SectionShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card/60 backdrop-blur-xl border border-border rounded-3xl shadow-sm overflow-hidden">
      <div className="p-5 md:p-6 border-b border-border/70">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-foreground">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 md:p-6">{children}</div>
    </div>
  );
}

export default function CaravanAuctionsPage() {
  const [caravanAuctions, setCaravanAuctions] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    last_page: 1,
    current_page: 1,
    per_page: 10,
  });

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ✅ التحكم بعدد أعمدة الشبكة + حفظ
  const [showColumns, setShowColumns] = useState(false);
  const [gridCols, setGridCols] = useState<1 | 2 | 3 | 4>(() => loadSavedGridCols());

  const setColsAndSave = (v: 1 | 2 | 3 | 4) => {
    setGridCols(v);
    saveGridCols(v);
  };

  const gridClassName = useMemo(() => {
    switch (gridCols) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-1 md:grid-cols-2";
      case 3:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
      case 4:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
      default:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
    }
  }, [gridCols]);

  const refresh = () => setPage((p) => p);

  const resetColumns = () => {
    setColsAndSave(3);
    setShowColumns(false);
  };

  useEffect(() => {
    const ctrl = new AbortController();

    const fetchCaravans = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("market_category", "caravan");
        params.set("page", String(page));

        const res = await api.get(`/api/cars/in-auctions?${params.toString()}`, {
          headers: { Accept: "application/json; charset=UTF-8" },
          signal: ctrl.signal as any,
        });

        const { cars, pagination: pg } = extractCarsAndPagination(res.data);

        setCaravanAuctions(cars);
        setPagination(pg);
        setLastUpdated(new Date());
      } catch (err: any) {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;

        console.error("فشل في تحميل الكرفانات:", err);
        setCaravanAuctions([]);
        setPagination({ total: 0, last_page: 1, current_page: 1, per_page: 10 });
        setError("تعذر تحميل سوق الكرفانات. حاول مرة أخرى.");
      } finally {
        setLoading(false);
      }
    };

    fetchCaravans();

    return () => ctrl.abort();
  }, [page]);

  const showPagination = useMemo(() => {
    return !loading && (pagination?.last_page ?? 1) > 1;
  }, [loading, pagination]);

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      {/* خلفية ناعمة */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-background to-background" />
      <div className="absolute inset-0 -z-10 opacity-40 [background:radial-gradient(70%_55%_at_50%_0%,hsl(var(--primary)/0.18),transparent_70%)]" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-8">
        {/* شريط علوي */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <LoadingLink
            href="/auctions/auctions-2car"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors px-4 py-2 text-sm rounded-full border border-primary/20 bg-primary/10 hover:bg-primary/15"
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
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
              onClick={refresh}
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

        {/* هيرو */}
        <div className="bg-card/70 backdrop-blur-xl border border-border rounded-3xl p-6 md:p-8 shadow-sm overflow-hidden relative">
          <div className="absolute inset-0 opacity-30 pointer-events-none [background:radial-gradient(60%_60%_at_20%_10%,hsl(var(--primary)/0.25),transparent_65%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 text-xs font-semibold w-fit">
              <Caravan className="w-4 h-4" />
              سوق الكرفانات
            </div>

            <h1 className="mt-3 text-2xl md:text-3xl font-bold text-foreground">
              سوق الكرفانات
            </h1>

            <p className="mt-2 text-sm md:text-base text-muted-foreground leading-relaxed max-w-3xl">
              مزايدة عادلة بسعر بائع مخفي — المنافسة تعتمد على العرض والطلب الطبيعي،
              مع بيئة موثوقة لكل الأطراف.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-background/60 border border-border text-xs text-muted-foreground">
                <Caravan className="w-4 h-4 text-primary" />
                <span>
                  النتائج:{" "}
                  <span className="font-semibold text-foreground">
                    {loading ? "—" : pagination.total}
                  </span>
                </span>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-background/60 border border-border text-xs text-muted-foreground">
                <span>
                  الصفحة{" "}
                  <span className="font-semibold text-foreground">{page}</span>
                  {" / "}
                  <span className="font-semibold text-foreground">
                    {pagination.last_page || 1}
                  </span>
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

        {/* رسائل */}
        {error && (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold text-foreground">حدث خطأ</div>
              <div className="text-muted-foreground mt-1">{error}</div>
            </div>
          </div>
        )}

        {/* شرح مختصر */}
        <SectionShell title="كيف يعمل السوق؟" subtitle="شرح مختصر لطريقة البيع والمزايدة.">
          <div className="rounded-2xl border border-border bg-background/60 p-5 text-sm text-muted-foreground leading-relaxed">
            نلغي لعبة التقييمات الجائرة عبر مزايدة عادلة بسعر بائع مخفي. المنافسة تعتمد
            على العرض والطلب الطبيعي، مع تدخلنا كوسيط لموازنة التوقعات وضمان بيئة موثوقة
            لكل الأطراف.
          </div>
        </SectionShell>

        {/* القائمة */}
        <SectionShell title="الكرفانات المتاحة" subtitle="تصفح أحدث الكرفانات المعروضة.">
          <div className={`grid ${gridClassName} gap-8`}>
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <CaravanCard key={index} loading={true} />
              ))
            ) : caravanAuctions.length === 0 ? (
              <div className="col-span-full">
                <div className="rounded-3xl border border-border bg-background/60 p-10 text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Caravan className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    لا توجد كرفانات متاحة حالياً
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    سيتم تحديث القائمة تلقائيًا عند توفر كرفانات جديدة.
                  </div>
                </div>
              </div>
            ) : (
              caravanAuctions.map((item) => (
                <CaravanCard
                  key={item.id ?? `${item.make}-${item.model}-${Math.random()}`}
                  caravan={item}
                  loading={false}
                />
              ))
            )}
          </div>

          {/* Pagination */}
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
                    slots={{ previous: NavigateNextIcon, next: NavigateBeforeIcon }}
                    {...item}
                  />
                )}
                onChange={(_, newPage) => setPage(newPage)}
              />
            </Stack>
          )}
        </SectionShell>
      </div>
    </div>
  );
}

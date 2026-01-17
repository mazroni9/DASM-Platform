/**
 * 📝 الصفحة: مزادات السيارات الفاخرة
 * 📁 المسار: Frontend-local/app/auctions/auctions-2car/luxuryCars/page.tsx
 *
 * ✅ الوظيفة:
 * - عرض قائمة السيارات الفاخرة المتاحة للمزاد
 * - Pagination
 *
 * 🔄 الارتباطات:
 * - زر العودة → /auctions
 * - الكروت → تفاصيل السيارة (حسب AuctionCard)
 */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import AuctionCard from "@/components/AuctionCard";
import api from "@/lib/axios";
import LoadingLink from "@/components/LoadingLink";

import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import PaginationItem from "@mui/material/PaginationItem";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

import {
  ChevronRight,
  Crown,
  RefreshCw,
  AlertCircle,
  Car,
  Clock,
} from "lucide-react";

type PaginationInfo = {
  total: number;
  last_page: number;
  current_page?: number;
  per_page?: number;
};

type CarCard = any;

const MARKET_CATEGORY = "luxuryCars";

function toNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

/**
 * يقرأ الريسبونس بأمان من أي شكل قريب:
 * - { status, data: [...], pagination: {...} }
 * - { status, data: { data: [...], pagination: {...} } }
 * - { data: paginator } (قديم)
 */
function extractCarsAndPagination(resData: any): {
  cars: CarCard[];
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

export default function LuxuryCarsPage() {
  const [cars, setCars] = useState<CarCard[]>([]);
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

  const fetchCars = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("market_category", MARKET_CATEGORY);
      params.set("page", String(page));

      // ✅ نفس الـ API endpoint (لا تغيير)
      const res = await api.get(`/api/cars/in-auctions?${params.toString()}`, {
        headers: { Accept: "application/json; charset=UTF-8" },
        signal: signal as any,
      });

      const { cars: list, pagination: pg } = extractCarsAndPagination(res.data);

      setCars(list);
      setPagination(pg);
      setLastUpdated(new Date());
    } catch (err: any) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;

      console.error("فشل في تحميل السيارات الفاخرة:", err);
      setCars([]);
      setPagination({
        total: 0,
        last_page: 1,
        current_page: 1,
        per_page: 10,
      });
      setError("تعذر تحميل بيانات السوق. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const ctrl = new AbortController();
    fetchCars(ctrl.signal);
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const showPagination = useMemo(() => {
    return !loading && (pagination?.last_page ?? 1) > 1;
  }, [loading, pagination]);

  const pageTitle = "سوق السيارات الفارهة";
  const pageDesc =
    "اكتشف مجموعة مختارة من السيارات الفاخرة المعروضة للمزايدة. يتم تحديث القائمة تلقائيًا حسب السيارات المتاحة.";

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      {/* خلفية ناعمة */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-background to-background" />
      <div className="absolute inset-0 -z-10 opacity-40 [background:radial-gradient(70%_50%_at_50%_0%,hsl(var(--primary)/0.18),transparent_70%)]" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <LoadingLink
            href="/auctions"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors px-4 py-2 text-sm rounded-full border border-primary/20 bg-primary/10 hover:bg-primary/15"
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            العودة إلى المزادات
          </LoadingLink>

          <button
            type="button"
            onClick={() => fetchCars()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:bg-muted transition"
            aria-label="تحديث"
            title="تحديث"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="text-xs">تحديث</span>
          </button>
        </div>

        {/* Header */}
        <div className="bg-card/70 backdrop-blur-xl border border-border rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 text-xs font-semibold w-fit">
                <Crown className="w-4 h-4" />
                {pageTitle}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {pageTitle}
              </h1>

              <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
                {pageDesc}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-background/60 border border-border text-xs text-muted-foreground">
                  <Car className="w-4 h-4 text-primary" />
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

            {/* Side note */}
            <div className="w-full md:w-[340px]">
              <div className="rounded-2xl border border-border bg-background/60 p-4">
                <div className="text-sm font-semibold text-foreground">
                  ملاحظات السوق
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  يتم عرض السيارات المتاحة فقط داخل المزادات. لو البيانات لم تظهر
                  تأكد من وجود سيارات في هذا السوق أو جرّب التحديث.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold text-foreground">حدث خطأ</div>
              <div className="text-muted-foreground mt-1">{error}</div>
              <button
                type="button"
                onClick={() => fetchCars()}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:bg-muted transition text-xs"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                إعادة المحاولة
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <AuctionCard key={index} loading={true} />
              ))
            ) : cars.length === 0 ? (
              <div className="col-span-full">
                <div className="rounded-3xl border border-border bg-card/70 backdrop-blur-xl p-10 text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Crown className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    لا توجد سيارات فاخرة حالياً
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    سيتم تحديث القائمة تلقائيًا عند توفر سيارات جديدة.
                  </div>
                </div>
              </div>
            ) : (
              cars.map((item: any) => (
                <AuctionCard
                  car={item}
                  key={item.id ?? `${item.make}-${item.model}-${Math.random()}`}
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
        </div>
      </div>
    </div>
  );
}

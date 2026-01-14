"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import LoadingLink from "@/components/LoadingLink";
import AuctionCard from "@/components/AuctionCard";
import {
  ArrowLeft,
  Truck,
  RefreshCw,
  AlertCircle,
  Layers,
  Clock,
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

const MARKET = "trucks";

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
  const v: any =
    it.status ?? it.approval_status ?? it.approved ?? it.is_approved;
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
  item.active_auction?.current_price ??
  item.activeAuction?.current_price ??
  item.current_price ??
  null;

/**
 * يدعم أكثر من شكل للريسبونس:
 * - { status, data: [...], pagination: {...} }
 * - { status, data: { data: [...], pagination: {...} } }
 * - { status, data: paginator } (Laravel paginate)
 */
function extractListAndPagination(resData: any): {
  list: any[];
  pagination: PaginationInfo;
} {
  const empty: PaginationInfo = {
    total: 0,
    last_page: 1,
    current_page: 1,
    per_page: 12,
  };

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
      : container &&
        typeof container === "object" &&
        typeof container?.last_page !== "undefined"
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

export default function TrucksMarketPage() {
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

        // ✅ نفس منطق الفلترة (بدون تغيير ربط الباك اند)
        const filtered = (list as CarItem[]).filter(
          (it) => isApproved(it) && isActiveAuction(it)
        );

        setItems(filtered);
        setPagination(pg);
        setLastUpdated(new Date());
      } catch (e: any) {
        if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
        setErr(e?.message || "تعذر جلب بيانات السوق");
        setItems([]);
        setPagination({
          total: 0,
          last_page: 1,
          current_page: 1,
          per_page: 12,
        });
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
    // إعادة تحميل نفس الصفحة بدون تغيير منطق الـ params
    const ctrl = new AbortController();
    fetchMarketCars(ctrl.signal);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      {/* خلفية موحدة */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-background to-background" />
      <div className="absolute inset-0 -z-10 opacity-40 [background:radial-gradient(70%_55%_at_50%_0%,hsl(var(--primary)/0.18),transparent_70%)]" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-8">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <LoadingLink
            href="/auctions"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors px-4 py-2 text-sm rounded-full border border-primary/20 bg-primary/10 hover:bg-primary/15"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            العودة إلى المزادات
          </LoadingLink>

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

        {/* Hero */}
        <div className="bg-card/70 backdrop-blur-xl border border-border rounded-3xl p-6 md:p-8 shadow-sm overflow-hidden relative">
          <div className="absolute inset-0 opacity-30 pointer-events-none [background:radial-gradient(60%_60%_at_20%_10%,hsl(var(--primary)/0.25),transparent_65%)]" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 text-xs font-semibold w-fit">
              <Truck className="w-4 h-4" />
              سوق الشاحنات
            </div>

            <h1 className="mt-3 text-2xl md:text-3xl font-bold text-foreground">
              سوق الشاحنات
            </h1>

            <p className="mt-2 text-sm md:text-base text-muted-foreground leading-relaxed max-w-3xl">
              تصفح الشاحنات المتاحة في السوق، واختر المناسب لك بسرعة وبوضوح.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-background/60 border border-border text-xs text-muted-foreground">
                <Layers className="w-4 h-4 text-primary" />
                <span>
                  المعروض:{" "}
                  <span className="font-semibold text-foreground">
                    {loading ? "—" : shownCount}
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
              <h2 className="text-lg md:text-xl font-bold text-foreground">
                الشاحنات المتاحة
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                اعثر على الشاحنة المناسبة واطّلع على التفاصيل.
              </p>
            </div>

            {!loading && (
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-background/60 border border-border text-xs text-muted-foreground">
                <span>
                  إجمالي النتائج:{" "}
                  <span className="font-semibold text-foreground">
                    {pagination.total}
                  </span>
                </span>
              </div>
            )}
          </div>

          <div className="p-5 md:p-6">
            {loading ? (
              <div className="rounded-3xl border border-border bg-background/60 p-10 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Truck className="w-7 h-7 text-primary animate-pulse" />
                </div>
                <div className="text-sm text-muted-foreground">
                  جاري تحميل الشاحنات المتاحة...
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-3xl border border-border bg-background/60 p-10 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Truck className="w-7 h-7 text-primary" />
                </div>
                <div className="text-lg font-bold text-foreground">
                  لا توجد شاحنات متاحة حالياً
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  جرّب التحديث أو عد لاحقًا.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

"use client";

import React, { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import AuctionCard from "@/components/AuctionCard";
import LoadingLink from "@/components/LoadingLink";
import {
  Building2,
  RefreshCw,
  AlertCircle,
  Layers,
  Clock,
  ArrowLeft,
} from "lucide-react";

import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import PaginationItem from "@mui/material/PaginationItem";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

type ActiveAuction = {
  id?: number | string;
  status?: string;
  current_bid?: number | string | null;
  current_price?: number | string | null;
};

type CarCard = {
  id: number;
  title?: string;
  description?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | string | null;
  image?: string | null;
  images?: any;
  condition?: any;
  auction_status?: string | null;
  market_category?: string | null;
  engine?: string | null;
  transmission?: any;
  evaluation_price?: number | string | null;
  province?: string | null;
  created_at?: string | null;
  active_auction?: ActiveAuction | null;
  activeAuction?: ActiveAuction | null;
};

type PaginationMeta = {
  total: number;
  last_page: number;
  current_page?: number;
  per_page?: number;
};

const MARKET_CATEGORY = "companiesCars";

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

export default function CompaniesCarsPage() {
  const [cars, setCars] = useState<CarCard[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
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
    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/api/cars/in-auctions", {
        params: { market_category: MARKET_CATEGORY, page },
        headers: { Accept: "application/json; charset=UTF-8" },
        signal: signal as any,
      });

      const d = res?.data;

      // ✅ نفس شكل الربط كما هو
      const list: CarCard[] = Array.isArray(d?.data) ? d.data : [];
      const pag: PaginationMeta =
        d?.pagination && typeof d.pagination === "object"
          ? d.pagination
          : {
              total: list.length,
              last_page: 1,
              current_page: 1,
              per_page: 10,
            };

      setCars(list);
      setPagination({
        total: Number(pag.total ?? 0),
        last_page: Number(pag.last_page ?? 1),
        current_page: Number(pag.current_page ?? page),
        per_page: Number(pag.per_page ?? 10),
      });
      setLastUpdated(new Date());
    } catch (err: any) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;

      console.error("فشل في تحميل سيارات الشركات:", err);
      setCars([]);
      setPagination({
        total: 0,
        last_page: 1,
        current_page: 1,
        per_page: 10,
      });
      setError(err?.message || "فشل في تحميل البيانات");
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

  const shownCount = useMemo(() => cars.length, [cars]);

  const onRefresh = () => {
    const ctrl = new AbortController();
    fetchCars(ctrl.signal);
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
              <Building2 className="w-4 h-4" />
              سيارات الشركات
            </div>

            <h1 className="mt-3 text-2xl md:text-3xl font-bold text-foreground">
              سوق سيارات الشركات
            </h1>

            <p className="mt-2 text-sm md:text-base text-muted-foreground leading-relaxed max-w-3xl">
              عروض مناسبة لقطاع الشركات والأساطيل — تصفح السيارات واختر الأنسب
              لاحتياجك.
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
        {error && (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold text-foreground">حدث خطأ</div>
              <div className="text-muted-foreground mt-1">{error}</div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-card/60 backdrop-blur-xl border border-border rounded-3xl shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 border-b border-border/70 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-foreground">
                السيارات المتاحة
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                استعرض النتائج وافتح تفاصيل أي سيارة من البطاقة.
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
            {/* Loading / Empty / Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, index) => (
                  <AuctionCard key={index} loading={true} />
                ))}
              </div>
            ) : cars.length === 0 ? (
              <div className="rounded-3xl border border-border bg-background/60 p-10 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Building2 className="w-7 h-7 text-primary" />
                </div>
                <div className="text-lg font-bold text-foreground">
                  لا توجد سيارات شركات متاحة حالياً
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  جرّب التحديث أو عد لاحقًا.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {cars.map((item) => (
                  <AuctionCard key={item.id} car={item} loading={false} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {showPagination && (
              <Stack dir="rtl" spacing={2} className="mt-10 flex justify-center">
                <Pagination
                  className="flex justify-center"
                  dir="rtl"
                  count={pagination.last_page || 1}
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
                  onChange={(_, p) => setPage(p)}
                />
              </Stack>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/axios";
import { usePusher } from "@/contexts/PusherContext";
import LoadingLink from "@/components/LoadingLink";
import { ChevronRight, Columns, ChevronDown, RotateCcw, X, Eye, Loader2, AlertCircle, Search } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

import { AgGridReact } from "ag-grid-react";
import type { ColDef, ICellRendererParams, GridReadyEvent } from "ag-grid-community";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

// ✅ تسجيل جميع وحدات AG Grid المجتمعية (مطلوب في الإصدار 34+)
ModuleRegistry.registerModules([AllCommunityModule]);

type CarInfo = {
  id: number;
  make?: string;
  model?: string;
  year?: number;
  images?: string[];
};

type FixedAuction = {
  id: number;
  car_id: number;
  end_time?: string | null;
  opening_price?: number | string | null;
  starting_bid?: number | string | null;
  current_bid?: number | string | null;
  car?: CarInfo | null;
  bids?: any[];
};

type Paginator<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
};

// ================= حفظ اختيارات الأعمدة =================
const COLUMNS_STORAGE_KEY = "fixed_auction_columns_v1";

// ✅ قائمة الأعمدة (للـ Column Chooser)
const COLUMN_OPTIONS: Array<{ id: string; label: string; locked?: boolean }> = [
  { id: "make", label: "الماركة" },
  { id: "model", label: "الموديل" },
  { id: "year", label: "السنة" },
  { id: "openingPrice", label: "سعر الافتتاح" },
  { id: "startingBid", label: "سعر البداية" },
  { id: "currentBid", label: "آخر سعر" },
  { id: "bidsCount", label: "عدد المزايدات" },
  { id: "endTime", label: "وقت الانتهاء" },
  { id: "auctionId", label: "رقم المزاد" },
  { id: "details", label: "التفاصيل", locked: true }, // ✅ دايمًا ظاهرة
];

// ================= Helpers =================
function normalizeFixedAuction(raw: any): FixedAuction {
  const car = raw?.car ?? null;

  return {
    id: raw?.id ?? 0,
    car_id: raw?.car_id ?? car?.id ?? 0,
    end_time: raw?.end_time ?? null,
    opening_price: raw?.opening_price ?? null,
    starting_bid: raw?.starting_bid ?? null,
    current_bid: raw?.current_bid ?? null,
    car,
    bids: Array.isArray(raw?.bids) ? raw.bids : [],
  };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isPaginator<T = any>(v: unknown): v is Paginator<T> {
  if (!isObject(v)) return false;
  return (
    Array.isArray((v as any).data) &&
    typeof (v as any).current_page === "number" &&
    typeof (v as any).last_page === "number" &&
    typeof (v as any).total === "number"
  );
}

/**
 * الباك بيرجع غالبًا:
 * { status: "success", data: paginator }
 * وأحيانًا ممكن يرجع array مباشر (احتياطي)
 */
function extractPagination(responseData: any): {
  list: FixedAuction[];
  currentPage: number;
  lastPage: number;
  total: number;
} {
  const container = responseData?.data;

  if (isPaginator(container)) {
    const list = container.data
      .map(normalizeFixedAuction)
      .filter((a) => a.id && a.car_id);

    return {
      list,
      currentPage: container.current_page ?? 1,
      lastPage: container.last_page ?? 1,
      total: container.total ?? list.length,
    };
  }

  if (Array.isArray(container)) {
    const list = container.map(normalizeFixedAuction).filter((a) => a.id && a.car_id);
    return { list, currentPage: 1, lastPage: 1, total: list.length };
  }

  return { list: [], currentPage: 1, lastPage: 1, total: 0 };
}

function toNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/,/g, ""));
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function formatDateTime(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      timeZone: "Asia/Riyadh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

function loadSavedColumnVisibility(): Record<string, boolean> {
  const defaults: Record<string, boolean> = {};
  COLUMN_OPTIONS.forEach((c) => (defaults[c.id] = true));

  if (typeof window === "undefined") return defaults;

  try {
    const raw = window.localStorage.getItem(COLUMNS_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Record<string, boolean>;

    const merged: Record<string, boolean> = { ...defaults, ...parsed };
    COLUMN_OPTIONS.forEach((c) => {
      if (c.locked) merged[c.id] = true;
    });
    return merged;
  } catch {
    return defaults;
  }
}

function saveColumnVisibility(model: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(model));
  } catch {
    // ignore
  }
}

// ================= Component =================
const FixedAuctionPage = () => {
  const [auctions, setAuctions] = useState<FixedAuction[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // ✅ UI Controls
  const [showColumns, setShowColumns] = useState(false);
  const [quickFilter, setQuickFilter] = useState("");

  // ✅ Column visibility model (محفوظ في localStorage)
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() =>
    loadSavedColumnVisibility()
  );

  // لعدد الصفوف المعروضة بعد فلاتر الجريد
  const [displayedCount, setDisplayedCount] = useState(0);

  const isMountedRef = useRef(true);
  const requestSeqRef = useRef(0);

  const { subscribe, unsubscribe, isConnected } = usePusher();

  // ✅ Ref للـ Grid
  const gridRef = useRef<AgGridReact<FixedAuction>>(null);

  const fetchFixedAuctions = useCallback(async (pageToLoad: number) => {
    const seq = ++requestSeqRef.current;

    try {
      if (pageToLoad === 1) setLoadingInitial(true);
      else setLoadingMore(true);

      setError(null);

      const response = await api.get("/api/auctions/fixed", {
        headers: { Accept: "application/json; charset=UTF-8" },
        params: { page: pageToLoad },
      });

      const { list, currentPage, lastPage: lp, total: t } = extractPagination(response.data);

      if (!isMountedRef.current) return;
      if (seq !== requestSeqRef.current) return;

      setPage(currentPage);
      setLastPage(lp);
      setTotal(t);

      setAuctions((prev) => {
        if (pageToLoad === 1) return list;

        // append مع منع التكرار
        const map = new Map<number, FixedAuction>();
        for (const a of prev) map.set(a.id, a);
        for (const a of list) map.set(a.id, { ...map.get(a.id), ...a });
        return Array.from(map.values());
      });
    } catch (err) {
      console.error(err);
      if (!isMountedRef.current) return;

      setError("Failed to fetch fixed auctions.");
      if (pageToLoad === 1) setAuctions([]);
    } finally {
      if (!isMountedRef.current) return;
      setLoadingInitial(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchFixedAuctions(1);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchFixedAuctions]);

  // ✅ Pusher updates
  useEffect(() => {
    if (!isConnected) return;

    const channel = subscribe("auction.fixed");
    if (!channel) return;

    const onNewBid = (event: any) => {
      const updatedRaw =
        event?.data?.active_auction ??
        event?.active_auction ??
        event?.auction ??
        event?.data?.auction ??
        null;

      if (!updatedRaw) return;

      const updated = normalizeFixedAuction(updatedRaw);

      setAuctions((prev) => {
        const idx = prev.findIndex((a) => a.id === updated.id);
        if (idx === -1) return [updated, ...prev];

        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...updated };
        return copy;
      });
    };

    const onMoved = () => {
      fetchFixedAuctions(1);
    };

    channel.bind("NewBidEvent", onNewBid);
    channel.bind("CarMovedBetweenAuctionsEvent", onMoved);

    return () => {
      try {
        channel.unbind("NewBidEvent", onNewBid);
        channel.unbind("CarMovedBetweenAuctionsEvent", onMoved);
      } catch {}
      unsubscribe("auction.fixed");
    };
  }, [isConnected, subscribe, unsubscribe, fetchFixedAuctions]);

  const canLoadMore = page < lastPage;

  // ================= AG Grid Columns =================
  const columnDefs = useMemo<ColDef<FixedAuction>[]>(
    () => [
      {
        colId: "make",
        headerName: "الماركة",
        valueGetter: (p) => p.data?.car?.make ?? "—",
        filter: "agTextColumnFilter",
      },
      {
        colId: "model",
        headerName: "الموديل",
        valueGetter: (p) => p.data?.car?.model ?? "—",
        filter: "agTextColumnFilter",
      },
      {
        colId: "year",
        headerName: "السنة",
        valueGetter: (p) => p.data?.car?.year ?? "",
        type: "numericColumn",
        filter: "agNumberColumnFilter",
      },
      {
        colId: "openingPrice",
        headerName: "سعر الافتتاح",
        valueGetter: (p) => toNumber(p.data?.opening_price, 0),
        cellRenderer: (p: ICellRendererParams<FixedAuction>) => formatCurrency(p.value ?? 0),
        type: "numericColumn",
        filter: "agNumberColumnFilter",
      },
      {
        colId: "startingBid",
        headerName: "سعر البداية",
        valueGetter: (p) => toNumber(p.data?.starting_bid, 0),
        cellRenderer: (p: ICellRendererParams<FixedAuction>) => formatCurrency(p.value ?? 0),
        type: "numericColumn",
        filter: "agNumberColumnFilter",
      },
      {
        colId: "currentBid",
        headerName: "آخر سعر",
        valueGetter: (p) => toNumber(p.data?.current_bid, 0),
        cellRenderer: (p: ICellRendererParams<FixedAuction>) => formatCurrency(p.value ?? 0),
        type: "numericColumn",
        filter: "agNumberColumnFilter",
      },
      {
        colId: "bidsCount",
        headerName: "عدد المزايدات",
        valueGetter: (p) => (Array.isArray(p.data?.bids) ? p.data!.bids!.length : 0),
        type: "numericColumn",
        filter: "agNumberColumnFilter",
      },
      {
        colId: "endTime",
        headerName: "وقت الانتهاء",
        valueGetter: (p) => p.data?.end_time ?? null,
        cellRenderer: (p: ICellRendererParams<FixedAuction>) => (
          <span className="whitespace-nowrap">{formatDateTime(p.value)}</span>
        ),
        filter: "agTextColumnFilter",
      },
      {
        colId: "auctionId",
        headerName: "رقم المزاد",
        valueGetter: (p) => p.data?.id ?? "",
        type: "numericColumn",
        filter: "agNumberColumnFilter",
      },
      {
        colId: "details",
        headerName: "التفاصيل",
        sortable: false,
        filter: false,
        cellRenderer: (p: ICellRendererParams<FixedAuction>) => {
          const carId = p.data?.car_id;
          if (!carId) return null;
          return (
            <LoadingLink
              href={`/carDetails/${carId}`}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl border border-primary/30"
              title="عرض التفاصيل"
            >
              <Eye className="w-4.5 h-4.5" />
            </LoadingLink>
          );
        },
      },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      floatingFilter: true,
      resizable: true,
      flex: 1,
      minWidth: 130,
      suppressHeaderMenuButton: false,
    }),
    []
  );

  // ✅ تطبيق إظهار/إخفاء الأعمدة على الجريد + حفظها
  const applyColumnsVisibility = useCallback((model: Record<string, boolean>) => {
    const api = gridRef.current?.api as any;
    if (!api) return;

    const forced = { ...model };
    COLUMN_OPTIONS.forEach((c) => {
      if (c.locked) forced[c.id] = true;
    });

    for (const col of COLUMN_OPTIONS) {
      api.setColumnsVisible?.([col.id], Boolean(forced[col.id]));
    }

    saveColumnVisibility(forced);
  }, []);

  // ✅ Column chooser handlers
  const toggleColumn = (id: string) => {
    const colMeta = COLUMN_OPTIONS.find((c) => c.id === id);
    if (colMeta?.locked) return;

    setColumnVisibility((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      COLUMN_OPTIONS.forEach((c) => {
        if (c.locked) next[c.id] = true;
      });
      applyColumnsVisibility(next);
      return next;
    });
  };

  const showAllColumns = () => {
    const next: Record<string, boolean> = {};
    COLUMN_OPTIONS.forEach((c) => (next[c.id] = true));
    setColumnVisibility(next);
    applyColumnsVisibility(next);
  };

  const hideAllColumns = () => {
    const next: Record<string, boolean> = {};
    COLUMN_OPTIONS.forEach((c) => (next[c.id] = c.locked ? true : false));
    setColumnVisibility(next);
    applyColumnsVisibility(next);
  };

  const syncDisplayedCount = () => {
    const api = gridRef.current?.api as any;
    if (!api) {
      setDisplayedCount(auctions.length);
      return;
    }
    setDisplayedCount(api.getDisplayedRowCount?.() ?? auctions.length);
  };

  const onGridReady = (params: GridReadyEvent<FixedAuction>) => {
    applyColumnsVisibility(columnVisibility);
    setDisplayedCount(params.api.getDisplayedRowCount());
  };

  useEffect(() => {
    const t = setTimeout(syncDisplayedCount, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctions, quickFilter]);

  // ✅ Clear filters + quick filter + grid filters
  const clearAll = () => {
    setQuickFilter("");
    setShowColumns(false);

    const api = gridRef.current?.api as any;
    api?.setFilterModel?.(null);
    api?.onFilterChanged?.();
    syncDisplayedCount();
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-4 md:px-6 py-4">
      <div className="max-w-7xl mx-auto">
        {/* زر العودة */}
        <div className="flex justify-end lg:justify-start mb-4">
          <LoadingLink
            href="/auctions"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors px-4 py-2.5 text-sm rounded-xl border border-border hover:border-primary/50 bg-card/50 hover:bg-card backdrop-blur-sm"
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            العودة
          </LoadingLink>
        </div>

        <h1 className="text-3xl text-foreground font-bold text-center my-6">المزاد الثابت</h1>

        <p className="text-foreground/70 text-center my-4 max-w-4xl mx-auto">
          هذا هو المكان الذي تحصل فيه السيارات الرائعة على فرصة ثانية. السيارات المعروضة هنا لم يتم بيعها في
          المزادات الأخرى، وتُعرض الآن في مزاد تقليدي بسيط ومحدد بوقت. عندما ينتهي العداد، يفوز صاحب أعلى سعر
          بالمزاد تلقائياً. إنها فرصتك لاقتناص سيارة أحلامك بسعر رائع.
        </p>

        <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border p-5 shadow-2xl">
          {/* Top Controls */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 w-full max-w-2xl relative">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/60 w-5 h-5" />
              <input
                value={quickFilter}
                onChange={(e) => setQuickFilter(e.target.value)}
                placeholder="بحث سريع داخل الجدول..."
                className="w-full pr-11 pl-4 py-3 bg-background/70 border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-foreground placeholder-foreground/50 backdrop-blur-sm"
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-sm text-foreground/80 bg-background/60 px-4.5 py-2.5 rounded-xl border border-border">
                <span className="font-semibold text-foreground">{displayedCount}</span> من{" "}
                <span className="font-semibold text-foreground">{total}</span>
              </div>

              <button
                onClick={() => setShowColumns((v) => !v)}
                className="flex items-center gap-2.5 px-4.5 py-2.5 border border-border rounded-xl hover:bg-border transition-colors text-foreground/80 hover:text-foreground backdrop-blur-sm"
              >
                <Columns className="w-4.5 h-4.5" />
                الأعمدة
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showColumns ? "rotate-180" : ""}`} />
              </button>

              <button
                onClick={clearAll}
                className="flex items-center gap-2.5 px-4.5 py-2.5 border border-border rounded-xl hover:bg-border transition-colors text-foreground/80 hover:text-foreground backdrop-blur-sm"
                title="تصفير الفلاتر"
              >
                <RotateCcw className="w-4.5 h-4.5" />
                تصفير
              </button>
            </div>
          </div>

          {/* ✅ Column Chooser */}
          {showColumns && (
            <div className="mt-5 pt-5 border-t border-border/40">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                <div className="text-sm text-foreground/80">
                  اختر الأعمدة التي تريد إظهارها/إخفاءها (يتم الحفظ تلقائيًا).
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={showAllColumns}
                    className="px-3 py-2 text-sm rounded-xl border border-border hover:bg-border transition-colors"
                  >
                    إظهار الكل
                  </button>
                  <button
                    onClick={hideAllColumns}
                    className="px-3 py-2 text-sm rounded-xl border border-border hover:bg-border transition-colors"
                  >
                    إخفاء الكل
                  </button>
                  <button
                    onClick={() => setShowColumns(false)}
                    className="px-3 py-2 text-sm rounded-xl border border-border hover:bg-border transition-colors inline-flex items-center gap-2"
                    title="إغلاق"
                  >
                    <X className="w-4 h-4" />
                    إغلاق
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {COLUMN_OPTIONS.map((c) => {
                  const checked = Boolean(columnVisibility[c.id]);
                  const disabled = Boolean(c.locked);
                  return (
                    <label
                      key={c.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border border-border bg-background/60 ${
                        disabled ? "opacity-70" : "hover:bg-border cursor-pointer"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleColumn(c.id)}
                        className="accent-primary"
                      />
                      <span className="text-sm">{c.label}</span>
                      {disabled && <span className="text-xs text-foreground/60 mr-auto">(إجباري)</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* حالات */}
          {error && (
            <div className="mt-5 bg-red-500/10 border border-red-500/20 text-foreground rounded-2xl p-5 flex items-center gap-3 backdrop-blur-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading initial */}
          {loadingInitial && (
            <div className="mt-5 bg-card/40 backdrop-blur-xl rounded-2xl border border-border p-10 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-foreground/70">جارٍ تحميل بيانات المزاد الثابت...</p>
            </div>
          )}

          {/* Grid */}
          {!loadingInitial && !error && auctions.length === 0 && (
            <div className="mt-5 text-center text-foreground/70 p-8">
              لا توجد مزادات ثابتة متاحة حالياً
            </div>
          )}

          {!loadingInitial && !error && auctions.length > 0 && (
            <>
              <div className="mt-5 bg-card/30 rounded-2xl border border-border overflow-hidden">
                <div className="ag-theme-alpine" style={{ width: "100%", height: "60vh", direction: "rtl" }}>
                  <AgGridReact<FixedAuction>
                    ref={gridRef}
                    rowData={auctions}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    quickFilterText={quickFilter}
                    animateRows
                    enableRtl
                    suppressCellFocus
                    rowHeight={52}
                    headerHeight={48}
                    onGridReady={onGridReady}
                    onFilterChanged={syncDisplayedCount}
                    onRowDataUpdated={syncDisplayedCount}
                  />
                </div>
              </div>

              {/* Load more */}
              <div className="flex justify-center mt-6">
                {canLoadMore ? (
                  <button
                    onClick={() => fetchFixedAuctions(page + 1)}
                    disabled={loadingMore}
                    className="px-6 py-3 rounded-xl border border-border bg-card hover:bg-border transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جارٍ التحميل...
                      </>
                    ) : (
                      "تحميل المزيد"
                    )}
                  </button>
                ) : (
                  <p className="text-foreground/50 text-sm">تم عرض جميع المزادات</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FixedAuctionPage;

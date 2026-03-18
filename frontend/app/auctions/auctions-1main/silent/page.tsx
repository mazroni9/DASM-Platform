"use client";

import React, { useEffect, useState, Fragment, useRef, useCallback, useMemo } from "react";
import LoadingLink from "@/components/LoadingLink";
import BidTimer from "@/components/BidTimer";
import { formatCurrency } from "@/utils/formatCurrency";
import api from "@/lib/axios";
import { usePusher } from "@/contexts/PusherContext";
import toast from "react-hot-toast";
import {
  Car as CarIcon,
  Search,
  Filter,
  Eye,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  AlertCircle,
  Loader2,
  TrendingUp,
  Minus,
  Plus,
  Columns,
  RotateCcw,
  X,
} from "lucide-react";

// ================= ثابت نوع المزاد =================
const AUCTION_TYPE = "silent_instant";
const PAGE_SIZE = 50;

// ================= حفظ اختيارات الأعمدة =================
const COLUMNS_STORAGE_KEY = "silent_auction_columns_v1";

type ColumnId =
  | "expand"
  | "city"
  | "make"
  | "model"
  | "year"
  | "openingPrice"
  | "currentBid"
  | "change"
  | "bidsCount"
  | "maxBid"
  | "details";

const COLUMN_OPTIONS: Array<{ id: ColumnId; label: string; locked?: boolean }> = [
  { id: "expand", label: "توسيع", locked: true },
  { id: "city", label: "المدينة" },
  { id: "make", label: "الماركة" },
  { id: "model", label: "الموديل" },
  { id: "year", label: "السنة" },
  { id: "openingPrice", label: "سعر الافتتاح" },
  { id: "currentBid", label: "آخر سعر" },
  { id: "change", label: "التغير" },
  { id: "bidsCount", label: "عدد المزايدات" },
  { id: "maxBid", label: "أعلى سعر" },
  { id: "details", label: "التفاصيل", locked: true },
];

// =============== Types ===============
type CarInfo = {
  id: number;
  city?: string;
  make?: string;
  model?: string;
  year?: number;
  odometer?: string;
  condition?: string;
  color?: string;
  engine?: string;
  auction_status?: string;
  user_id?: number;
};

type Bid = {
  bid_amount: number | string;
  increment: number | string;
};

type SilentAuctionItem = {
  id: number;
  car_id: number;
  car?: CarInfo | null;
  auction_type?: string;
  minimum_bid: number | string;
  maximum_bid: number | string;
  current_bid: number | string;
  bids: Bid[];
  status?: string;
};

interface FilterOptions {
  brand: string; // server-side
}

type AdvancedFilters = {
  city: string;
  model: string;
  yearFrom: string;
  yearTo: string;
  condition: string;
  color: string;
  engine: string;
  auctionStatus: "" | "in_auction" | "sold" | "expired";
};

const INITIAL_ADVANCED: AdvancedFilters = {
  city: "",
  model: "",
  yearFrom: "",
  yearTo: "",
  condition: "",
  color: "",
  engine: "",
  auctionStatus: "",
};

// =============== Helpers ===============
function toNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/,/g, ""));
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function safeLower(v: unknown) {
  return String(v ?? "").toLowerCase().trim();
}

async function isWithinAllowedTime(page: string): Promise<boolean> {
  try {
    const response = await api.get(`/api/check-time`, { params: { page } });
    return Boolean(response.data?.allowed);
  } catch {
    return false;
  }
}

function getCurrentAuctionType(time: Date = new Date()): { label: string; isLive: boolean } {
  const h = time.getHours();
  if (h >= 16 && h < 19) return { label: "الحراج المباشر", isLive: true };
  if (h >= 19 && h < 22) return { label: "السوق الفوري المباشر", isLive: true };
  return { label: "السوق المتأخر", isLive: true };
}

function normalizeSilentAuction(raw: any): SilentAuctionItem {
  const car = raw?.car ?? null;

  return {
    id: raw?.id ?? 0,
    car_id: raw?.car_id ?? car?.id ?? 0,
    car,
    auction_type: raw?.auction_type ?? raw?.type ?? "",
    minimum_bid: raw?.minimum_bid ?? raw?.min_price ?? raw?.starting_bid ?? 0,
    maximum_bid: raw?.maximum_bid ?? raw?.max_price ?? 0,
    current_bid: raw?.current_bid ?? 0,
    bids: Array.isArray(raw?.bids) ? raw.bids : [],
    status: raw?.status ?? "",
  };
}

function loadSavedColumnVisibility(): Record<ColumnId, boolean> {
  const defaults = {} as Record<ColumnId, boolean>;
  COLUMN_OPTIONS.forEach((c) => {
    defaults[c.id] = true;
  });

  if (typeof window === "undefined") return defaults;

  try {
    const raw = window.localStorage.getItem(COLUMNS_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<Record<ColumnId, boolean>>;
    const merged = { ...defaults, ...parsed } as Record<ColumnId, boolean>;
    COLUMN_OPTIONS.forEach((c) => {
      if (c.locked) merged[c.id] = true;
    });
    return merged;
  } catch {
    return defaults;
  }
}

function saveColumnVisibility(model: Record<ColumnId, boolean>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(model));
  } catch {
    // ignore
  }
}

// مكون لعرض التغيير في السعر
const PriceChangeBadge = ({ increment, bidAmount }: { increment: number; bidAmount: number }) => {
  const isPositive = increment > 0;
  const percentage = bidAmount ? ((increment / bidAmount) * 100).toFixed(2) : "0.00";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
        isPositive
          ? "bg-emerald-900/30 text-emerald-700 border-emerald-700/50"
          : "bg-rose-900/30 text-rose-700 border-rose-700/50"
      }`}
    >
      {isPositive ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
      {formatCurrency(increment)} ({percentage}%)
    </span>
  );
};

export default function SilentAuctionPage() {
  const [carsTotal, setCarsTotal] = useState(0);

  // Server search
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({ brand: "" });

  // Advanced (client-side)
  const [quickSearch, setQuickSearch] = useState("");
  const [advanced, setAdvanced] = useState<AdvancedFilters>(INITIAL_ADVANCED);

  const [showFilters, setShowFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);

  const [carsBrands, setCarsBrands] = useState<string[]>([]);
  const [isAllowed, setIsAllowed] = useState(true);
  const [cars, setCars] = useState<SilentAuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedRows, setExpandedRows] = useState<{ [key: number]: boolean }>({});

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // === Infinity Scroll ===
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentryRef = useRef<HTMLDivElement | null>(null);
  const loadingGateRef = useRef(false);

  // لمنع race condition لما البحث/الفلاتر تتغير بسرعة
  const requestSeqRef = useRef(0);

  const { label: auctionType } = getCurrentAuctionType(currentTime);

  // ✅ Column visibility (persisted)
  const [columnVisibility, setColumnVisibility] = useState<Record<ColumnId, boolean>>(() =>
    loadSavedColumnVisibility()
  );

  const isColVisible = useCallback(
    (id: ColumnId) => Boolean(columnVisibility[id]),
    [columnVisibility]
  );

  const visibleHeaders = useMemo(() => {
    const order: ColumnId[] = [
      "expand",
      "city",
      "make",
      "model",
      "year",
      "openingPrice",
      "currentBid",
      "change",
      "bidsCount",
      "maxBid",
      "details",
    ];
    return order.filter((id) => isColVisible(id));
  }, [isColVisible]);

  // تحديث الوقت
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const resetAndReloadServer = () => {
    setCars([]);
    setExpandedRows({});
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setQuickSearch("");
    setFilters({ brand: "" });
    setAdvanced(INITIAL_ADVANCED);
    setShowFilters(false);
    setShowColumns(false);
    resetAndReloadServer();
  };

  const toggleRowExpansion = (id: number) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ✅ Column chooser handlers
  const toggleColumn = (id: ColumnId) => {
    const meta = COLUMN_OPTIONS.find((c) => c.id === id);
    if (meta?.locked) return;

    setColumnVisibility((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      COLUMN_OPTIONS.forEach((c) => {
        if (c.locked) next[c.id] = true;
      });
      saveColumnVisibility(next);
      return next;
    });
  };

  const showAllColumns = () => {
    const next = {} as Record<ColumnId, boolean>;
    COLUMN_OPTIONS.forEach((c) => (next[c.id] = true));
    setColumnVisibility(next);
    saveColumnVisibility(next);
  };

  const hideAllColumns = () => {
    const next = {} as Record<ColumnId, boolean>;
    COLUMN_OPTIONS.forEach((c) => (next[c.id] = c.locked ? true : false));
    setColumnVisibility(next);
    saveColumnVisibility(next);
  };

  // جلب البيانات (Laravel + backend)
  const fetchAuctions = useCallback(async () => {
    const seq = ++requestSeqRef.current;

    loadingGateRef.current = true;
    setLoading(currentPage === 1);
    setError(null);

    try {
      const allowed = await isWithinAllowedTime("late_auction");
      setIsAllowed(allowed);

      if (!allowed) {
        if (seq === requestSeqRef.current) {
          setCars([]);
          setCarsBrands([]);
          setCarsTotal(0);
          setLastPage(1);
        }
        return;
      }

      const response = await api.get(`/api/approved-auctions/${AUCTION_TYPE}`, {
        headers: { Accept: "application/json; charset=UTF-8" },
        params: {
          page: currentPage,
          pageSize: PAGE_SIZE,
          auction_type: AUCTION_TYPE,
          active: 1,
          ...(searchTerm ? { search: searchTerm } : {}),
          ...(filters.brand ? { brand: filters.brand } : {}),
        },
      });

      const paginated = response.data?.data;
      const rows = Array.isArray(paginated?.data) ? paginated.data : [];
      const normalized = rows.map(normalizeSilentAuction);

      const total = toNumber(paginated?.total, 0);
      const lp = toNumber(paginated?.last_page, 1);
      const brands = Array.isArray(response.data?.brands) ? response.data.brands : [];

      if (seq !== requestSeqRef.current) return;

      setCarsBrands(brands);
      setCarsTotal(total);
      setLastPage(lp);

      setCars((prev) => (currentPage > 1 ? [...prev, ...normalized] : normalized));
    } catch (err) {
      console.error("فشل تحميل بيانات المزاد", err);
      if (seq === requestSeqRef.current) {
        setError("تعذر الاتصال بالخادم. يرجى المحاولة لاحقًا.");
        if (currentPage === 1) setCars([]);
      }
    } finally {
      if (seq === requestSeqRef.current) setLoading(false);
      loadingGateRef.current = false;
    }
  }, [currentPage, searchTerm, filters.brand]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  // Pusher
  const { subscribe, unsubscribe, isConnected } = usePusher();

  useEffect(() => {
    if (!isConnected) return;

    const channel = subscribe("auction.silent");
    if (!channel) return;

    channel.bind("CarMovedBetweenAuctionsEvent", () => {
      setCurrentPage(1);
      setCars([]);
      setExpandedRows({});
    });

    channel.bind("AuctionStatusChangedEvent", (data: any) => {
      setCurrentPage(1);
      setCars([]);
      setExpandedRows({});

      const statusLabels: Record<string, string> = {
        live: "مباشر",
        ended: "منتهي",
        completed: "مكتمل",
        cancelled: "ملغي",
        failed: "فاشل",
        scheduled: "مجدول",
      };
      const oldLabel = statusLabels[data.old_status] || data.old_status;
      const newLabel = statusLabels[data.new_status] || data.new_status;

      toast(
        `تم تغيير حالة مزاد ${data.car_make} ${data.car_model} من ${oldLabel} إلى ${newLabel}`
      );
    });

    return () => {
      unsubscribe("auction.silent");
    };
  }, [isConnected, subscribe, unsubscribe]);

  // Infinity Scroll
  useEffect(() => {
    const rootEl = scrollContainerRef.current;
    const sentryEl = sentryRef.current;
    if (!rootEl || !sentryEl) return;

    const io = new IntersectionObserver(
      (entries) => {
        const ent = entries[0];
        if (
          ent.isIntersecting &&
          !loadingGateRef.current &&
          isAllowed &&
          currentPage < lastPage
        ) {
          setCurrentPage((p) => p + 1);
        }
      },
      { root: rootEl, rootMargin: "800px 0px", threshold: 0 }
    );

    io.observe(sentryEl);
    return () => io.disconnect();
  }, [currentPage, lastPage, isAllowed]);

  // ✅ فلترة متقدمة (Client-side) + Quick Search على البيانات المحمّلة
  const filteredCars = useMemo(() => {
    const cityQ = safeLower(advanced.city);
    const modelQ = safeLower(advanced.model);
    const conditionQ = safeLower(advanced.condition);
    const colorQ = safeLower(advanced.color);
    const engineQ = safeLower(advanced.engine);

    const yearFrom = advanced.yearFrom ? toNumber(advanced.yearFrom, 0) : 0;
    const yearTo = advanced.yearTo ? toNumber(advanced.yearTo, 9999) : 9999;

    const quickQ = safeLower(quickSearch);

    const matchesQuick = (row: SilentAuctionItem) => {
      if (!quickQ) return true;

      const car = row.car; // ✅ CarInfo | null | undefined
      const lastBid = row.bids?.length ? row.bids[row.bids.length - 1] : null;

      const parts: string[] = [];

      // ابحث فقط داخل الأعمدة الظاهرة
      if (isColVisible("city")) parts.push(car?.city ?? "");
      if (isColVisible("make")) parts.push(car?.make ?? "");
      if (isColVisible("model")) parts.push(car?.model ?? "");
      if (isColVisible("year")) parts.push(String(car?.year ?? ""));
      if (isColVisible("openingPrice")) parts.push(String(row.minimum_bid ?? ""));
      if (isColVisible("currentBid")) parts.push(String(row.current_bid ?? ""));
      if (isColVisible("change") && lastBid)
        parts.push(`${String(lastBid.increment ?? "")} ${String(lastBid.bid_amount ?? "")}`);
      if (isColVisible("bidsCount")) parts.push(String(row.bids?.length ?? 0));
      if (isColVisible("maxBid")) parts.push(String(row.maximum_bid ?? ""));

      return safeLower(parts.join(" ")).includes(quickQ);
    };

    return cars
      .filter((row) => {
        const car = row.car; // ✅ CarInfo | null | undefined

        // brand (server) + (تأكيد محلي)
        const make = car?.make ?? "";
        if (filters.brand && filters.brand !== make) return false;

        // advanced filters
        if (cityQ && !safeLower(car?.city ?? "").includes(cityQ)) return false;
        if (modelQ && !safeLower(car?.model ?? "").includes(modelQ)) return false;

        const y = toNumber(car?.year, 0);
        if (advanced.yearFrom && y < yearFrom) return false;
        if (advanced.yearTo && y > yearTo) return false;

        if (conditionQ && !safeLower(car?.condition ?? "").includes(conditionQ)) return false;
        if (colorQ && !safeLower(car?.color ?? "").includes(colorQ)) return false;
        if (engineQ && !safeLower(car?.engine ?? "").includes(engineQ)) return false;

        if (advanced.auctionStatus) {
          const st = (car?.auction_status ?? "") as AdvancedFilters["auctionStatus"] | "";
          if (st !== advanced.auctionStatus) return false;
        }

        // quick search
        if (!matchesQuick(row)) return false;

        return true;
      })
      .filter((row) => {
        // نفس منطق العرض عندك
        const car = row.car;
        const showRow =
          (row.auction_type ?? "") !== "live" && (car?.auction_status ?? "") === "in_auction";
        return showRow;
      });
  }, [cars, filters.brand, advanced, quickSearch, isColVisible, isColVisible("city")]);

  // ملاحظة: السطر الأخير في deps كان إضافة دفاعية، لكن الأفضل عدم استدعاء isColVisible داخل deps.
  // هنصلحها عمليًا بحذف isColVisible("city") لو مسبب تحذير.

  return (
    <div className="min-h-screen bg-background text-foreground px-4 md:px-6 py-4">
      <div className="max-w-7xl mx-auto">
        {/* شريط علوي */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
          <div className="flex justify-end lg:justify-start">
            <LoadingLink
              href="/auctions/auctions-1main"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors px-4 py-2.5 text-sm rounded-xl border border-border hover:border-primary/50 bg-card/50 hover:bg-card backdrop-blur-sm"
            >
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              العودة
            </LoadingLink>
          </div>

          <div className="bg-card/60 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center justify-between border border-primary/30">
            <div className="text-sm font-medium text-primary">{auctionType} - جارٍ الآن</div>
            <div className="flex items-center gap-2">
              <Clock className="text-primary/80 w-4 h-4" />
              <div className="font-mono font-semibold text-primary">
                <BidTimer showLabel={false} showProgress={false} />
              </div>
            </div>
          </div>
        </div>

        {/* وصف */}
        <div className="mb-4 text-center">
          <div className="text-sm text-primary/80">وقت السوق من 10 مساءً إلى 4 عصراً اليوم التالي</div>
          <p className="mt-1 text-foreground/70 text-sm max-w-3xl mx-auto">
            مكمل للسوق الفوري المباشر في تركيبه ويختلف أنه ليس به بث مباشر، وصاحب العرض يستطيع أن يغير سعره
            بالسالب أو الموجب بحد لا يتجاوز 10% من سعر إغلاق الفوري.
          </p>
        </div>

        {/* رسائل الحالة */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-2xl p-5 mb-4 flex items-center gap-3 backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isAllowed && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-2xl p-5 mb-4 flex items-center gap-3 backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>السوق غير مفتوح حاليًا. يفتح يوميًا من 10 مساءً إلى 4 عصراً اليوم التالي.</span>
          </div>
        )}

        {!loading && !error && filteredCars.length === 0 && isAllowed && (
          <div className="bg-primary/10 border border-primary/20 text-primary rounded-2xl p-8 text-center backdrop-blur-sm mb-4">
            <CarIcon className="w-14 h-14 mx-auto mb-4 text-primary/80" />
            <p className="font-semibold text-lg">لا توجد سيارات متاحة حاليًا</p>
          </div>
        )}

        {/* البحث والفلاتر + اختيار الأعمدة */}
        <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border p-5 mb-4 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            {/* بحث سيرفر */}
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-foreground/70 w-5 h-5" />
              <input
                type="text"
                placeholder="بحث (سيرفر): ماركة، موديل، أو رقم الشاصي..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  resetAndReloadServer();
                }}
                className="w-full pr-11 pl-4 py-3 bg-background/70 border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-foreground placeholder-foreground/50 backdrop-blur-sm"
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-sm text-foreground/80 bg-background/60 px-4.5 py-2.5 rounded-xl border border-border">
                <span className="font-semibold text-foreground">{filteredCars.length}</span> من{" "}
                <span className="font-semibold text-foreground">{carsTotal}</span> سيارة
              </div>

              <button
                onClick={() => {
                  setShowColumns((v) => !v);
                  setShowFilters(false);
                }}
                className="flex items-center gap-2.5 px-4.5 py-2.5 border border-border rounded-xl hover:bg-border transition-colors text-foreground/80 hover:text-foreground backdrop-blur-sm"
              >
                <Columns className="w-4.5 h-4.5" />
                الأعمدة
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${showColumns ? "rotate-180" : ""}`}
                />
              </button>

              <button
                onClick={() => {
                  setShowFilters((v) => !v);
                  setShowColumns(false);
                }}
                className="flex items-center gap-2.5 px-4.5 py-2.5 border border-border rounded-xl hover:bg-border transition-colors text-foreground/80 hover:text-foreground backdrop-blur-sm"
              >
                <Filter className="w-4.5 h-4.5" />
                فلاتر
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${showFilters ? "rotate-180" : ""}`}
                />
              </button>

              <button
                onClick={clearAllFilters}
                className="flex items-center gap-2.5 px-4.5 py-2.5 border border-border rounded-xl hover:bg-border transition-colors text-foreground/80 hover:text-foreground backdrop-blur-sm"
                title="تصفير الكل"
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

          {/* ✅ فلاتر متقدمة */}
          {showFilters && (
            <div className="mt-5 pt-5 border-t border-border/40">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* فلتر ماركة (سيرفر) */}
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    ماركة السيارة (سيرفر)
                  </label>
                  <select
                    value={filters.brand}
                    onChange={(e) => {
                      setFilters((prev) => ({ ...prev, brand: e.target.value }));
                      resetAndReloadServer();
                    }}
                    className="w-full p-3 bg-background/70 border border-border rounded-xl focus:ring-primary/50 focus:border-primary/50 text-foreground backdrop-blur-sm"
                  >
                    <option value="" className="bg-card text-foreground/70">
                      جميع الماركات
                    </option>
                    {carsBrands.map((brand, idx) => (
                      <option key={`${brand}-${idx}`} value={brand} className="bg-card text-foreground">
                        {brand}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ✅ Quick search داخل الجدول */}
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    بحث سريع داخل الجدول
                  </label>
                  <input
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                    placeholder="يبحث داخل الأعمدة الظاهرة..."
                    className="w-full p-3 bg-background/70 border border-border rounded-xl focus:ring-primary/50 focus:border-primary/50 text-foreground backdrop-blur-sm"
                  />
                </div>

                {/* فلاتر متقدمة محلية */}
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">المدينة</label>
                  <input
                    value={advanced.city}
                    onChange={(e) => setAdvanced((p) => ({ ...p, city: e.target.value }))}
                    placeholder="مثال: جدة"
                    className="w-full p-3 bg-background/70 border border-border rounded-xl focus:ring-primary/50 focus:border-primary/50 text-foreground backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">الموديل</label>
                  <input
                    value={advanced.model}
                    onChange={(e) => setAdvanced((p) => ({ ...p, model: e.target.value }))}
                    placeholder="مثال: Camry"
                    className="w-full p-3 bg-background/70 border border-border rounded-xl focus:ring-primary/50 focus:border-primary/50 text-foreground backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">سنة من</label>
                  <input
                    type="number"
                    value={advanced.yearFrom}
                    onChange={(e) => setAdvanced((p) => ({ ...p, yearFrom: e.target.value }))}
                    className="w-full p-3 bg-background/70 border border-border rounded-xl focus:ring-primary/50 focus:border-primary/50 text-foreground backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">سنة إلى</label>
                  <input
                    type="number"
                    value={advanced.yearTo}
                    onChange={(e) => setAdvanced((p) => ({ ...p, yearTo: e.target.value }))}
                    className="w-full p-3 bg-background/70 border border-border rounded-xl focus:ring-primary/50 focus:border-primary/50 text-foreground backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">حالة السيارة</label>
                  <input
                    value={advanced.condition}
                    onChange={(e) => setAdvanced((p) => ({ ...p, condition: e.target.value }))}
                    placeholder="مثال: ممتاز"
                    className="w-full p-3 bg-background/70 border border-border rounded-xl focus:ring-primary/50 focus:border-primary/50 text-foreground backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">اللون</label>
                  <input
                    value={advanced.color}
                    onChange={(e) => setAdvanced((p) => ({ ...p, color: e.target.value }))}
                    placeholder="مثال: أبيض"
                    className="w-full p-3 bg-background/70 border border-border rounded-xl focus:ring-primary/50 focus:border-primary/50 text-foreground backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">الوقود/المحرك</label>
                  <input
                    value={advanced.engine}
                    onChange={(e) => setAdvanced((p) => ({ ...p, engine: e.target.value }))}
                    placeholder="مثال: بنزين"
                    className="w-full p-3 bg-background/70 border border-border rounded-xl focus:ring-primary/50 focus:border-primary/50 text-foreground backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">نتيجة المزايدة</label>
                  <select
                    value={advanced.auctionStatus}
                    onChange={(e) =>
                      setAdvanced((p) => ({
                        ...p,
                        auctionStatus: e.target.value as AdvancedFilters["auctionStatus"],
                      }))
                    }
                    className="w-full p-3 bg-background/70 border border-border rounded-xl focus:ring-primary/50 focus:border-primary/50 text-foreground backdrop-blur-sm"
                  >
                    <option value="">الكل</option>
                    <option value="in_auction">جاري المزايدة</option>
                    <option value="sold">تم البيع</option>
                    <option value="expired">انتهى</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setAdvanced(INITIAL_ADVANCED);
                      setQuickSearch("");
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4.5 py-3 border border-border rounded-xl hover:bg-border transition-colors text-foreground/80 hover:text-foreground backdrop-blur-sm"
                  >
                    <RotateCcw className="w-4.5 h-4.5" />
                    مسح فلاتر البحث المتقدم
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* جدول السيارات */}
        {isAllowed && filteredCars.length > 0 && (
          <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-border">
              <div className="flex justify-between items-center gap-3 flex-wrap">
                <h2 className="text-lg md:text-xl font-bold text-primary">السيارات المتاحة</h2>
                <div className="text-xs md:text-sm text-foreground/70">
                  🕙 عند الساعة 10 مساءً يتم التحول من السوق الفوري المباشر إلى السوق المتأخر
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="max-h-[calc(100vh-240px)] overflow-auto" ref={scrollContainerRef}>
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-background/70 backdrop-blur-sm sticky top-0 z-10 border-b border-border">
                      {visibleHeaders.map((colId) => {
                        const label = COLUMN_OPTIONS.find((c) => c.id === colId)?.label ?? "";
                        return (
                          <th
                            key={colId}
                            className="px-4 py-4 text-right text-xs font-semibold text-foreground/70 uppercase tracking-wider whitespace-nowrap"
                          >
                            {colId === "expand" ? "" : label}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {filteredCars.map((row) => {
                      const car = row.car;
                      const bids = row.bids ?? [];
                      const lastBid = bids.length ? bids[bids.length - 1] : null;

                      const minBid = toNumber(row.minimum_bid, 0);
                      const maxBid = toNumber(row.maximum_bid, 0);
                      const curBid = toNumber(row.current_bid, 0);

                      return (
                        <Fragment key={row.id}>
                          <tr className="hover:bg-border/60 transition-colors">
                            {isColVisible("expand") && (
                              <td className="px-4 py-4 text-center">
                                <button
                                  onClick={() => toggleRowExpansion(row.id)}
                                  className="inline-flex items-center justify-center text-foreground/50 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg p-1.5 hover:bg-border transition-colors"
                                  aria-label={expandedRows[row.id] ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                                >
                                  {expandedRows[row.id] ? (
                                    <ChevronUp className="w-5 h-5" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5" />
                                  )}
                                </button>
                              </td>
                            )}

                            {isColVisible("city") && (
                              <td className="px-4 py-4 text-center text-sm text-foreground/80">
                                {car?.city || "—"}
                              </td>
                            )}
                            {isColVisible("make") && (
                              <td className="px-4 py-4 text-center text-sm font-medium text-foreground">
                                {car?.make || "—"}
                              </td>
                            )}
                            {isColVisible("model") && (
                              <td className="px-4 py-4 text-center text-sm text-foreground/80">
                                {car?.model || "—"}
                              </td>
                            )}
                            {isColVisible("year") && (
                              <td className="px-4 py-4 text-center text-sm text-foreground/80">
                                {car?.year ?? "—"}
                              </td>
                            )}
                            {isColVisible("openingPrice") && (
                              <td className="px-4 py-4 text-center text-sm text-secondary dark:text-foreground">
                                {formatCurrency(minBid)}
                              </td>
                            )}
                            {isColVisible("currentBid") && (
                              <td className="px-4 py-4 text-center text-sm font-medium text-primary">
                                {formatCurrency(curBid)}
                              </td>
                            )}
                            {isColVisible("change") && (
                              <td className="px-4 py-4 text-center">
                                {lastBid ? (
                                  <PriceChangeBadge
                                    increment={toNumber(lastBid.increment, 0)}
                                    bidAmount={toNumber(lastBid.bid_amount, 0)}
                                  />
                                ) : (
                                  <span className="text-foreground/50">—</span>
                                )}
                              </td>
                            )}
                            {isColVisible("bidsCount") && (
                              <td className="px-4 py-4 text-center text-sm text-foreground/80">
                                {bids.length}
                              </td>
                            )}
                            {isColVisible("maxBid") && (
                              <td className="px-4 py-4 text-center text-sm text-foreground/80">
                                {formatCurrency(maxBid)}
                              </td>
                            )}

                            {isColVisible("details") && (
                              <td className="px-4 py-4 text-center">
                                {row.car_id ? (
                                  <a
                                    href={`/carDetails/${row.car_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl border border-primary/30"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </a>
                                ) : (
                                  <span className="text-foreground/50">—</span>
                                )}
                              </td>
                            )}
                          </tr>

                          {expandedRows[row.id] && (
                            <tr className="bg-background/30">
                              <td colSpan={visibleHeaders.length} className="px-6 py-5 border-t border-border">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                  <div className="bg-border/50 rounded-xl p-4 border border-border">
                                    <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                                      <CarIcon className="w-4 h-4" />
                                      معلومات السيارة
                                    </h4>
                                    <ul className="space-y-2 text-sm">
                                      <li className="flex justify-between">
                                        <span className="text-foreground/70">العداد:</span>
                                        <span className="text-foreground/90">
                                          {car?.odometer ? `${car.odometer} كم` : "—"}
                                        </span>
                                      </li>
                                      <li className="flex justify-between">
                                        <span className="text-foreground/70">الحالة:</span>
                                        <span className="text-foreground/90">{car?.condition || "—"}</span>
                                      </li>
                                      <li className="flex justify-between">
                                        <span className="text-foreground/70">اللون:</span>
                                        <span className="text-foreground/90">{car?.color || "—"}</span>
                                      </li>
                                      <li className="flex justify-between">
                                        <span className="text-foreground/70">الوقود:</span>
                                        <span className="text-foreground/90">{car?.engine || "—"}</span>
                                      </li>
                                    </ul>
                                  </div>

                                  <div className="bg-border/50 rounded-xl p-4 border border-border">
                                    <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                                      <TrendingUp className="w-4 h-4" />
                                      معلومات المزايدة
                                    </h4>
                                    <ul className="space-y-2 text-sm">
                                      <li className="flex justify-between">
                                        <span className="text-foreground/70">المزايدات:</span>
                                        <span className="text-foreground/90">{bids.length}</span>
                                      </li>
                                      <li className="flex justify-between">
                                        <span className="text-foreground/70">حالة العنصر:</span>
                                        <span className="text-foreground/90">{row.status || "—"}</span>
                                      </li>
                                      <li className="flex justify-between">
                                        <span className="text-foreground/70">نتيجة المزايدة:</span>
                                        <span className="text-foreground/90">{car?.auction_status || "—"}</span>
                                      </li>
                                    </ul>
                                  </div>

                                  <div className="bg-border/50 rounded-xl p-4 border border-border">
                                    <h4 className="font-semibold text-primary mb-3">معلومات الأسعار</h4>
                                    <ul className="space-y-2 text-sm">
                                      <li className="flex justify-between">
                                        <span className="text-foreground/70">سعر الافتتاح:</span>
                                        <span className="text-amber-700 dark:text-amber-400">
                                          {formatCurrency(minBid)}
                                        </span>
                                      </li>
                                      <li className="flex justify-between">
                                        <span className="text-foreground/70">أعلى سعر:</span>
                                        <span className="text-rose-700 dark:text-rose-400">
                                          {formatCurrency(maxBid)}
                                        </span>
                                      </li>
                                      <li className="flex justify-between">
                                        <span className="text-foreground/70">آخر سعر:</span>
                                        <span className="text-emerald-700 dark:text-emerald-400">
                                          {formatCurrency(curBid)}
                                        </span>
                                      </li>

                                      {lastBid && (
                                        <li className="flex justify-between items-center gap-2">
                                          <span className="text-foreground/70">التغيّر:</span>
                                          <PriceChangeBadge
                                            increment={toNumber(lastBid.increment, 0)}
                                            bidAmount={toNumber(lastBid.bid_amount, 0)}
                                          />
                                        </li>
                                      )}
                                    </ul>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>

                {/* حارس السحب اللامتناهي */}
                <div ref={sentryRef} className="py-6 text-center">
                  {loading && currentPage > 1 && (
                    <div className="flex justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  )}
                  {!loading && currentPage >= lastPage && filteredCars.length > 0 && (
                    <p className="text-sm text-foreground/50">تم عرض جميع السيارات</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* حالة التحميل الأولي */}
        {loading && currentPage === 1 && (
          <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border p-10 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-foreground/70">جارٍ تحميل البيانات...</p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import LoadingLink from "@/components/LoadingLink";
import {
  Car as CarIcon,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Eye,
  Play,
  Clock,
  TrendingUp,
  AlertCircle,
  Loader2,
  Columns,
  RotateCcw,
  X,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { formatCurrency } from "@/utils/formatCurrency";
import { usePusher } from "@/contexts/PusherContext";

import { AgGridReact } from "ag-grid-react";
import type { ColDef, ICellRendererParams, GridReadyEvent } from "ag-grid-community";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

// تسجيل جميع وحدات AG Grid المجتمعية (مطلوب في الإصدار 34+)
ModuleRegistry.registerModules([AllCommunityModule]);

// ================= ثابت نوع المزاد =================
const AUCTION_TYPE = "live_instant";
const PAGE_SIZE = 50;

// ================= حفظ اختيارات الأعمدة =================
const COLUMNS_STORAGE_KEY = "instant_auction_columns_v1";

// ✅ قائمة الأعمدة (للـ Column Chooser)
const COLUMN_OPTIONS: Array<{ id: string; label: string; locked?: boolean }> = [
  { id: "stream", label: "رابط البث" },
  { id: "province", label: "المنطقة" },
  { id: "city", label: "المدينة" },
  { id: "make", label: "الماركة" },
  { id: "model", label: "الموديل" },
  { id: "year", label: "السنة" },
  { id: "plate", label: "اللوحة" },
  { id: "odometer", label: "العداد" },
  { id: "condition", label: "حالة السيارة" },
  { id: "color", label: "اللون" },
  { id: "engine", label: "الوقود/المحرك" },
  { id: "bidsCount", label: "المزايدات" },
  { id: "openingPrice", label: "سعر الافتتاح" },
  { id: "minBid", label: "أقل سعر" },
  { id: "maxBid", label: "أعلى سعر" },
  { id: "currentBid", label: "آخر سعر" },
  { id: "lastIncrement", label: "مبلغ الزيادة" },
  { id: "changePercent", label: "نسبة التغير" },
  { id: "auctionStatus", label: "حالة المزاد" },
  { id: "details", label: "التفاصيل", locked: true }, // ✅ خليها دايمًا ظاهرة
];

// =============== أنواع TypeScript ===============
type Broadcast = { stream_url?: string };
type Bid = { bid_amount?: number | string; increment?: number | string };

type CarInfo = {
  province?: string;
  city?: string;
  make?: string;
  model?: string;
  year?: number;
  plate?: string;
  odometer?: string;
  condition?: string;
  color?: string;
  engine?: string;
  auction_status?: string;
};

interface CarAuction {
  id: number;
  car_id: number;
  opening_price: number | string;
  minimum_bid: number | string;
  maximum_bid: number | string;
  current_bid: number | string;
  auction_type?: string;
  broadcasts: Broadcast[];
  bids: Bid[];
  car?: CarInfo | null;
}

interface FilterOptions {
  brand: string;
}

type AdvancedFilters = {
  province: string;
  city: string;
  model: string;
  plate: string;
  yearFrom: string;
  yearTo: string;
  auctionStatus: "" | "in_auction" | "sold" | "expired";
};

const INITIAL_ADVANCED: AdvancedFilters = {
  province: "",
  city: "",
  model: "",
  plate: "",
  yearFrom: "",
  yearTo: "",
  auctionStatus: "",
};

// =============== دوال مساعدة ===============
function getAuctionStatus(status: string): string {
  const map: Record<string, string> = {
    in_auction: "جاري المزايدة",
    sold: "تم البيع",
    expired: "انتهى",
  };
  return map[status] || "غير محدد";
}

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

function normalizeAuction(raw: any): CarAuction {
  return {
    id: raw?.id ?? 0,
    car_id: raw?.car_id ?? raw?.car?.id ?? 0,
    opening_price: raw?.opening_price ?? raw?.starting_bid ?? raw?.evaluation_price ?? 0,
    minimum_bid: raw?.minimum_bid ?? raw?.min_price ?? 0,
    maximum_bid: raw?.maximum_bid ?? raw?.max_price ?? 0,
    current_bid: raw?.current_bid ?? 0,
    auction_type: raw?.auction_type ?? raw?.type ?? "",
    broadcasts: Array.isArray(raw?.broadcasts) ? raw.broadcasts : [],
    bids: Array.isArray(raw?.bids) ? raw.bids : [],
    car: raw?.car ?? null,
  };
}

function loadSavedColumnVisibility(): Record<string, boolean> {
  // default: كل الأعمدة ظاهرة
  const defaults: Record<string, boolean> = {};
  COLUMN_OPTIONS.forEach((c) => (defaults[c.id] = true));

  if (typeof window === "undefined") return defaults;

  try {
    const raw = window.localStorage.getItem(COLUMNS_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    // اضمن وجود كل الأعمدة + اجبر locked = true
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

// =============== المكون الرئيسي ===============
export default function InstantAuctionPage() {
  // =============== الحالة ===============
  const [searchTerm, setSearchTerm] = useState("");
  const [quickFilter, setQuickFilter] = useState(""); // ✅ بحث سريع داخل الجدول (AG Grid Quick Filter)
  const [showFilters, setShowFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);

  const [carsBrands, setCarsBrands] = useState<string[]>([]);
  const [carsTotal, setCarsTotal] = useState(0);
  const [isAllowed, setIsAllowed] = useState(true);
  const [cars, setCars] = useState<CarAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const [filters, setFilters] = useState<FilterOptions>({ brand: "" });
  const [advanced, setAdvanced] = useState<AdvancedFilters>(INITIAL_ADVANCED);

  // ✅ Column visibility model (محفوظ في localStorage)
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() =>
    loadSavedColumnVisibility()
  );

  // لعدد الصفوف المعروضة بعد فلاتر الجريد
  const [displayedCount, setDisplayedCount] = useState(0);

  // =============== Infinity Scroll ===============
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentryRef = useRef<HTMLDivElement>(null);
  const loadingGateRef = useRef(false);

  // لمنع race condition لما الصفحة تتغير بسرعة
  const requestSeqRef = useRef(0);

  // ✅ Ref للـ Grid
  const gridRef = useRef<AgGridReact<CarAuction>>(null);

  // =============== مكون حالة المزاد ===============
  const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { bg: string; text: string; border: string; icon: typeof Play }> =
      {
        "جاري المزايدة": {
          bg: "bg-blue-500",
          text: "text-white",
          border: "border-blue-600",
          icon: Play,
        },
        "تم البيع": {
          bg: "bg-emerald-500",
          text: "text-white",
          border: "border-emerald-600",
          icon: TrendingUp,
        },
        انتهى: {
          bg: "bg-gray-500",
          text: "text-white",
          border: "border-gray-600",
          icon: Clock,
        },
      };

    const statusConfig = config[status] || {
      bg: "bg-amber-500",
      text: "text-white",
      border: "border-amber-600",
      icon: AlertCircle,
    };

    const Icon = statusConfig.icon;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
      >
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  // =============== إعداد أعمدة AG Grid ===============
  const columnDefs = useMemo<ColDef<CarAuction>[]>(
    () => [
      {
        colId: "stream",
        headerName: "رابط البث",
        field: "broadcasts",
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams<CarAuction>) => {
          const broadcasts = params.data?.broadcasts ?? [];
          const url = broadcasts?.[0]?.stream_url;
          if (!url) return <span className="text-foreground/50">—</span>;

          return (
            <LoadingLink
              target="_blank"
              href={url}
              className="text-primary hover:text-primary/80 font-medium hover:underline transition-colors"
            >
              مشاهدة البث
            </LoadingLink>
          );
        },
      },
      {
        colId: "province",
        headerName: "المنطقة",
        valueGetter: (params) => params.data?.car?.province || "",
        filter: "agTextColumnFilter",
      },
      {
        colId: "city",
        headerName: "المدينة",
        valueGetter: (params) => params.data?.car?.city || "",
        filter: "agTextColumnFilter",
      },
      {
        colId: "make",
        headerName: "الماركة",
        valueGetter: (params) => params.data?.car?.make || "",
        filter: "agTextColumnFilter",
      },
      {
        colId: "model",
        headerName: "الموديل",
        valueGetter: (params) => params.data?.car?.model || "",
        filter: "agTextColumnFilter",
      },
      {
        colId: "year",
        headerName: "السنة",
        valueGetter: (params) => params.data?.car?.year ?? "",
        filter: "agNumberColumnFilter",
        type: "numericColumn",
      },
      {
        colId: "plate",
        headerName: "اللوحة",
        valueGetter: (params) => params.data?.car?.plate || "",
        filter: "agTextColumnFilter",
      },
      {
        colId: "odometer",
        headerName: "العداد",
        valueGetter: (params) => params.data?.car?.odometer || "",
        filter: "agTextColumnFilter",
      },
      {
        colId: "condition",
        headerName: "حالة السيارة",
        valueGetter: (params) => params.data?.car?.condition || "",
        filter: "agTextColumnFilter",
      },
      {
        colId: "color",
        headerName: "اللون",
        valueGetter: (params) => params.data?.car?.color || "",
        filter: "agTextColumnFilter",
      },
      {
        colId: "engine",
        headerName: "الوقود/المحرك",
        valueGetter: (params) => params.data?.car?.engine || "",
        filter: "agTextColumnFilter",
      },
      {
        colId: "bidsCount",
        headerName: "المزايدات",
        valueGetter: (params) => params.data?.bids?.length ?? 0,
        type: "numericColumn",
        filter: "agNumberColumnFilter",
      },
      {
        colId: "openingPrice",
        headerName: "سعر الافتتاح",
        valueGetter: (params) => toNumber(params.data?.opening_price, 0),
        cellRenderer: (params: ICellRendererParams<CarAuction>) =>
          formatCurrency(params.value ?? 0),
        type: "numericColumn",
        filter: "agNumberColumnFilter",
      },
      {
        colId: "minBid",
        headerName: "أقل سعر",
        valueGetter: (params) => toNumber(params.data?.minimum_bid, 0),
        cellRenderer: (params: ICellRendererParams<CarAuction>) =>
          formatCurrency(params.value ?? 0),
        type: "numericColumn",
        filter: "agNumberColumnFilter",
      },
      {
        colId: "maxBid",
        headerName: "أعلى سعر",
        valueGetter: (params) => toNumber(params.data?.maximum_bid, 0),
        cellRenderer: (params: ICellRendererParams<CarAuction>) =>
          formatCurrency(params.value ?? 0),
        type: "numericColumn",
        filter: "agNumberColumnFilter",
      },
      {
        colId: "currentBid",
        headerName: "آخر سعر",
        valueGetter: (params) => toNumber(params.data?.current_bid, 0),
        cellRenderer: (params: ICellRendererParams<CarAuction>) =>
          formatCurrency(params.value ?? 0),
        type: "numericColumn",
        filter: "agNumberColumnFilter",
      },
      {
        colId: "lastIncrement",
        headerName: "مبلغ الزيادة",
        valueGetter: (params) => {
          const bids = params.data?.bids ?? [];
          if (!bids.length) return 0;
          return toNumber(bids[bids.length - 1]?.increment, 0);
        },
        type: "numericColumn",
        filter: "agNumberColumnFilter",
      },
      {
        colId: "changePercent",
        headerName: "نسبة التغير",
        valueGetter: (params) => {
          const bids = params.data?.bids ?? [];
          if (!bids.length) return "0%";
          const lastBid = bids[bids.length - 1];
          const bidAmount = toNumber(lastBid?.bid_amount, 0);
          const inc = toNumber(lastBid?.increment, 0);
          if (!bidAmount) return "0%";
          const percent = (inc / bidAmount) * 100;
          return `${percent.toFixed(2)}%`;
        },
        filter: "agTextColumnFilter",
      },
      {
        colId: "auctionStatus",
        headerName: "حالة المزاد",
        sortable: true,
        filter: false,
        cellRenderer: (params: ICellRendererParams<CarAuction>) => {
          const status = getAuctionStatus(params.data?.car?.auction_status || "");
          return <StatusBadge status={status} />;
        },
      },
      {
        colId: "details",
        headerName: "التفاصيل",
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams<CarAuction>) => {
          const carId = params.data?.car_id;
          if (!carId) return null;
          return (
            <LoadingLink
              href={`/carDetails/${carId}`}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl border border-primary/30"
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
      floatingFilter: true, // ✅ بحث متقدم لكل عمود (Floating Filters)
      resizable: true,
      flex: 1,
      minWidth: 120,
      suppressHeaderMenuButton: false, // ✅ إظهار قائمة الهيدر (فلاتر/إعدادات)
    }),
    []
  );

  // ✅ تطبيق إظهار/إخفاء الأعمدة على الجريد + حفظها
  const applyColumnsVisibility = useCallback(
    (model: Record<string, boolean>) => {
      const api = gridRef.current?.api as any;
      if (!api) return;

      // اجبر الأعمدة المقفولة تظل ظاهرة
      const forced = { ...model };
      COLUMN_OPTIONS.forEach((c) => {
        if (c.locked) forced[c.id] = true;
      });

      // طبّق على الجريد
      for (const col of COLUMN_OPTIONS) {
        api.setColumnsVisible?.([col.id], Boolean(forced[col.id]));
      }

      // خزّن
      saveColumnVisibility(forced);
    },
    []
  );

  // =============== جلب البيانات (معدل عشان يتوافق مع Laravel) ===============
  const fetchAuctions = useCallback(async () => {
    const seq = ++requestSeqRef.current;

    loadingGateRef.current = true;
    setLoading(currentPage === 1);
    setError(null);

    try {
      const allowed = await isWithinAllowedTime("instant_auction");
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
      const normalizedRows = rows.map(normalizeAuction);

      const brands = Array.isArray(response.data?.brands) ? response.data.brands : [];
      const total = toNumber(paginated?.total, 0);
      const lp = toNumber(paginated?.last_page, 1);

      if (seq !== requestSeqRef.current) return;

      setCarsBrands(brands);
      setCarsTotal(total);
      setLastPage(lp);

      setCars((prev) => (currentPage > 1 ? [...prev, ...normalizedRows] : normalizedRows));
    } catch (err) {
      console.error("فشل تحميل المزادات", err);

      if (seq === requestSeqRef.current) {
        setError("حدث خطأ أثناء تحميل البيانات. يرجى المحاولة لاحقًا.");
        if (currentPage === 1) setCars([]);
      }
    } finally {
      if (seq === requestSeqRef.current) setLoading(false);
      loadingGateRef.current = false;
    }
  }, [currentPage, searchTerm, filters.brand]);

  // =============== تأثير جلب البيانات ===============
  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  // =============== Pusher الاشتراك في قناة ===============
  const { subscribe, unsubscribe, isConnected } = usePusher();

  useEffect(() => {
    if (!isConnected) return;

    const channel = subscribe("auction.instant");
    if (!channel) return;

    channel.bind("CarMovedBetweenAuctionsEvent", () => {
      setCurrentPage(1);
      setCars([]);
    });

    channel.bind("AuctionStatusChangedEvent", (data: any) => {
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
      toast.success(
        `تم تغيير حالة مزاد ${data.car_make} ${data.car_model} من ${oldLabel} إلى ${newLabel}`
      );
    });

    return () => {
      unsubscribe("auction.instant");
    };
  }, [isConnected, subscribe, unsubscribe]);

  // =============== Infinity Scroll ===============
  useEffect(() => {
    const container = scrollContainerRef.current;
    const sentry = sentryRef.current;
    if (!container || !sentry) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          !loadingGateRef.current &&
          isAllowed &&
          currentPage < lastPage
        ) {
          setCurrentPage((p) => p + 1);
        }
      },
      { root: container, rootMargin: "800px" }
    );

    observer.observe(sentry);
    return () => observer.disconnect();
  }, [currentPage, lastPage, isAllowed]);

  // =============== تصفية السيارات (Client-side Advanced Filters) ===============
  const filteredCars = useMemo(() => {
    const provinceQ = safeLower(advanced.province);
    const cityQ = safeLower(advanced.city);
    const modelQ = safeLower(advanced.model);
    const plateQ = safeLower(advanced.plate);

    const yearFrom = advanced.yearFrom ? toNumber(advanced.yearFrom, 0) : 0;
    const yearTo = advanced.yearTo ? toNumber(advanced.yearTo, 9999) : 9999;

    return cars.filter((row) => {
      const car = row.car ?? {};

      const make = car.make || "";
      if (filters.brand && filters.brand !== make) return false;

      if (provinceQ && !safeLower(car.province).includes(provinceQ)) return false;
      if (cityQ && !safeLower(car.city).includes(cityQ)) return false;
      if (modelQ && !safeLower(car.model).includes(modelQ)) return false;
      if (plateQ && !safeLower(car.plate).includes(plateQ)) return false;

      const y = toNumber(car.year, 0);
      if (advanced.yearFrom && y < yearFrom) return false;
      if (advanced.yearTo && y > yearTo) return false;

      if (advanced.auctionStatus && car.auction_status !== advanced.auctionStatus) return false;

      return true;
    });
  }, [cars, filters.brand, advanced]);

  // =============== Helpers لتصفير الداتا عند تغيير بحث السيرفر/الفلتر السيرفري ===============
  const resetAndReloadServer = () => {
    setCars([]);
    setCurrentPage(1);
  };

  // ✅ مسح كل الفلاتر (سيرفر + محلي + فلاتر الجريد)
  const clearAllFilters = () => {
    setSearchTerm("");
    setQuickFilter("");
    setFilters({ brand: "" });
    setAdvanced(INITIAL_ADVANCED);
    setShowFilters(false);

    // امسح فلاتر الجريد نفسها
    const api = gridRef.current?.api as any;
    api?.setFilterModel?.(null);
    api?.onFilterChanged?.();

    resetAndReloadServer();
  };

  // ✅ Column chooser handlers
  const toggleColumn = (id: string) => {
    const colMeta = COLUMN_OPTIONS.find((c) => c.id === id);
    if (colMeta?.locked) return;

    setColumnVisibility((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      // enforce locked
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

  // ✅ لما الجريد يجهز: طبّق اختيارات الأعمدة المحفوظة
  const onGridReady = (params: GridReadyEvent<CarAuction>) => {
    applyColumnsVisibility(columnVisibility);
    setDisplayedCount(params.api.getDisplayedRowCount());
  };

  const syncDisplayedCount = () => {
    const api = gridRef.current?.api as any;
    if (!api) {
      setDisplayedCount(filteredCars.length);
      return;
    }
    setDisplayedCount(api.getDisplayedRowCount?.() ?? filteredCars.length);
  };

  // كل ما يتغير rowData، حدّث العدد
  useEffect(() => {
    // تأخير بسيط عشان الجريد يلحق يطبّق quickFilter/filters
    const t = setTimeout(syncDisplayedCount, 0);
    return () => clearTimeout(t);
  }, [filteredCars, quickFilter]);

  // =============== العرض الرئيسي ===============
  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* التنقل العلوي */}
        <div className="flex justify-end mb-6">
          <LoadingLink
            href="/auctions"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors px-4 py-2.5 text-sm rounded-xl border border-border hover:border-primary/50 bg-card/50 hover:bg-card backdrop-blur-sm"
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            العودة إلى الأسواق
          </LoadingLink>
        </div>

        {/* العنوان الرئيسي */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary">السوق الفوري المباشر</h1>
          <div className="mt-3 flex items-center justify-center gap-2.5 text-sm text-primary/80 bg-card/60 backdrop-blur-sm px-5 py-2.5 rounded-xl max-w-max mx-auto border border-border">
            <Clock className="w-4 h-4" />
            <span>من 7 مساءً إلى 10 مساءً يوميًا</span>
          </div>
        </div>

        {/* لوحة التحكم */}
        <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border p-5 mb-6 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            {/* بحث السيرفر */}
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-foreground/70 w-5 h-5" />
              <input
                type="text"
                placeholder="بحث شامل (سيرفر): ماركة/موديل/شاصي..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  resetAndReloadServer();
                }}
                className="w-full pr-11 pl-4 py-3.5 bg-background/70 border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-foreground placeholder-foreground/50 backdrop-blur-sm"
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-sm text-foreground/80 bg-background/60 px-4.5 py-2.5 rounded-xl border border-border">
                <span className="font-semibold text-foreground">{displayedCount}</span>{" "}
                من{" "}
                <span className="font-semibold text-foreground">{carsTotal}</span>{" "}
                سيارة
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
                  className={`w-4 h-4 transition-transform duration-300 ${
                    showColumns ? "rotate-180" : ""
                  }`}
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
                  className={`w-4 h-4 transition-transform duration-300 ${
                    showFilters ? "rotate-180" : ""
                  }`}
                />
              </button>

              <button
                onClick={clearAllFilters}
                className="flex items-center gap-2.5 px-4.5 py-2.5 border border-border rounded-xl hover:bg-border transition-colors text-foreground/80 hover:text-foreground backdrop-blur-sm"
                title="مسح كل الفلاتر"
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
                      {disabled && (
                        <span className="text-xs text-foreground/60 mr-auto">
                          (إجباري)
                        </span>
                      )}
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
                      <option
                        key={`${brand}-${idx}`}
                        value={brand}
                        className="bg-card text-foreground"
                      >
                        {brand}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ✅ بحث سريع داخل الجدول (لا يعيد تحميل من السيرفر) */}
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    بحث سريع داخل الجدول
                  </label>
                  <input
                    value={quickFilter}
                    onChange={(e) => setQuickFilter(e.target.value)}
                    placeholder="يبحث في كل الأعمدة المعروضة..."
                    className="w-full p-3 bg-background/70 border border-border rounded-xl focus:ring-primary/50 focus:border-primary/50 text-foreground backdrop-blur-sm"
                  />
                </div>

                {/* فلاتر متقدمة (Client-side على البيانات المحمّلة) */}
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    المنطقة
                  </label>
                  <input
                    value={advanced.province}
                    onChange={(e) => setAdvanced((p) => ({ ...p, province: e.target.value }))}
                    placeholder="مثال: الرياض"
                    className="w-full p-3 bg-background/70 border border-border rounded-xl focus:ring-primary/50 focus:border-primary/50 text-foreground backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    المدينة
                  </label>
                  <input
                    value={advanced.city}
                    onChange={(e) => setAdvanced((p) => ({ ...p, city: e.target.value }))}
                    placeholder="مثال: جدة"
                    className="w-full p-3 bg-background/70 border border-border rounded-xl focus:ring-primary/50 focus:border-primary/50 text-foreground backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    الموديل
                  </label>
                  <input
                    value={advanced.model}
                    onChange={(e) => setAdvanced((p) => ({ ...p, model: e.target.value }))}
                    placeholder="مثال: Camry"
                    className="w-full p-3 bg-background/70 border border-border rounded-xl focus:ring-primary/50 focus:border-primary/50 text-foreground backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    اللوحة
                  </label>
                  <input
                    value={advanced.plate}
                    onChange={(e) => setAdvanced((p) => ({ ...p, plate: e.target.value }))}
                    placeholder="جزء من رقم اللوحة..."
                    className="w-full p-3 bg-background/70 border border-border rounded-xl focus:ring-primary/50 focus:border-primary/50 text-foreground backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    سنة من
                  </label>
                  <input
                    type="number"
                    value={advanced.yearFrom}
                    onChange={(e) => setAdvanced((p) => ({ ...p, yearFrom: e.target.value }))}
                    className="w-full p-3 bg-background/70 border border-border rounded-xl focus:ring-primary/50 focus:border-primary/50 text-foreground backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    سنة إلى
                  </label>
                  <input
                    type="number"
                    value={advanced.yearTo}
                    onChange={(e) => setAdvanced((p) => ({ ...p, yearTo: e.target.value }))}
                    className="w-full p-3 bg-background/70 border border-border rounded-xl focus:ring-primary/50 focus:border-primary/50 text-foreground backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    حالة المزاد
                  </label>
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
                      setQuickFilter("");
                      const api = gridRef.current?.api as any;
                      api?.setFilterModel?.(null);
                      api?.onFilterChanged?.();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4.5 py-3 border border-border rounded-xl hover:bg-border transition-colors text-foreground/80 hover:text-foreground backdrop-blur-sm"
                  >
                    <RotateCcw className="w-4.5 h-4.5" />
                    مسح فلاتر البحث المتقدم
                  </button>
                </div>
              </div>

              <div className="mt-3 text-xs text-foreground/60">
                ملاحظة: فلاتر الأعمدة (تحت الهيدر) تعمل داخل الجدول أيضًا، وتعتبر بحثًا متقدمًا لكل عمود.
              </div>
            </div>
          )}
        </div>

        {/* رسائل الحالة */}
        {!isAllowed && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-foreground rounded-2xl p-5 mb-6 flex items-center gap-3 backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-500" />
            <span>السوق غير مفتوح حاليًا. يفتح يوميًا من 7 مساءً إلى 10 مساءً.</span>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-foreground rounded-2xl p-5 mb-6 flex items-center gap-3 backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && filteredCars.length === 0 && isAllowed && (
          <div className="bg-primary/10 border border-primary/20 text-primary rounded-2xl p-8 text-center backdrop-blur-sm">
            <CarIcon className="w-14 h-14 mx-auto mb-4 text-primary/80" />
            <p className="font-semibold text-lg">لا توجد سيارات متاحة في السوق الفوري حاليًا</p>
            <p className="text-sm mt-2 opacity-80">سيتم تحديث القائمة تلقائيًا عند توفر سيارات جديدة</p>
          </div>
        )}

        {/* جدول السيارات باستخدام AG Grid */}
        {isAllowed && filteredCars.length > 0 && (
          <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <div ref={scrollContainerRef} className="max-h-[70vh] overflow-auto px-2 py-2">
                <div className="ag-theme-alpine" style={{ width: "100%", height: "60vh", direction: "rtl" }}>
                  <AgGridReact<CarAuction>
                    ref={gridRef}
                    rowData={filteredCars}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    quickFilterText={quickFilter} // ✅ Quick Filter
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

                {/* مؤشر التمرير اللامتناهي */}
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
            <p className="text-foreground/70">جارٍ تحميل بيانات السوق الفوري...</p>
          </div>
        )}
      </div>
    </div>
  );
}

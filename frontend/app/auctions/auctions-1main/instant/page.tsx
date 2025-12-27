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
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { formatCurrency } from "@/utils/formatCurrency";
import Pusher from "pusher-js";

import { AgGridReact } from "ag-grid-react";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

// تسجيل جميع وحدات AG Grid المجتمعية (مطلوب في الإصدار 34+)
ModuleRegistry.registerModules([AllCommunityModule]);

// =============== أنواع TypeScript ===============
interface CarAuction {
  id: number;
  car_id: number;
  opening_price: number;
  minimum_bid: number;
  maximum_bid: number;
  current_bid: number;
  auction_type: string;
  broadcasts: { stream_url: string }[];
  bids: { bid_amount: number; increment: number }[];
  car: {
    province: string;
    city: string;
    make: string;
    model: string;
    year: number;
    plate: string;
    odometer: string;
    condition: string;
    color: string;
    engine: string;
    auction_status: string;
  };
}

interface FilterOptions {
  brand: string;
}

// =============== دوال مساعدة ===============
function getAuctionStatus(status: string): string {
  const map: Record<string, string> = {
    in_auction: "جاري المزايدة",
    sold: "تم البيع",
    expired: "انتهى",
  };
  return map[status] || "غير محدد";
}

async function isWithinAllowedTime(page: string): Promise<boolean> {
  try {
    const response = await api.get(`api/check-time?page=${page}`);
    return response.data.allowed;
  } catch {
    return false;
  }
}

// =============== المكون الرئيسي ===============
export default function InstantAuctionPage() {
  // =============== الحالة ===============
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [carsBrands, setCarsBrands] = useState<string[]>([]);
  const [carsTotal, setCarsTotal] = useState(0);
  const [isAllowed, setIsAllowed] = useState(true);
  const [cars, setCars] = useState<CarAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const [filters, setFilters] = useState<FilterOptions>({ brand: "" });
  const { isLoggedIn } = useAuth();
  const router = useLoadingRouter();

  // =============== Infinity Scroll ===============
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentryRef = useRef<HTMLDivElement>(null);
  const loadingGateRef = useRef(false);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // =============== مكون حالة المزاد ===============
  const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<
      string,
      { bg: string; text: string; border: string; icon: typeof Play }
    > = {
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
        headerName: "رابط البث",
        field: "broadcasts",
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams<CarAuction>) => {
          const broadcasts = params.data?.broadcasts || [];
          if (!broadcasts.length) {
            return <span className="text-foreground/50">—</span>;
          }
          return (
            <LoadingLink
              target="_blank"
              href={broadcasts[0].stream_url}
              className="text-primary hover:text-primary/80 font-medium hover:underline transition-colors"
            >
              مشاهدة البث
            </LoadingLink>
          );
        },
      },
      {
        headerName: "المنطقة",
        valueGetter: (params) => params.data?.car.province || "",
        filter: "agTextColumnFilter",
      },
      {
        headerName: "المدينة",
        valueGetter: (params) => params.data?.car.city || "",
        filter: "agTextColumnFilter",
      },
      {
        headerName: "الماركة",
        valueGetter: (params) => params.data?.car.make || "",
        filter: "agTextColumnFilter",
      },
      {
        headerName: "الموديل",
        valueGetter: (params) => params.data?.car.model || "",
        filter: "agTextColumnFilter",
      },
      {
        headerName: "السنة",
        valueGetter: (params) => params.data?.car.year ?? "",
        filter: "agNumberColumnFilter",
        type: "numericColumn",
      },
      {
        headerName: "اللوحة",
        valueGetter: (params) => params.data?.car.plate || "",
        filter: "agTextColumnFilter",
      },
      {
        headerName: "العداد",
        valueGetter: (params) => params.data?.car.odometer || "",
        filter: "agTextColumnFilter",
      },
      {
        headerName: "الحالة",
        valueGetter: (params) => params.data?.car.condition || "",
        filter: "agTextColumnFilter",
      },
      {
        headerName: "اللون",
        valueGetter: (params) => params.data?.car.color || "",
        filter: "agTextColumnFilter",
      },
      {
        headerName: "الوقود",
        valueGetter: (params) => params.data?.car.engine || "",
        filter: "agTextColumnFilter",
      },
      {
        headerName: "المزايدات",
        valueGetter: (params) => params.data?.bids.length ?? 0,
        type: "numericColumn",
        filter: "agNumberColumnFilter",
      },
      {
        headerName: "سعر الافتتاح",
        valueGetter: (params) => {
          const val = params.data?.opening_price;
          return typeof val === "string" ? parseFloat(val) : val ?? 0;
        },
        cellRenderer: (params: ICellRendererParams<CarAuction>) =>
          formatCurrency(params.value ?? 0),
        type: "numericColumn",
        filter: "agNumberColumnFilter",
      },
      {
        headerName: "أقل سعر",
        valueGetter: (params) => {
          const val = params.data?.minimum_bid;
          return typeof val === "string" ? parseFloat(val) : val ?? 0;
        },
        cellRenderer: (params: ICellRendererParams<CarAuction>) =>
          formatCurrency(params.value ?? 0),
        type: "numericColumn",
        filter: "agNumberColumnFilter",
      },
      {
        headerName: "أعلى سعر",
        valueGetter: (params) => {
          const val = params.data?.maximum_bid;
          return typeof val === "string" ? parseFloat(val) : val ?? 0;
        },
        cellRenderer: (params: ICellRendererParams<CarAuction>) =>
          formatCurrency(params.value ?? 0),
        type: "numericColumn",
        filter: "agNumberColumnFilter",
      },
      {
        headerName: "آخر سعر",
        valueGetter: (params) => {
          const val = params.data?.current_bid;
          return typeof val === "string" ? parseFloat(val) : val ?? 0;
        },
        cellRenderer: (params: ICellRendererParams<CarAuction>) =>
          formatCurrency(params.value ?? 0),
        type: "numericColumn",
        filter: "agNumberColumnFilter",
      },
      {
        headerName: "مبلغ الزيادة",
        valueGetter: (params) => {
          const bids = params.data?.bids || [];
          if (!bids.length) return 0;
          return bids[bids.length - 1].increment;
        },
        type: "numericColumn",
        filter: "agNumberColumnFilter",
      },
      {
        headerName: "نسبة التغير",
        valueGetter: (params) => {
          const bids = params.data?.bids || [];
          if (!bids.length) return "0%";
          const lastBid = bids[bids.length - 1];
          if (!lastBid.bid_amount) return "0%";
          const percent = (lastBid.increment / lastBid.bid_amount) * 100;
          return `${percent.toFixed(2)}%`;
        },
        filter: "agTextColumnFilter",
      },
      {
        headerName: "الحالة",
        field: "car.auction_status",
        sortable: true,
        filter: false,
        cellRenderer: (params: ICellRendererParams<CarAuction>) => {
          const status = getAuctionStatus(
            params.data?.car.auction_status || ""
          );
          return <StatusBadge status={status} />;
        },
      },
      {
        headerName: "التفاصيل",
        field: "car_id",
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
      resizable: true,
      flex: 1,
      minWidth: 120,
      // مفيش منيو للأعمدة في النسخة المجانية، فبنخفي زرار المينيو لو موجود
      suppressHeaderMenuButton: true,
    }),
    []
  );

  // =============== جلب البيانات ===============
  const fetchAuctions = useCallback(async () => {
    loadingGateRef.current = true;
    setLoading(currentPage === 1);

    try {
      const allowed = await isWithinAllowedTime("instant_auction");
      setIsAllowed(allowed);

      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (filters.brand) params.append("brand", filters.brand);

      const response = await api.get(
        `/api/approved-auctions/live_instant?page=${currentPage}&pageSize=${pageSize}&${params.toString()}`,
        { headers: { Accept: "application/json; charset=UTF-8" } }
      );

      const data = response.data.data;
      if (data) {
        setCarsBrands(response.data.brands || []);
        setTotalCount(data.total);
        setCarsTotal(response.data.total?.total || 0);
        setCars((prev) =>
          currentPage > 1 ? [...prev, ...data.data] : data.data
        );
      }
    } catch (err) {
      console.error("فشل تحميل المزادات", err);
      setError("حدث خطأ أثناء تحميل البيانات. يرجى المحاولة لاحقًا.");
      if (currentPage === 1) setCars([]);
    } finally {
      setLoading(false);
      loadingGateRef.current = false;
    }
  }, [currentPage, searchTerm, filters, isLoggedIn]);

  // =============== تأثير جلب البيانات ===============
  useEffect(() => {
    fetchAuctions();

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2",
    });

    const channel = pusher.subscribe("auction.instant");
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
      pusher.unsubscribe("auction.instant");
      pusher.disconnect();
    };
  }, [fetchAuctions]);

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
          currentPage < totalPages
        ) {
          setCurrentPage((p) => p + 1);
        }
      },
      { root: container, rootMargin: "800px" }
    );

    observer.observe(sentry);
    return () => observer.disconnect();
  }, [currentPage, totalPages, isAllowed]);

  // =============== تصفية السيارات ===============
  const filteredCars = cars.filter((car) => {
    if (filters.brand && filters.brand !== car.car.make) return false;
    return true;
  });

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
          <h1 className="text-3xl md:text-4xl font-bold text-primary">
            السوق الفوري المباشر
          </h1>
          <div className="mt-3 flex items-center justify-center gap-2.5 text-sm text-primary/80 bg-card/60 backdrop-blur-sm px-5 py-2.5 rounded-xl max-w-max mx-auto border border-border">
            <Clock className="w-4 h-4" />
            <span>من 7 مساءً إلى 10 مساءً يوميًا</span>
          </div>
        </div>

        {/* لوحة التحكم */}
        <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border p-5 mb-6 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-foreground/70 w-5 h-5" />
              <input
                type="text"
                placeholder="ابحث بالماركة، الموديل، أو رقم الشاصي..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pr-11 pl-4 py-3.5 bg-background/70 border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-foreground placeholder-foreground/50 backdrop-blur-sm"
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="text-sm text-foreground/80 bg-background/60 px-4.5 py-2.5 rounded-xl border border-border">
                <span className="font-semibold text-foreground">
                  {filteredCars.length}
                </span>{" "}
                من{" "}
                <span className="font-semibold text-foreground">
                  {carsTotal}
                </span>{" "}
                سيارة
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
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
            </div>
          </div>

          {/* فلاتر متقدمة */}
          {showFilters && (
            <div className="mt-5 pt-5 border-t border-border/40">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    ماركة السيارة
                  </label>
                  <select
                    value={filters.brand}
                    onChange={(e) => {
                      setFilters((prev) => ({
                        ...prev,
                        brand: e.target.value,
                      }));
                      setCurrentPage(1);
                    }}
                    className="w-full p-3 bg-background/70 border border-border rounded-xl focus:ring-primary/50 focus:border-primary/50 text-foreground backdrop-blur-sm"
                  >
                    <option value="" className="bg-card text-foreground/70">
                      جميع الماركات
                    </option>
                    {carsBrands.map((brand, idx) => (
                      <option
                        key={idx}
                        value={brand}
                        className="bg-card text-foreground"
                      >
                        {brand}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* رسائل الحالة */}
        {!isAllowed && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-foreground rounded-2xl p-5 mb-6 flex items-center gap-3 backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-500" />
            <span>
              السوق غير مفتوح حاليًا. يفتح يوميًا من 7 مساءً إلى 10 مساءً.
            </span>
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
            <p className="font-semibold text-lg">
              لا توجد سيارات متاحة في السوق الفوري حاليًا
            </p>
            <p className="text-sm mt-2 opacity-80">
              سيتم تحديث القائمة تلقائيًا عند توفر سيارات جديدة
            </p>
          </div>
        )}

        {/* جدول السيارات باستخدام AG Grid */}
        {isAllowed && filteredCars.length > 0 && (
          <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <div
                ref={scrollContainerRef}
                className="max-h-[70vh] overflow-auto px-2 py-2"
              >
                <div
                  className="ag-theme-alpine"
                  style={{ width: "100%", height: "60vh", direction: "rtl" }}
                >
                  <AgGridReact<CarAuction>
                    rowData={filteredCars}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    animateRows
                    enableRtl
                    suppressCellFocus
                    rowHeight={52}
                    headerHeight={48}
                  />
                </div>

                {/* مؤشر التمرير اللامتناهي */}
                <div ref={sentryRef} className="py-6 text-center">
                  {loading && currentPage > 1 && (
                    <div className="flex justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  )}
                  {!loading &&
                    currentPage >= totalPages &&
                    filteredCars.length > 0 && (
                      <p className="text-sm text-foreground/50">
                        تم عرض جميع السيارات
                      </p>
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
            <p className="text-foreground/70">
              جارٍ تحميل بيانات السوق الفوري...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

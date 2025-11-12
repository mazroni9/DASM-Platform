"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import LoadingLink from "@/components/LoadingLink";
import {
  Car,
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
import Pusher from 'pusher-js';

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

  // Removed client-side authentication redirect - now handled by middleware
  // Public page: authentication only required for bidding actions

  // =============== جلب البيانات ===============
  const fetchAuctions = useCallback(async () => {
    
    
    loadingGateRef.current = true;
    setLoading(currentPage === 1);

    try {
      const allowed = await isWithinAllowedTime('instant_auction');
      setIsAllowed(allowed);

      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (filters.brand) params.append("brand", filters.brand);

      const response = await api.get(
        `/api/approved-auctions/live_instant?page=${currentPage}&pageSize=${pageSize}&${params.toString()}`,
        { headers: { "Accept": "application/json; charset=UTF-8" } }
      );

      const data = response.data.data;
      if (data) {
        setCarsBrands(response.data.brands || []);
        setTotalCount(data.total);
        setCarsTotal(response.data.total?.total || 0);
        setCars(prev => currentPage > 1 ? [...prev, ...data.data] : data.data);
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
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
    });

    const channel = pusher.subscribe('auction.instant');
    channel.bind('CarMovedBetweenAuctionsEvent', () => {
      setCurrentPage(1);
      setCars([]);
    });

    channel.bind('AuctionStatusChangedEvent', (data: any) => {
      const statusLabels: Record<string, string> = {
        live: 'مباشر', ended: 'منتهي', completed: 'مكتمل',
        cancelled: 'ملغي', failed: 'فاشل', scheduled: 'مجدول'
      };
      const oldLabel = statusLabels[data.old_status] || data.old_status;
      const newLabel = statusLabels[data.new_status] || data.new_status;
      toast.success(`تم تغيير حالة مزاد ${data.car_make} ${data.car_model} من ${oldLabel} إلى ${newLabel}`);
    });

    return () => {
      pusher.unsubscribe('auction.instant');
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
        if (entry.isIntersecting && !loadingGateRef.current && isAllowed && currentPage < totalPages) {
          setCurrentPage(p => p + 1);
        }
      },
      { root: container, rootMargin: "800px" }
    );

    observer.observe(sentry);
    return () => observer.disconnect();
  }, [currentPage, totalPages, isAllowed]);

  // =============== تصفية السيارات ===============
  const filteredCars = cars.filter(car => {
    if (filters.brand && filters.brand !== car.car.make) return false;
    return true;
  });

  // =============== مكونات واجهة المستخدم ===============
  const StatusBadge = ({ status }: { status: string }) => {
    const config = {
      "جاري المزايدة": { bg: "bg-blue-900/30", text: "text-blue-300", border: "border-blue-700/50", icon: Play },
      "تم البيع": { bg: "bg-emerald-900/30", text: "text-emerald-300", border: "border-emerald-700/50", icon: TrendingUp },
      "انتهى": { bg: "bg-gray-800/50", text: "text-gray-400", border: "border-gray-700/50", icon: Clock },
    }[status] || { bg: "bg-amber-900/30", text: "text-amber-300", border: "border-amber-700/50", icon: AlertCircle };

    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

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
                <span className="font-semibold text-foreground">{filteredCars.length}</span> من <span className="font-semibold text-foreground">{carsTotal}</span> سيارة
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2.5 px-4.5 py-2.5 border border-border rounded-xl hover:bg-border transition-colors text-foreground/80 hover:text-foreground backdrop-blur-sm"
              >
                <Filter className="w-4.5 h-4.5" />
                فلاتر
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showFilters ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>

          {/* فلاتر متقدمة */}
          {showFilters && (
            <div className="mt-5 pt-5 border-t border-border/40">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">ماركة السيارة</label>
                  <select
                    value={filters.brand}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, brand: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className="w-full p-3 bg-background/70 border border-border rounded-xl focus:ring-primary/50 focus:border-primary/50 text-foreground backdrop-blur-sm"
                  >
                    <option value="" className="bg-card text-foreground/70">جميع الماركات</option>
                    {carsBrands.map((brand, idx) => (
                      <option key={idx} value={brand} className="bg-card text-foreground">{brand}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* رسائل الحالة */}
        {!isAllowed && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-2xl p-5 mb-6 flex items-center gap-3 backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>السوق غير مفتوح حاليًا. يفتح يوميًا من 7 مساءً إلى 10 مساءً.</span>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-2xl p-5 mb-6 flex items-center gap-3 backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && filteredCars.length === 0 && isAllowed && (
          <div className="bg-primary/10 border border-primary/20 text-primary rounded-2xl p-8 text-center backdrop-blur-sm">
            <Car className="w-14 h-14 mx-auto mb-4 text-primary/80" />
            <p className="font-semibold text-lg">لا توجد سيارات متاحة في السوق الفوري حاليًا</p>
            <p className="text-sm mt-2 opacity-80">سيتم تحديث القائمة تلقائيًا عند توفر سيارات جديدة</p>
          </div>
        )}

        {/* جدول السيارات */}
        {isAllowed && filteredCars.length > 0 && (
          <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <div className="max-h-[70vh] overflow-auto" ref={scrollContainerRef}>
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-background/70 backdrop-blur-sm sticky top-0 z-10 border-b border-border">
                      {[
                        "رابط البث", "المنطقة", "المدينة", "الماركة", "الموديل", "السنة",
                        "اللوحة", "العداد", "الحالة", "اللون", "الوقود", "المزايدات",
                        "سعر الافتتاح", "أقل سعر", "أعلى سعر", "آخر سعر", "مبلغ الزيادة",
                        "نسبة التغير", "الحالة", "التفاصيل"
                      ].map((header, idx) => (
                        <th
                          key={idx}
                          className="px-4 py-4 text-right text-xs font-semibold text-foreground/70 uppercase tracking-wider whitespace-nowrap"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredCars.map((car, idx) => (
                      <tr 
                        key={idx} 
                        className="hover:bg-border/60 transition-colors duration-200 border-b border-border/30"
                      >
                        <td className="px-4 py-4 text-center text-sm">
                          {car.broadcasts.length > 0 ? (
                            <LoadingLink
                              target="_blank"
                              href={car.broadcasts[0].stream_url}
                              className="text-primary hover:text-primary/80 font-medium hover:underline transition-colors"
                            >
                              مشاهدة البث
                            </LoadingLink>
                          ) : (
                            <span className="text-foreground/50">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center text-sm text-foreground/80">{car.car.province}</td>
                        <td className="px-4 py-4 text-center text-sm text-foreground/80">{car.car.city}</td>
                        <td className="px-4 py-4 text-center text-sm font-medium text-foreground">{car.car.make}</td>
                        <td className="px-4 py-4 text-center text-sm text-foreground/80">{car.car.model}</td>
                        <td className="px-4 py-4 text-center text-sm text-foreground/80">{car.car.year}</td>
                        <td className="px-4 py-4 text-center text-sm text-foreground/80">{car.car.plate}</td>
                        <td className="px-4 py-4 text-center text-sm text-foreground/80">{car.car.odometer}</td>
                        <td className="px-4 py-4 text-center text-sm text-foreground/80">{car.car.condition}</td>
                        <td className="px-4 py-4 text-center text-sm text-foreground/80">{car.car.color}</td>
                        <td className="px-4 py-4 text-center text-sm text-foreground/80">{car.car.engine}</td>
                        <td className="px-4 py-4 text-center text-sm text-foreground/80">{car.bids.length}</td>
                        <td className="px-4 py-4 text-center text-sm font-medium text-emerald-400">{formatCurrency(car.opening_price)}</td>
                        <td className="px-4 py-4 text-center text-sm font-medium text-amber-400">{formatCurrency(car.minimum_bid)}</td>
                        <td className="px-4 py-4 text-center text-sm font-medium text-rose-400">{formatCurrency(car.maximum_bid)}</td>
                        <td className="px-4 py-4 text-center text-sm font-medium text-foreground">{formatCurrency(car.current_bid)}</td>
                        <td className="px-4 py-4 text-center text-sm font-semibold text-emerald-400">
                          {car.bids.length > 0 ? car.bids[car.bids.length - 1].increment : 0}
                        </td>
                        <td className="px-4 py-4 text-center text-sm font-semibold text-emerald-400">
                          {car.bids.length > 0
                            ? `${((car.bids[car.bids.length - 1].increment / car.bids[car.bids.length - 1].bid_amount) * 100).toFixed(2)}%`
                            : "0%"}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <StatusBadge status={getAuctionStatus(car.car.auction_status)} />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <LoadingLink
                            href={`/carDetails/${car.car_id}`}
                            className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl border border-primary/30"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </LoadingLink>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* مؤشر التمرير اللامتناهي */}
                <div ref={sentryRef} className="py-6 text-center">
                  {loading && currentPage > 1 && (
                    <div className="flex justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  )}
                  {!loading && currentPage >= totalPages && filteredCars.length > 0 && (
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
'use client';

import React, { useEffect, useState, Fragment, useRef, useCallback } from 'react';
import LoadingLink from "@/components/LoadingLink";
import BidTimer from '@/components/BidTimer';
import { formatCurrency } from "@/utils/formatCurrency";
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/axios';
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import Pusher from 'pusher-js';
import toast from 'react-hot-toast';
import {
  Car,
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
} from "lucide-react";

// =============== أنواع TypeScript ===============
interface Car {
  id: number;
  city: string;
  make: string;
  model: string;
  year: number;
  odometer: string;
  condition: string;
  color: string;
  engine: string;
  auction_status: string;
  user_id?: number;
}

interface Bid {
  bid_amount: number;
  increment: number;
}

interface SilentAuctionItem {
  id: number;
  car_id: number;
  car: Car;
  auction_type: string;
  minimum_bid: number;
  maximum_bid: number;
  current_bid: number;
  bids: Bid[];
  status?: string;
}

interface FilterOptions {
  brand: string;
}

async function isWithinAllowedTime(page: string): Promise<boolean> {
  try {
    const response = await api.get(`api/check-time?page=${page}`);
    return response.data.allowed;
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

export default function SilentAuctionPage() {
  const [carsTotal, setCarsTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [carsBrands, setCarsBrands] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({ brand: "" });
  const [isAllowed, setIsAllowed] = useState(true);
  const [cars, setCars] = useState<SilentAuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedRows, setExpandedRows] = useState<{ [key: number]: boolean }>({});
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const { user, isLoggedIn } = useAuth();
  const router = useLoadingRouter();

  // === Infinity Scroll ===
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentryRef = useRef<HTMLDivElement | null>(null);
  const loadingGateRef = useRef(false);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const { label: auctionType } = getCurrentAuctionType(currentTime);

  // Removed client-side authentication redirect - now handled by middleware
  // Public page: authentication only required for bidding actions

  // تحديث الوقت
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // جلب البيانات
  const fetchAuctions = useCallback(async () => {
    
    
    loadingGateRef.current = true;
    setLoading(currentPage === 1);

    try {
      // ✅ إصلاح: إزالة السطر الزائد setIsAllowed(true)
      const allowed = await isWithinAllowedTime('late_auction');
      setIsAllowed(allowed);

      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (filters.brand) params.append("brand", filters.brand);

      const response = await api.get(
        `/api/approved-auctions/silent_instant?page=${currentPage}&pageSize=${pageSize}&${params.toString()}`,
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
      console.error('فشل تحميل بيانات المزاد المتأخر', err);
      setError("تعذر الاتصال بالخادم. يرجى المحاولة لاحقًا.");
      if (currentPage === 1) setCars([]);
    } finally {
      setLoading(false);
      loadingGateRef.current = false;
    }
  }, [currentPage, searchTerm, filters, isLoggedIn]);

  // تأثير جلب البيانات وPusher
  useEffect(() => {
    fetchAuctions();

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
    });

    const channel = pusher.subscribe('auction.silent');
    channel.bind('CarMovedBetweenAuctionsEvent', () => fetchAuctions());
    channel.bind('AuctionStatusChangedEvent', (data: any) => {
      fetchAuctions();
      const statusLabels: Record<string, string> = {
        live: 'مباشر', ended: 'منتهي', completed: 'مكتمل',
        cancelled: 'ملغي', failed: 'فاشل', scheduled: 'مجدول'
      };
      const oldLabel = statusLabels[data.old_status] || data.old_status;
      const newLabel = statusLabels[data.new_status] || data.new_status;
      toast(`تم تغيير حالة مزاد ${data.car_make} ${data.car_model} من ${oldLabel} إلى ${newLabel}`);
    });

    return () => {
      pusher.unsubscribe('auction.silent');
      pusher.disconnect();
    };
  }, [fetchAuctions]);

  // Infinity Scroll
  useEffect(() => {
    const rootEl = scrollContainerRef.current;
    const sentryEl = sentryRef.current;
    if (!rootEl || !sentryEl) return;

    const io = new IntersectionObserver(
      (entries) => {
        const ent = entries[0];
        if (ent.isIntersecting && !loadingGateRef.current && isAllowed && currentPage < totalPages) {
          setCurrentPage(p => p + 1);
        }
      },
      { root: rootEl, rootMargin: "800px 0px", threshold: 0 }
    );

    io.observe(sentryEl);
    return () => io.disconnect();
  }, [loading, currentPage, totalPages, isAllowed]);

  const toggleRowExpansion = (id: number) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredCars = cars.filter(car => {
    if (filters.brand && filters.brand !== car.car.make) return false;
    return true;
  });

  // مكون لعرض التغيير في السعر
  const PriceChangeBadge = ({ increment, bidAmount }: { increment: number; bidAmount: number }) => {
    const isPositive = increment > 0;
    const percentage = bidAmount ? ((increment / bidAmount) * 100).toFixed(2) : "0.00";
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
        isPositive 
          ? "bg-emerald-900/30 text-emerald-700 border-emerald-700/50" 
          : "bg-rose-900/30 text-rose-700 border-rose-700/50"
      }`}>
        {isPositive ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
        {formatCurrency(increment)} ({percentage}%)
      </span>
    );
  };

  // =============== العرض الرئيسي ===============
  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* زر العودة */}
        <div className="flex justify-end mb-6">
          <LoadingLink
            href="/auctions/auctions-1main"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors px-4 py-2.5 text-sm rounded-xl border border-border hover:border-primary/50 bg-card/50 hover:bg-card backdrop-blur-sm"
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            العودة
          </LoadingLink>
        </div>

        {/* الهيدر */}
        <div className="grid grid-cols-12 items-center mb-8 gap-4">
          <div className="col-span-3">
            <div className="bg-card/60 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center justify-between border border-primary/30">
              <div className="text-sm font-medium text-primary">
                {auctionType} - جارٍ الآن
              </div>
              <div className="flex items-center gap-2">
                <Clock className="text-primary/80 w-4 h-4" />
                <div className="font-mono font-semibold text-primary">
                  <BidTimer showLabel={false} showProgress={false} />
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-6 text-center relative">
            <h1 className="text-3xl md:text-4xl font-bold text-primary">
              السوق المتأخر
            </h1>
            <div className="mt-2 text-sm text-primary/80">
              وقت السوق من 10 مساءً إلى 4 عصراً اليوم التالي
            </div>
            <p className="mt-3 text-foreground/70 text-sm max-w-2xl mx-auto">
              مكمل للسوق الفوري المباشر في تركيبه ويختلف أنه ليس به بث مباشر، وصاحب العرض يستطيع أن يغير سعره بالسالب أو الموجب بحد لا يتجاوز 10% من سعر إغلاق الفوري.
            </p>
          </div>
        </div>

        {/* رسائل الحالة */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-2xl p-5 mb-6 flex items-center gap-3 backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isAllowed && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-2xl p-5 mb-6 flex items-center gap-3 backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>السوق غير مفتوح حاليًا. يفتح يوميًا من 10 مساءً إلى 4 عصراً اليوم التالي.</span>
          </div>
        )}

        {!loading && !error && filteredCars.length === 0 && isAllowed && (
          <div className="bg-primary/10 border border-primary/20 text-primary rounded-2xl p-8 text-center backdrop-blur-sm mb-6">
            <Car className="w-14 h-14 mx-auto mb-4 text-primary/80" />
            <p className="font-semibold text-lg">لا توجد سيارات متاحة في السوق المتأخر حاليًا</p>
          </div>
        )}

        {/* شريط البحث والفلاتر */}
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
                className="w-full pr-11 pl-4 py-3 bg-background/70 border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-foreground placeholder-foreground/50 backdrop-blur-sm"
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

        {/* جدول السيارات */}
        {isAllowed && filteredCars.length > 0 && (
          <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-border">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-primary">السيارات المتاحة في المزاد المتأخر</h2>
                <div className="text-sm text-foreground/70">
                  🕙 عند الساعة 10 مساءً يتم التحول من السوق الفوري المباشر إلى المزاد المتأخر
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="max-h-[70vh] overflow-auto" ref={scrollContainerRef}>
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-background/70 backdrop-blur-sm sticky top-0 z-10 border-b border-border">
                      {["", "المدينة", "الماركة", "الموديل", "السنة", "سعر الافتتاح", "آخر سعر", "التغير", "التفاصيل"].map((header, i) => (
                        <th key={i} className="px-4 py-4 text-right text-xs font-semibold text-foreground/70 uppercase tracking-wider whitespace-nowrap">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredCars.map((car, idx) => (
                      <Fragment key={car.id}>
                        {car.auction_type !== "live" && car.car.auction_status === "in_auction" && (
                          <>
                            <tr className="hover:bg-border/60 transition-colors">
                              <td className="px-4 py-4 text-center">
                                <button
                                  onClick={() => toggleRowExpansion(car.id)}
                                  className="inline-flex items-center justify-center text-foreground/50 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg p-1.5 hover:bg-border transition-colors"
                                  aria-label={expandedRows[car.id] ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                                >
                                  {expandedRows[car.id] ? (
                                    <ChevronUp className="w-5 h-5" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5" />
                                  )}
                                </button>
                              </td>
                              <td className="px-4 py-4 text-center text-sm text-foreground/80">{car.car.city}</td>
                              <td className="px-4 py-4 text-center text-sm font-medium text-foreground">{car.car.make}</td>
                              <td className="px-4 py-4 text-center text-sm text-foreground/80">{car.car.model}</td>
                              <td className="px-4 py-4 text-center text-sm text-foreground/80">{car.car.year}</td>
                              <td className="px-4 py-4 text-center text-sm text-secondary dark:text-foreground">{formatCurrency(car.minimum_bid)}</td>
                              <td className="px-4 py-4 text-center text-sm font-medium text-primary">{formatCurrency(car.current_bid)}</td>
                              <td className="px-4 py-4 text-center">
                                {car.bids.length > 0 ? (
                                  <PriceChangeBadge 
                                    increment={car.bids[car.bids.length - 1].increment} 
                                    bidAmount={car.bids[car.bids.length - 1].bid_amount} 
                                  />
                                ) : (
                                  <span className="text-foreground/50">—</span>
                                )}
                              </td>
                              <td className="px-4 py-4 text-center">
                                <a
                                  href={`/carDetails/${car.car_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl border border-primary/30"
                                >
                                  <Eye className="w-4 h-4" />
                                </a>
                              </td>
                            </tr>

                            {expandedRows[car.id] && (
                              <tr className="bg-background/30">
                                <td colSpan={9} className="px-6 py-5 border-t border-border">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="bg-border/50 rounded-xl p-4 border border-border">
                                      <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                                        <Car className="w-4 h-4" />
                                        معلومات السيارة
                                      </h4>
                                      <ul className="space-y-2 text-sm">
                                        <li className="flex justify-between">
                                          <span className="text-foreground/70">العداد:</span>
                                          <span className="text-foreground/90">{car.car.odometer} كم</span>
                                        </li>
                                        <li className="flex justify-between">
                                          <span className="text-foreground/70">الحالة:</span>
                                          <span className="text-foreground/90">{car.car.condition || "جيدة"}</span>
                                        </li>
                                        <li className="flex justify-between">
                                          <span className="text-foreground/70">اللون:</span>
                                          <span className="text-foreground/90">{car.car.color}</span>
                                        </li>
                                        <li className="flex justify-between">
                                          <span className="text-foreground/70">الوقود:</span>
                                          <span className="text-foreground/90">{car.car.engine}</span>
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
                                          <span className="text-foreground/90">{car.bids.length}</span>
                                        </li>
                                        <li className="flex justify-between">
                                          <span className="text-foreground/70">الحالة:</span>
                                          <span className="text-foreground/90">{car.status || "مغلق"}</span>
                                        </li>
                                        <li className="flex justify-between">
                                          <span className="text-foreground/70">نتيجة المزايدة:</span>
                                          <span className="text-foreground/90">{car.car.auction_status}</span>
                                        </li>
                                      </ul>
                                    </div>

                                    <div className="bg-border/50 rounded-xl p-4 border border-border">
                                      <h4 className="font-semibold text-primary mb-3">معلومات الأسعار</h4>
                                      <ul className="space-y-2 text-sm">
                                        <li className="flex justify-between">
                                          <span className="text-foreground/70">سعر الافتتاح:</span>
                                          <span className="text-amber-700 dark:text-amber-400">{formatCurrency(car.minimum_bid)}</span>
                                        </li>
                                        <li className="flex justify-between">
                                          <span className="text-foreground/70">أقل سعر:</span>
                                          <span className="text-amber-700 dark:text-amber-400">{formatCurrency(car.minimum_bid)}</span>
                                        </li>
                                        <li className="flex justify-between">
                                          <span className="text-foreground/70">أعلى سعر:</span>
                                          <span className="text-rose-700 dark:text-rose-400">{formatCurrency(car.maximum_bid)}</span>
                                        </li>
                                        <li className="flex justify-between">
                                          <span className="text-foreground/70">آخر سعر:</span>
                                          <span className="text-emerald-700 dark:text-emerald-400">{formatCurrency(car.current_bid)}</span>
                                        </li>
                                        {car.bids.length > 0 && (
                                          <li className="flex justify-between">
                                            <span className="text-foreground/70">التغيّر:</span>
                                            <PriceChangeBadge 
                                              increment={car.bids[car.bids.length - 1].increment} 
                                              bidAmount={car.bids[car.bids.length - 1].bid_amount} 
                                            />
                                          </li>
                                        )}
                                      </ul>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>

                {/* حارس السحب اللامتناهي */}
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
            <p className="text-foreground/70">جارٍ تحميل بيانات السوق المتأخر...</p>
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import React, { useEffect, useState, Fragment, useRef, useCallback, useMemo } from 'react';
import Pusher from 'pusher-js';
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
} from "lucide-react";

/**
 * ========= إعدادات التشغيل =========
 * اجعل MOCK_MODE = true لتشغيل بيانات افتراضية بالكامل داخل الملف.
 * اجعل MOCK_ALWAYS_OPEN = true لفتح السوق دائمًا (مفيد للاختبار).
 */
const MOCK_MODE = true;
const MOCK_ALWAYS_OPEN = true;

/* ========= الأنواع ========= */
interface Car {
  id: number;
  city: string;
  make: string;
  model: string;
  year: number;
  odometer: string; // أرقام فقط، سنضيف "كم" عند العرض
  condition: string;
  color: string;
  engine: string;
  auction_status: string; // in_auction | sold | expired
  user_id?: number;
}
interface Bid { bid_amount: number; increment: number; }
interface SilentAuctionItem {
  id: number;
  car_id: number;
  car: Car;
  auction_type: string; // silent
  minimum_bid: number;
  maximum_bid: number;
  current_bid: number;
  bids: Bid[];
  status?: string; // مفتوح | مغلق
}
interface FilterOptions { brand: string; }

/* ========= بدائل محلية للاستيرادات الداخلية ========= */
// بديل مبسط لـ LoadingLink
function LoadingLink({ href, className, children, target }: any) {
  return (
    <a href={href} className={className} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined}>
      {children}
    </a>
  );
}

// مؤقت بسيط بديل لـ BidTimer
function BidTimer({ showLabel = false }: { showLabel?: boolean }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return <span>{showLabel ? 'الوقت: ' : ''}{hh}:{mm}:{ss}</span>;
}

// بديل مبسط للتوثيق
function useAuth() { return { user: { id: 1, name: 'Demo User' }, isLoggedIn: true } as const; }
// بديل مبسط للملاحة
function useLoadingRouter() { return { push: (url: string) => (typeof window !== 'undefined' ? (window.location.href = url) : null) }; }
// تنسيق العملة
function formatCurrency(value: number, locale = 'ar-EG', currency = 'SAR') {
  try { return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value); }
  catch { return `${value.toLocaleString(locale)} ${currency}`; }
}

/* ========= مولّد بيانات افتراضية ========= */
const BRANDS: Record<string, string[]> = {
  'تويوتا': ['كامري', 'كورولا', 'هايلكس', 'راف4'],
  'هيونداي': ['سوناتا', 'النترا', 'توسان'],
  'نيسان': ['باترول', 'صني', 'التيما'],
  'كيا': ['سيراتو', 'سبورتاج', 'أوبتيما'],
  'شفروليه': ['ماليبو', 'تاهو', 'كابتيفا'],
};
const CITIES = ['الرياض', 'جدة', 'الدمام', 'الخبر', 'الطائف', 'المدينة', 'بريدة', 'عنيزة'];
const COLORS = ['أبيض', 'أسود', 'فضي', 'رمادي', 'أزرق', 'أحمر'];
const ENGINES = ['بنزين', 'ديزل', 'هايبرد'];
const CONDITIONS = ['ممتاز', 'جيد جدًا', 'جيد', 'متوسط'];

function seededRandom(seed: number) { const x = Math.sin(seed) * 10000; return x - Math.floor(x); }

function buildMockSilentAuctions(count = 150): SilentAuctionItem[] {
  const items: SilentAuctionItem[] = [];
  const brandNames = Object.keys(BRANDS);

  for (let i = 1; i <= count; i++) {
    const r = seededRandom(i);
    const brand = brandNames[Math.floor(r * brandNames.length)];
    const model = BRANDS[brand][Math.floor(seededRandom(i + 3) * BRANDS[brand].length)];
    const city = CITIES[Math.floor(seededRandom(i + 5) * CITIES.length)];
    const year = 2012 + Math.floor(seededRandom(i + 7) * 13); // 2012..2024
    const odometer = String(Math.floor(20_000 + seededRandom(i + 9) * 250_000));
    const condition = CONDITIONS[Math.floor(seededRandom(i + 11) * CONDITIONS.length)];
    const color = COLORS[Math.floor(seededRandom(i + 13) * COLORS.length)];
    const engine = ENGINES[Math.floor(seededRandom(i + 15) * ENGINES.length)];

    const opening = Math.floor(15_000 + seededRandom(i + 17) * 120_000);
    let last = opening;
    const bidCount = Math.floor(seededRandom(i + 19) * 6); // 0..5
    const bids: Bid[] = [];
    for (let b = 0; b < bidCount; b++) {
      const inc = Math.floor(300 + seededRandom(i * 10 + b + 21) * 3_500);
      last += inc;
      bids.push({ bid_amount: last, increment: inc });
    }

    const maximum = Math.max(last, Math.floor(opening * (1.2 + seededRandom(i + 23) * 0.8)));
    const statusPool = ['in_auction', 'in_auction', 'in_auction', 'sold', 'expired'];
    const auction_status = statusPool[Math.floor(seededRandom(i + 25) * statusPool.length)];

    items.push({
      id: i,
      car_id: 20_000 + i,
      car: { id: i, city, make: brand, model, year, odometer, condition, color, engine, auction_status },
      auction_type: 'silent',
      minimum_bid: opening,
      maximum_bid: maximum,
      current_bid: bids.length ? bids[bids.length - 1].bid_amount : opening,
      bids,
      status: seededRandom(i + 27) > 0.2 ? 'مفتوح' : 'مغلق',
    });
  }
  return items;
}
const MOCK_DATA: SilentAuctionItem[] = buildMockSilentAuctions();

/* ========= محاكاة HTTP API ========= */
const api = {
  get: async (url: string, _config?: any) => {
    if (!MOCK_MODE) throw new Error('MOCK_MODE=false: اربط Axios الحقيقي هنا.');

    // تأخير بسيط لمحاكاة الشبكة
    await new Promise((r) => setTimeout(r, 300));

    // السماح بالوقت: من 10 مساءً إلى 4 عصراً (اليوم التالي) — أو دائماً لو MOCK_ALWAYS_OPEN=true
    if (url.startsWith('api/check-time')) {
      if (MOCK_ALWAYS_OPEN) return { data: { allowed: true } };
      const now = new Date(); const hour = now.getHours();
      const allowed = hour >= 22 || hour < 16; // 22:00 .. 15:59
      return { data: { allowed } };
    }

    // نقطة جلب المزادات
    if (url.startsWith('/api/approved-auctions/silent_instant')) {
      const qs = url.split('?')[1] || '';
      const params = new URLSearchParams(qs);
      const page = parseInt(params.get('page') || '1', 10);
      const pageSize = parseInt(params.get('pageSize') || '50', 10);
      const search = (params.get('search') || '').trim().toLowerCase();
      const brand = (params.get('brand') || '').trim();

      let filtered = MOCK_DATA;
      if (brand) filtered = filtered.filter((c) => c.car.make === brand);
      if (search) {
        filtered = filtered.filter((c) => {
          const t = `${c.car.make} ${c.car.model} ${c.car.year} ${c.car_id}`.toLowerCase();
          return t.includes(search);
        });
      }

      const total = filtered.length;
      const start = (page - 1) * pageSize;
      const data = filtered.slice(start, start + pageSize);
      const brands = Array.from(new Set(MOCK_DATA.map((c) => c.car.make)));

      return { data: { data: { data, total }, brands, total: { total } } };
    }

    throw new Error(`Unknown mock URL: ${url}`);
  },
};

/* ========= مساعدات ========= */
async function isWithinAllowedTime(page: string): Promise<boolean> {
  try { const response = await api.get(`api/check-time?page=${page}`); return response.data.allowed; }
  catch { return true; } // في حالة الخطأ اسمح بالعرض أثناء التجارب
}
function getCurrentAuctionType(time: Date = new Date()): { label: string; isLive: boolean } {
  const h = time.getHours();
  if (h >= 16 && h < 19) return { label: 'الحراج المباشر', isLive: true };
  if (h >= 19 && h < 22) return { label: 'السوق الفوري المباشر', isLive: true };
  return { label: 'السوق المتأخر', isLive: true };
}

/* ========= الصفحة الرئيسية ========= */
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
  const { isLoggedIn } = useAuth();
  const router = useLoadingRouter();

  // === Infinity Scroll ===
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentryRef = useRef<HTMLDivElement | null>(null);
  const loadingGateRef = useRef(false);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const { label: auctionType } = getCurrentAuctionType(currentTime);

  // تحقق من التوثيق
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login?returnUrl=/auctions/auctions-1main/silent");
    }
  }, [isLoggedIn, router]);

  // تحديث الساعة أعلى الصفحة
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // جلب البيانات
  const fetchAuctions = useCallback(async () => {
    if (!isLoggedIn || loadingGateRef.current) return;

    loadingGateRef.current = true;
    setLoading(currentPage === 1);

    try {
      const allowed = await isWithinAllowedTime('late_auction');
      setIsAllowed(allowed);

      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (filters.brand) params.append("brand", filters.brand);

      const response = await api.get(
        `/api/approved-auctions/silent_instant?page=${currentPage}&pageSize=${pageSize}&${params.toString()}`,
        { headers: { "Accept": "application/json; charset=UTF-8" } }
      );

      const payload = response.data.data; // { data, total }
      if (payload) {
        const brands = response.data.brands || [];
        const totalObj = response.data.total || { total: 0 };

        setCarsBrands(brands);
        setTotalCount(payload.total);
        setCarsTotal(totalObj.total);
        setCars(prev => currentPage > 1 ? [...prev, ...payload.data] : payload.data);
      }
    } catch (err) {
      console.error('فشل تحميل بيانات المزاد المتأخر', err);
      setError("تعذر الاتصال بالخادم. يرجى المحاولة لاحقًا.");
      if (currentPage === 1) setCars([]);
    } finally {
      setLoading(false);
      loadingGateRef.current = false;
    }
  }, [currentPage, searchTerm, filters, isLoggedIn, pageSize]);

  // تأثير جلب البيانات + Pusher اختياري
  useEffect(() => {
    fetchAuctions();

    // Pusher لن يعمل في الوضع التجريبي — فعّله فقط عند MOCK_MODE=false
    let pusher: Pusher | null = null;
    if (!MOCK_MODE && process.env.NEXT_PUBLIC_PUSHER_APP_KEY) {
      pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
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
        // بإمكانك هنا إضافة toast حقيقية لو متوفرة لديك
        console.info(`تم تغيير حالة مزاد ${data.car_make} ${data.car_model} من ${oldLabel} إلى ${newLabel}`);
      });
    }

    return () => {
      if (pusher) {
        pusher.unsubscribe('auction.silent');
        pusher.disconnect();
      }
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

  const filteredCars = useMemo(() => {
    return cars.filter(car => {
      if (filters.brand && filters.brand !== car.car.make) return false;
      return true;
    });
  }, [cars, filters.brand]);

  // شارة التغير في السعر
  const PriceChangeBadge = ({ increment, bidAmount }: { increment: number; bidAmount: number }) => {
    const isPositive = increment > 0;
    const percentage = bidAmount ? ((increment / bidAmount) * 100).toFixed(2) : "0.00";
    return (
      <span className={`inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-semibold border min-w-[90px] ${
        isPositive
          ? "bg-emerald-900/30 text-emerald-300 border-emerald-700/50"
          : "bg-rose-900/30 text-rose-300 border-rose-700/50"
      }`}>
        {isPositive ? <Plus className="w-3 h-3 mr-1" /> : <Minus className="w-3 h-3 mr-1" />}
        {formatCurrency(increment)} ({percentage}%)
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* زر العودة */}
        <div className="flex justify-end mb-6">
          <LoadingLink
            href="/auctions/auctions-1main"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors px-4 py-2.5 text-sm rounded-xl border border-purple-800/50 hover:border-purple-700 bg-gray-800/50 hover:bg-gray-800 backdrop-blur-sm"
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            العودة
          </LoadingLink>
        </div>

        {/* الهيدر */}
        <div className="grid grid-cols-12 items-center mb-8 gap-4">
          <div className="col-span-12 md:col-span-4">
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center justify-between border border-purple-800/30">
              <div className="text-sm font-medium text-purple-300">
                {auctionType} - جارٍ الآن
              </div>
              <div className="flex items-center gap-2">
                <Clock className="text-purple-400 w-4 h-4" />
                <div className="font-mono font-semibold text-purple-300">
                  <BidTimer />
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              السوق المتأخر
            </h1>
            <div className="mt-2 text-sm text-purple-400/80">
              وقت السوق من 10 مساءً إلى 4 عصراً اليوم التالي
            </div>
            <p className="mt-3 text-gray-400 text-sm max-w-2xl mx-auto">
              مكمل للسوق الفوري المباشر في تركيبه ويختلف أنه ليس به بث مباشر، وصاحب العرض يستطيع أن يغير سعره بالسالب أو الموجب بحد لا يتجاوز 10% من سعر إغلاق الفوري.
            </p>
          </div>
        </div>

        {/* رسائل الحالة */}
        {error && (
          <div className="bg-red-900/20 border border-red-800/40 text-red-300 rounded-2xl p-5 mb-6 flex items-center gap-3 backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isAllowed && (
          <div className="bg-amber-900/20 border border-amber-800/40 text-amber-300 rounded-2xl p-5 mb-6 flex items-center gap-3 backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>السوق غير مفتوح حاليًا. يفتح يوميًا من 10 مساءً إلى 4 عصراً اليوم التالي.</span>
          </div>
        )}

        {!loading && !error && filteredCars.length === 0 && isAllowed && (
          <div className="bg-purple-900/10 border border-purple-800/30 text-purple-300 rounded-2xl p-8 text-center backdrop-blur-sm mb-6">
            <CarIcon className="w-14 h-14 mx-auto mb-4 text-purple-400" />
            <p className="font-semibold text-lg">لا توجد سيارات متاحة في السوق المتأخر حاليًا</p>
          </div>
        )}

        {/* شريط البحث والفلاتر */}
        <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-5 mb-6 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ابحث بالماركة، الموديل، أو رقم الشاصي..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pr-11 pl-4 py-3 bg-gray-900/70 border border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-gray-100 placeholder-gray-500 backdrop-blur-sm"
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="text-sm text-gray-300 bg-gray-900/60 px-4.5 py-2.5 rounded-xl border border-gray-700/50">
                <span className="font-semibold text-white">{filteredCars.length}</span> من <span className="font-semibold text-white">{carsTotal}</span> سيارة
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2.5 px-4.5 py-2.5 border border-gray-700/50 rounded-xl hover:bg-gray-800/70 transition-colors text-gray-300 hover:text-white backdrop-blur-sm"
              >
                <Filter className="w-4.5 h-4.5" />
                فلاتر
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showFilters ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-5 pt-5 border-t border-gray-700/40">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ماركة السيارة</label>
                  <select
                    value={filters.brand}
                    onChange={(e) => { setFilters(prev => ({ ...prev, brand: e.target.value })); setCurrentPage(1); }}
                    className="w-full p-3 bg-gray-900/70 border border-gray-700 rounded-xl focus:ring-purple-500/50 focus:border-purple-500/50 text-gray-100 backdrop-blur-sm"
                  >
                    <option value="" className="bg-gray-800 text-gray-300">جميع الماركات</option>
                    {carsBrands.map((brand, idx) => (
                      <option key={idx} value={brand} className="bg-gray-800 text-gray-200">{brand}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* جدول السيارات */}
        {isAllowed && filteredCars.length > 0 && (
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-700/50">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-purple-300">السيارات المتاحة في المزاد المتأخر</h2>
                <div className="text-sm text-gray-400">
                  🕙 عند الساعة 10 مساءً يتم التحول من السوق الفوري المباشر إلى المزاد المتأخر
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="max-h-[70vh] overflow-auto" ref={scrollContainerRef}>
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-900/70 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-700/50">
                      {["", "المدينة", "الماركة", "الموديل", "السنة", "سعر الافتتاح", "آخر سعر", "التغير", "التفاصيل"].map((header, i) => (
                        <th key={i} className="px-4 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {filteredCars.map((car) => (
                      <Fragment key={car.id}>
                        {car.auction_type !== "live" && car.car.auction_status === "in_auction" && (
                          <>
                            <tr className="hover:bg-gray-800/60 transition-colors">
                              <td className="px-4 py-4 text-center">
                                <button
                                  onClick={() => toggleRowExpansion(car.id)}
                                  className="inline-flex items-center justify-center text-gray-500 hover:text-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-lg p-1.5 hover:bg-gray-700/50 transition-colors"
                                  aria-label={expandedRows[car.id] ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                                >
                                  {expandedRows[car.id] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </button>
                              </td>
                              <td className="px-4 py-4 text-center text-sm text-gray-300">{car.car.city}</td>
                              <td className="px-4 py-4 text-center text-sm font-medium text-white">{car.car.make}</td>
                              <td className="px-4 py-4 text-center text-sm text-gray-300">{car.car.model}</td>
                              <td className="px-4 py-4 text-center text-sm text-gray-300">{car.car.year}</td>
                              <td className="px-4 py-4 text-center text-sm text-amber-300">{formatCurrency(car.minimum_bid)}</td>
                              <td className="px-4 py-4 text-center text-sm font-medium text-emerald-300">{formatCurrency(car.current_bid)}</td>
                              <td className="px-4 py-4 text-center">
                                {car.bids.length > 0 ? (
                                  <PriceChangeBadge
                                    increment={car.bids[car.bids.length - 1].increment}
                                    bidAmount={car.bids[car.bids.length - 1].bid_amount}
                                  />
                                ) : <span className="text-gray-500">—</span>}
                              </td>
                              <td className="px-4 py-4 text-center">
                                <a
                                  href={`/carDetails/${car.car_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg hover:shadow-xl border border-purple-500/30"
                                >
                                  <Eye className="w-4 h-4" />
                                </a>
                              </td>
                            </tr>

                            {expandedRows[car.id] && (
                              <tr className="bg-gray-900/30">
                                <td colSpan={9} className="px-6 py-5 border-t border-gray-800/50">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                                      <h4 className="font-semibold text-purple-300 mb-3 flex items-center gap-2">
                                        <CarIcon className="w-4 h-4" />
                                        معلومات السيارة
                                      </h4>
                                      <ul className="space-y-2 text-sm">
                                        <li className="flex justify-between"><span className="text-gray-400">العداد:</span><span className="text-gray-200">{car.car.odometer} كم</span></li>
                                        <li className="flex justify-between"><span className="text-gray-400">الحالة:</span><span className="text-gray-200">{car.car.condition || "جيدة"}</span></li>
                                        <li className="flex justify-between"><span className="text-gray-400">اللون:</span><span className="text-gray-200">{car.car.color}</span></li>
                                        <li className="flex justify-between"><span className="text-gray-400">الوقود:</span><span className="text-gray-200">{car.car.engine}</span></li>
                                      </ul>
                                    </div>

                                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                                      <h4 className="font-semibold text-purple-300 mb-3 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" />
                                        معلومات المزايدة
                                      </h4>
                                      <ul className="space-y-2 text-sm">
                                        <li className="flex justify-between"><span className="text-gray-400">المزايدات:</span><span className="text-gray-200">{car.bids.length}</span></li>
                                        <li className="flex justify-between"><span className="text-gray-400">الحالة:</span><span className="text-gray-200">{car.status || "مغلق"}</span></li>
                                        <li className="flex justify-between"><span className="text-gray-400">نتيجة المزايدة:</span><span className="text-gray-200">{car.car.auction_status}</span></li>
                                      </ul>
                                    </div>

                                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                                      <h4 className="font-semibold text-purple-300 mb-3">معلومات الأسعار</h4>
                                      <ul className="space-y-2 text-sm">
                                        <li className="flex justify-between"><span className="text-gray-400">سعر الافتتاح:</span><span className="text-amber-300">{formatCurrency(car.minimum_bid)}</span></li>
                                        <li className="flex justify-between"><span className="text-gray-400">أقل سعر:</span><span className="text-amber-300">{formatCurrency(car.minimum_bid)}</span></li>
                                        <li className="flex justify-between"><span className="text-gray-400">أعلى سعر:</span><span className="text-rose-300">{formatCurrency(car.maximum_bid)}</span></li>
                                        <li className="flex justify-between"><span className="text-gray-400">آخر سعر:</span><span className="text-emerald-300">{formatCurrency(car.current_bid)}</span></li>
                                        {car.bids.length > 0 && (
                                          <li className="flex justify-between">
                                            <span className="text-gray-400">التغيّر:</span>
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
                      <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                    </div>
                  )}
                  {!loading && currentPage >= totalPages && filteredCars.length > 0 && (
                    <p className="text-sm text-gray-500">تم عرض جميع السيارات</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* حالة التحميل الأولي */}
        {loading && currentPage === 1 && (
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-10 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
            <p className="text-gray-400">جارٍ تحميل بيانات السوق المتأخر...</p>
          </div>
        )}
      </div>
    </div>
  );
}

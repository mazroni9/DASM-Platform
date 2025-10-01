'use client';

// ✅ صفحة عرض السوق الصامت مع رابط للتفاصيل السيارة
// المسار: /pages/silent/page.tsx

import React, { useEffect, useState, Fragment, useRef } from 'react'; // + useRef
import LoadingLink from "@/components/LoadingLink";
import BidTimer from '@/components/BidTimer';
import PriceInfoDashboard from '@/components/PriceInfoDashboard';
import { formatCurrency } from "@/utils/formatCurrency";
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/axios';
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import Countdown from '@/components/Countdown';
import Pusher from 'pusher-js';
import toast from 'react-hot-toast';
import Pagination from "@/components/OldPagination";
import {
    Car,
    Search,
    Filter,
    CheckSquare,
    Square,
    MoreVertical,
    Eye,
    Edit3,
    Trash2,
    Play,
    Pause,
    Archive,
    RotateCcw,
    Loader2,
    ChevronDown,
    X,
    MoveVertical,
    ChevronRight,
    Clock,
    ChevronUp,
} from "lucide-react";
interface FilterOptions {
    brand: string;
}
async function isWithinAllowedTime(page: string): Promise<boolean> {
    const response = await api.get(`api/check-time?page=${page}`);
    return response.data.allowed;
}


// دالة للحصول على نوع المزاد الحالي
function getCurrentAuctionType(time: Date = new Date()): { label: string, isLive: boolean } {
  const h = time.getHours();

  if (h >= 16 && h < 19) {
    return { label: 'الحراج المباشر', isLive: true };
  } else if (h >= 19 && h < 22) {
    return { label: 'السوق الفوري المباشر', isLive: true };
  } else {
    return { label: 'السوق المتأخر', isLive: true };
  }
}

export default function SilentAuctionPage() {
      const [carsTotal,setCarsTotal]=useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [carsBrands,setCarsBrands]=useState<[]>();
  const [filters, setFilters] = useState<FilterOptions>({ brand: "" });
  const [isAllowed,setIsAllowed]=useState(true);
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedRows, setExpandedRows] = useState<{[key: number]: boolean}>({});
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50; // or allow user to change it
  const { user, isLoggedIn } = useAuth();
  const router = useLoadingRouter();

  // === إضافات Infinity Scroll ===
  const scrollContainerRef = useRef<HTMLDivElement | null>(null); // الحاوية ذات overflow-auto
  const sentryRef = useRef<HTMLDivElement | null>(null);          // الحارس بأسفل القائمة
  const loadingGateRef = useRef(false);                           // منع الطلبات المتوازية
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const { label: auctionType } = getCurrentAuctionType(currentTime);

  // Verify user is authenticated
  useEffect(() => {
      if (!isLoggedIn) {
          router.push("/auth/login?returnUrl=/dashboard/profile");
      }
    }, [isLoggedIn, router]);

  // تحديث الوقت كل ثانية
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Fetch user profile data
  useEffect(() => {
      async function fetchAuctions() {
           if (!isLoggedIn) return;
          try {
            loadingGateRef.current = true; // قفل منع الطلبات المتوازية

            setIsAllowed(await isWithinAllowedTime('late_auction'));
            setIsAllowed(true);

            const params = new URLSearchParams();
            if (searchTerm) params.append("search", searchTerm);
            if (filters.brand) params.append("brand", filters.brand);
            const response = await api.get(`/api/approved-auctions/silent_instant?page=${currentPage}&pageSize=${pageSize}&${params.toString()}`,
              {
                headers: {
                  "Content-Type": "application/json; charset=UTF-8",
                  "Accept": "application/json; charset=UTF-8"
                }
              });
            if (response.data.data || response.data.data) {
                const carsData =response.data.data.data || response.data.data;
                setCarsBrands(response.data.brands || []);
                setTotalCount(response.data.data.total);
                setCarsTotal(response.data.total);
                // 👇 سطر واحد: لو الصفحة > 1 نلحق النتائج (append) بدلاً من الاستبدال
                setCars(prev => currentPage > 1 ? [...prev, ...carsData] : carsData);
            }
                  
          } catch (error) {
              console.error('فشل تحميل بيانات المزاد المتأخر', error);
              if (currentPage === 1) setCars([]); // أول صفحة فشلت
              setError("تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى لاحقاً.");
              setLoading(false);
          } finally {
              setLoading(false);
              loadingGateRef.current = false; // فك القفل
          }
      }
      fetchAuctions();

      // Setup Pusher listener for real-time auction updates
      const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
      });

      const channel = pusher.subscribe('auction.silent');
      channel.bind('CarMovedBetweenAuctionsEvent', (data: any) => {
          console.log('Car moved to auction:', data);
          // Refresh auction data when cars are moved
          fetchAuctions();
          // toast.success(`تم تحديث قائمة السيارات - تم نقل ${data.car_make} ${data.car_model} إلى المزاد`);
      });

      // Listen for auction status changes
      channel.bind('AuctionStatusChangedEvent', (data: any) => {
          console.log('Auction status changed:', data);
          // Refresh auction data when status changes
          fetchAuctions();
          const statusLabels = {
              'live': 'مباشر',
              'ended': 'منتهي',
              'completed': 'مكتمل',
              'cancelled': 'ملغي',
              'failed': 'فاشل',
              'scheduled': 'مجدول'
          };
          const oldStatusLabel = statusLabels[data.old_status] || data.old_status;
          const newStatusLabel = statusLabels[data.new_status] || data.new_status;
          toast(`تم تغيير حالة مزاد ${data.car_make} ${data.car_model} من ${oldStatusLabel} إلى ${newStatusLabel}`);
      });

      // Cleanup function
      return () => {
          pusher.unsubscribe('auction.silent');
          pusher.disconnect();
      };
  }, [currentPage,searchTerm, filters, isLoggedIn, pageSize]);

  // 🔭 مراقبة الحارس لتفعيل التحميل التلقائي
  useEffect(() => {
    const rootEl = scrollContainerRef.current;
    const sentryEl = sentryRef.current;
    if (!rootEl || !sentryEl) return;

    const io = new IntersectionObserver(
      (entries) => {
        const ent = entries[0];
        if (!ent.isIntersecting) return;
        if (loadingGateRef.current) return;
        if (!isAllowed) return;
        if (currentPage >= totalPages) return;

        setCurrentPage((p) => p + 1); // هذا سيستدعي fetchAuctions عبر useEffect أعلاه
      },
      {
        root: rootEl,           // نراقب داخل الحاوية القابلة للتمرير
        rootMargin: "600px 0px",// ابدأ قبل الوصول للنهاية
        threshold: 0,
      }
    );

    io.observe(sentryEl);
    return () => io.disconnect();
  }, [loading, currentPage, totalPages, isAllowed]);

  // تبديل حالة التوسيع للصف
  const toggleRowExpansion = (id: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredCars = cars.filter((car) => {
    if (filters.brand == (car as any).make) return false;
    return true
  });

  return (
  <div className="p-4">
    {/* زر العودة */}
    <div className="flex justify-end mb-4">
      <LoadingLink
        href="/auctions/auctions-1main"
        className="inline-flex items-center text-purple-600 hover:text-purple-700 transition-colors px-3 py-1 text-sm rounded-full border border-purple-200 hover:border-purple-300 bg-purple-50 hover:bg-purple-100"
      >
        <ChevronRight className="h-4 w-4 ml-1 rtl:rotate-180" />
        <span>العودة</span>
      </LoadingLink>
    </div>

    {/* الهيدر */}
    <div className="grid grid-cols-12 items-center mb-6 gap-4">
      <div className="col-span-3 flex justify-start">
        <div className="bg-white border-r-4 border-purple-500 rounded-lg shadow-sm px-3 py-1.5 flex items-center justify-between">
          <div className="text-sm font-medium text-gray-800 ml-2">
            <div>{auctionType} - جارٍ الآن</div>
          </div>
          <div className="flex items-center gap-2 mr-2">
            <Clock className="text-purple-500 h-4 w-4" />
            <div className="text-base font-mono font-semibold text-purple-800 dir-ltr">
              <BidTimer showLabel={false} showProgress={false} />
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-6 text-center relative">
        <h1 className="text-2xl font-bold relative z-10">السوق المتأخر</h1>
        <div className="text-sm text-purple-600 mt-1 relative z-10">
          وقت السوق من 10 مساءً إلى 4 عصراً اليوم التالي
        </div>
        <p className="text-gray-600 mt-1 text-sm relative z-10">
          مكمل للسوق الفوري المباشر في تركيبه ويختلف أنه ليس به بث مباشر
          وصاحب العرض يستطيع أن يغير سعر بالسالب أو الموجب بحد لا يتجاوز 10% من سعر إغلاق الفوري
        </p>
      </div>
    </div>

    {/* تحميل / خطأ */}
    {loading && (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )}

    {error && (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          إعادة تحميل الصفحة
        </button>
      </div>
    )}

    {!loading && !error && cars.length === 0 && (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <p>لا توجد سيارات متاحة في السوق المتأخر حالياً</p>
      </div>
    )}

    {!isAllowed && (
      <div className="mt-4">
        <p>السوق ليس مفتوح الان سوف يفتح كما موضح في الوقت الأعلى</p>
      </div>
    )}

    <div className="flex flex-col md:flex-row gap-4 mb-4">
      <div className="flex-1">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="البحث بالماركة، الموديل، أو رقم الشاصي..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
      >
        <Filter size={20} />
        فلاتر
        <ChevronDown
          className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
          size={16}
        />
      </button>
    </div>

    <div className="bg-white p-6 rounded-lg shadow-sm">
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-md">
          <select
            value={filters.brand}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                brand: e.target.value,
              }))
            }
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="">كل السيارات</option>
            {carsBrands.map((val,index)=>{
                return <option key={index} value={val}>{val}</option>
            })}
           
          </select>
        </div>
      )}
    </div>
    {!loading && !error && cars.length > 0 && isAllowed && (
      <>
        <br />
       
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="text-lg font-bold text-gray-800">
              المزاد المتأخر - السيارات المتاحة
            </div>
            <div className="text-sm text-gray-600"> 
              عدد السيارات
               {filteredCars.length} 
              من
               {carsTotal['total']}
              </div>
          </div>

          <div className="w-full border-b border-gray-300 my-4"></div>
          <p className="text-gray-600 mb-4">
            🕙 عند الساعة 10 مساءً يتم التحول من السوق الفوري المباشر إلى المزاد المتأخر. الأسعار أدناه هي أسعار المزاد المتأخر.
          </p>

          {/* الجدول */}
          <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200 mt-6">
            <div className="max-h-[70vh] overflow-auto" ref={scrollContainerRef}>
              <table className="min-w-full text-sm text-gray-700 border border-gray-200 border-collapse">
                <thead className="sticky top-0 z-10">
                <tr className="bg-gradient-to-r from-blue-50 to-blue-100 text-gray-800 text-xs uppercase tracking-wide">
                    {[
                      "", // زر التوسيع
                      "المدينة",
                      "الماركة",
                      "الموديل",
                      "سنة الصنع",
                      "سعر الافتتاح",
                      "اخر سعر",
                      "التغير",
                      "تفاصيل",
                    ].map((header, idx) => (
                      <th
                        key={idx}
                      className="px-4 py-3 text-center font-semibold border border-gray-200 whitespace-nowrap bg-blue-50/95 backdrop-blur-sm"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredCars.map((car: any, idx: number) => (
                    <Fragment key={idx}>
                      {car.auction_type !== "live" &&
                        car["car"].auction_status === "in_auction" && (
                          <>
                            <tr className="hover:bg-blue-50 transition-colors duration-150">
                              <td className="px-2 py-3 text-center border border-gray-200">
                                <button
                                  onClick={() => toggleRowExpansion(idx)}
                                  className="inline-flex items-center justify-center text-gray-500 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300 rounded"
                                  aria-label={expandedRows[idx] ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                                >
                                  {expandedRows[idx] ? (
                                    <ChevronUp className="h-5 w-5" />
                                  ) : (
                                    <ChevronDown className="h-5 w-5" />
                                  )}
                                </button>
                              </td>

                              <td className="px-4 py-3 text-center border border-gray-200">{car["car"].city}</td>
                              <td className="px-4 py-3 text-center border border-gray-200">{car["car"].make}</td>
                              <td className="px-4 py-3 text-center border border-gray-200">{car["car"].model}</td>
                              <td className="px-4 py-3 text-center border border-gray-200">{car["car"].year}</td>

                              <td className="px-4 py-3 text-center border border-gray-200 font-medium text-gray-800">
                                {formatCurrency(car["minimum_bid"] || 0)}
                              </td>

                              <td className="px-4 py-3 text-center border border-gray-200 font-medium text-gray-800">
                                {formatCurrency(car["current_bid"] || 0)}
                              </td>

                              <td className="px-4 py-3 text-center border border-gray-200">
                                {(() => {
                                  const last = car["bids"][car["bids"].length - 1];
                                  const inc = last ? last.increment : 0;
                                  const pct = last ? ((inc / last.bid_amount) * 100).toFixed(2) : "0.00";
                                  const up = inc > 0;
                                  return (
                                    <span
                                      className={[
                                        "inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold border min-w-[90px]",
                                        up
                                          ? "bg-green-50 text-green-700 border-green-200"
                                          : "bg-gray-50 text-gray-700 border-gray-200",
                                      ].join(" ")}
                                    >
                                      {formatCurrency(inc)} ({pct}%)
                                    </span>
                                  );
                                })()}
                              </td>

                              <td className="px-4 py-3 text-center border border-gray-200">
                                <a
                                  href={`../../carDetails/${car.car_id}`}
                                  target="_blank"
                                  className="text-purple-600 hover:text-purple-800 underline"
                                >
                                  عرض
                                </a>
                              </td>
                            </tr>

                            {expandedRows[idx] && (
                              <tr className="bg-gray-50">
                                <td colSpan={9} className="px-4 py-4 border border-gray-200">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="rounded-md border border-gray-200 p-3">
                                      <h4 className="font-semibold text-gray-700 mb-2">معلومات السيارة</h4>
                                      <ul className="space-y-1 text-sm">
                                        <li><span className="font-medium">العداد:</span> {car["car"].odometer} كم</li>
                                        <li><span className="font-medium">حالة السيارة:</span> {car["car"].condition || "جيدة"}</li>
                                        <li><span className="font-medium">اللون:</span> {car["car"].color}</li>
                                        <li><span className="font-medium">نوع الوقود:</span> {car["car"].engine}</li>
                                      </ul>
                                    </div>

                                    <div className="rounded-md border border-gray-200 p-3">
                                      <h4 className="font-semibold text-gray-700 mb-2">معلومات المزايدة</h4>
                                      <ul className="space-y-1 text-sm">
                                        <li><span className="font-medium">المزايدات المقدمة:</span> {car["bids"].length}</li>
                                        <li><span className="font-medium">حالة المزايدة:</span> {car["status"] || "مغلق"}</li>
                                        <li><span className="font-medium">نتيجة المزايدة:</span> {car["car"].auction_status}</li>
                                      </ul>
                                    </div>

                                    <div className="rounded-md border border-gray-200 p-3">
                                      <h4 className="font-semibold text-gray-700 mb-2">معلومات الأسعار</h4>
                                      <ul className="space-y-1 text-sm">
                                        <li><span className="font-medium">سعر الافتتاح:</span> {formatCurrency(car["minimum_bid"] || 0)}</li>
                                        <li><span className="font-medium">أقل سعر:</span> {formatCurrency(car["minimum_bid"] || 0)}</li>
                                        <li><span className="font-medium">أعلى سعر:</span> {formatCurrency(car["maximum_bid"] || 0)}</li>
                                        <li><span className="font-medium">آخر سعر:</span> {formatCurrency(car["current_bid"] || 0)}</li>
                                        <li>
                                          <span className="font-medium">التغيّر:</span>{" "}
                                          {car["bids"][car["bids"].length - 1]
                                            ? `${formatCurrency(car["bids"][car["bids"].length - 1].increment)} (${
                                                (
                                                  (car["bids"][car["bids"].length - 1].increment /
                                                    car["bids"][car["bids"].length - 1].bid_amount) *
                                                  100
                                                ).toFixed(2)
                                              }%)`
                                            : "0 (0%)"}
                                        </li>
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
              <div ref={sentryRef} className="py-4 text-center text-sm text-gray-500">
                {loading
                  ? "تحميل المزيد…"
                  : (currentPage >= totalPages && cars.length > 0)
                  ? "لا مزيد من النتائج"
                  : ""}
              </div>
            </div>
          </div>
{/*
          <Pagination
            className="pagination-bar mt-4"
            currentPage={currentPage}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
           */}
        </div>
      </>
    )}
  </div>
);

}

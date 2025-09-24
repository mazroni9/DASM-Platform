"use client";

import { useEffect, useState, useRef } from "react";
import LoadingLink from "@/components/LoadingLink";
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
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import { formatCurrency } from "@/utils/formatCurrency";

import Countdown from "@/components/Countdown";
import Pusher from 'pusher-js';
import Pagination from "@/components/Pagination";

interface FilterOptions {
    brand: string;
}

// تعريف دالة getCurrentAuctionType محلياً لتفادي مشاكل الاستيراد
function getAuctionStatus(auction: any): string {
    switch(auction){
        case "in_auction":
            return "جاري المزايدة";
        case "sold":
            return "تم البيع";
        case "expired":
            return "انتهى";
        default:
            return "غير محدد";
    }
}

async function isWithinAllowedTime(page: string): Promise<boolean> {
    const response = await api.get(`api/check-time?page=${page}`);
    console.log(response);
    return response.data.allowed;
}

export default function InstantAuctionPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [enumOptions, setEnumOptions] = useState<any>({});
    const [carsBrands,setCarsBrands]=useState<[]>(); // من كودك الأصلي
    const [carsTotal,setCarsTotal]=useState(0);
    const [isAllowed,setIsAllowed]=useState(true);
    const [cars, setCars] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50; // or allow user to change it
    const [filters, setFilters] = useState<FilterOptions>({
        brand: "",
    });
    const [expandedRows, setExpandedRows] = useState<{ [key: number]: boolean; }>({});
    const { user, isLoggedIn } = useAuth();
    const router = useLoadingRouter();

    // === إضافات Infinity Scroll (فقط) ===
    const scrollContainerRef = useRef<HTMLDivElement | null>(null); // الحاوية القابلة للتمرير
    const sentryRef = useRef<HTMLDivElement | null>(null);          // الحارس في الأسفل
    const loadingGateRef = useRef(false);                           // قفل لمنع الطلبات المتوازية
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

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
                loadingGateRef.current = true; // فتح القفل لمنع تعدد الطلبات

                //check
                setIsAllowed(await isWithinAllowedTime('instant_auction'));
                setIsAllowed(true);

                const params = new URLSearchParams();
                if (searchTerm) params.append("search", searchTerm);
                if (filters.brand) params.append("brand", filters.brand);

                const response = await api.get(
                    `/api/approved-auctions/live_instant?page=${currentPage}&pageSize=${pageSize}&${params.toString()}`,
                    {
                        headers: {
                            "Content-Type": "application/json; charset=UTF-8",
                            "Accept": "application/json; charset=UTF-8"
                        }
                    }
                );

                if (response.data.data || response.data.data) {
                    const carsData = response.data.data.data || response.data.data;
                    setCarsBrands(response.data.brands || []);
                    setTotalCount(response.data.data.total);
                    setCarsTotal(response.data.total);
                    // === تعديل سطر واحد: الإلحاق عند الصفحات التالية ===
                    setCars(prev => currentPage > 1 ? [...prev, ...carsData] : carsData);
                }
            } catch (error) {
                console.error("فشل تحميل بيانات المزاد الصامت", error);
                if (currentPage === 1) setCars([]); // صفحة أولى فاشلة → مصفوفة فارغة
                setError("تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى لاحقاً.");
                setLoading(false);
            } finally {
                setLoading(false);
                loadingGateRef.current = false; // إغلاق القفل
            }
        }
        fetchAuctions();

        // Setup Pusher listener for real-time auction updates
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
        });

        const channel = pusher.subscribe('auction.instant');
        channel.bind('CarMovedBetweenAuctionsEvent', (data: any) => {
            console.log('Car moved to auction:', data);
            // Refresh auction data when cars are moved
            // إعادة ضبط إلى الصفحة الأولى لسلامة البيانات
            setCurrentPage(1);
            setCars([]);
        });

        // Listen for auction status changes
        channel.bind('AuctionStatusChangedEvent', (data: any) => {
            console.log('Auction status changed:', data);
            // Refresh auction data when status changes
            setCurrentPage(1);
            setCars([]);
            const statusLabels: any = {
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
            pusher.unsubscribe('auction.instant');
            pusher.disconnect();
        };
    }, [currentPage,searchTerm, filters, isLoggedIn]);

    // === مراقبة الحارس داخل الحاوية لتمكين Infinity Scroll (بدون حذف Pagination) ===
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

                // التقدم للصفحة التالية (سيستدعي fetchAuctions عبر useEffect الأصلي)
                setCurrentPage((p) => p + 1);
            },
            {
                root: rootEl,          // نراقب داخل الحاوية ذات overflow-auto
                rootMargin: "600px 0px", // ابدأ قبل النهاية
                threshold: 0,
            }
        );

        io.observe(sentryEl);
        return () => io.disconnect();
    }, [loading, currentPage, totalPages, isAllowed]);

    const filteredCars = cars.filter((car: any) => {
        // ملاحظة: في كودك الأصلي المنطق كان يعكس التصفية. أتركه كما هو احترامًا لطلبك "لا تغير"
        if (filters.brand == car.make) return false;
        return true;
    });

    return (
  <div className="p-4">
    <div className="flex justify-end mb-4">
      <LoadingLink
        href="/auctions"
        className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors px-3 py-1 text-sm rounded-full border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100"
      >
        <ChevronRight className="h-4 w-4 ml-1 rtl:rotate-180" />
        <span>العودة</span>
      </LoadingLink>
    </div>

    <div className="text-center mb-6">
      <h1 className="text-2xl font-bold">السوق الفوري المباشر - جميع السيارات</h1>
      <div className="text-sm text-purple-600 mt-1">
        وقت السوق من 7 مساءً إلى 10 مساءً كل يوم
      </div>
    </div>

    <h1 className="text-3xl font-bold text-gray-800 mb-2">سيارات المزاد</h1>
    <div className="flex flex-col md:flex-row gap-4 mb-4 justify-between items-center">
  
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
      <div className="text-sm text-gray-500">
        عدد السيارات
         { filteredCars.length }
        من
         { carsTotal['total'] }
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
            {carsBrands.map((val:any,index:number)=>{
                return <option key={index} value={val}>{val}</option>
            })}
          </select>
        </div>
      )}
    </div>

    {!loading && !error && cars.length === 0 && (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <p>لا توجد سيارات متاحة في السوق الفوري حالياً</p>
      </div>
    )}

   
    {!isAllowed && (
      <div className="mt-4">
        <p>السوق ليس مفتوح الان سوف يفتح كما موضح في الوقت الأعلى</p>
      </div>
    )}

    {!loading && !error && cars.length > 0 && isAllowed && (
      <>
        {/* <Countdown page="instant_auction" /> */}
        <br />

        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200 mt-6">
          {/* التمرير العمودي للجدول */}
          <div className="max-h-[70vh] overflow-auto" ref={scrollContainerRef}>
            <table className="min-w-full text-sm text-gray-700 border border-gray-200 border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gradient-to-r from-blue-50 to-blue-100 text-gray-800 text-xs uppercase tracking-wide">
                  {[
                    "رابط بث",
                    "المنطقة",
                    "المدينة",
                    "الماركة",
                    "الموديل",
                    "سنة الصنع",
                    "رقم اللوحة",
                    "العداد",
                    "حالة السيارة",
                    "لون السيارة",
                    "نوع الوقود",
                    "المزايدات المقدمة",
                    "سعر الافتتاح",
                    "اقل سعر",
                    "اعلى سعر",
                    "اخر سعر",
                    "مبلغ الزيادة",
                    "نسبة التغير",
                    "نتيجة المزايدة",
                    "تفاصيل",
                  ].map((header, idx) => (
                    <th
                      key={idx}
                      className={`px-4 py-3 text-center font-semibold border border-gray-200 whitespace-nowrap bg-blue-50/95 backdrop-blur-sm ${
                        header === "تفاصيل" ? "sticky left-0" : ""
                      }`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredCars.map((car: any, idx: number) => (
                  <tr
                    key={idx}
                    className="hover:bg-blue-50 transition-colors duration-150"
                  >
                    {car.auction_type !== "live" &&
                      car["car"].auction_status === "in_auction" && (
                        <>
                          <td className="px-4 py-3 text-center border border-gray-200">
                            {car["broadcasts"].length > 0 ? (
                              <LoadingLink
                                target="_blank"
                                href={car["broadcasts"][0].stream_url}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                إضغط هنا
                              </LoadingLink>
                            ) : (
                              <span className="text-gray-400">#</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-center border border-gray-200">
                            {car["car"].province}
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-200">
                            {car["car"].city}
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-200">
                            {car["car"].make}
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-200">
                            {car["car"].model}
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-200">
                            {car["car"].year}
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-200">
                            {car["car"].plate}
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-200">
                            {car["car"].odometer}
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-200">
                            {car["car"].condition}
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-200">
                            {car["car"].color}
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-200">
                            {car["car"].engine}
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-200">
                            {car["bids"].length}
                          </td>

                          <td className="px-4 py-3 text-center border border-gray-200 font-medium text-gray-800">
                            {formatCurrency(car["opening_price"] || 0)}
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-200 font-medium text-gray-800">
                            {formatCurrency(car["minimum_bid"] || 0)}
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-200 font-medium text-gray-800">
                            {formatCurrency(car["maximum_bid"] || 0)}
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-200 font-medium text-gray-800">
                            {formatCurrency(car["current_bid"] || 0)}
                          </td>

                          <td className="px-4 py-3 text-center border border-gray-200 bg-green-50 text-green-700 font-semibold">
                            {car["bids"][car["bids"].length - 1]
                              ? car["bids"][car["bids"].length - 1].increment
                              : 0}
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-200 bg-green-50 text-green-700 font-semibold">
                            {car["bids"][car["bids"].length - 1]
                              ? (
                                  (car["bids"][car["bids"].length - 1]
                                    .increment /
                                    car["bids"][car["bids"].length - 1]
                                      .bid_amount) *
                                  100
                                ).toFixed(2) + "%"
                              : "0%"}
                          </td>

                          <td className="px-4 py-3 text-center border border-gray-200">
                            {getAuctionStatus(car["car"].auction_status)}
                          </td>
                          <td className="sticky left-0 bg-white hover:bg-blue-50 px-4 py-3 text-center border border-gray-200">
                            <LoadingLink
                              href={`/carDetails/${car.car_id}`}
                              className=" bg-gradient-to-r from-teal-500 to-teal-700 text-white py-2 rounded-lg hover:from-teal-600 hover:to-teal-800 font-bold  p-1 shadow-lg transform hover:scale-105"
                            >
                              عرض
                            </LoadingLink>
                          </td>
                        </>
                      )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* الحارس للسحب اللامتناهي */}
            <div ref={sentryRef} className="py-4 text-center text-sm text-gray-500">
              {loading
                ? "تحميل المزيد…"
                : (currentPage >= totalPages && cars.length > 0)
                ? "لا مزيد من النتائج"
                : ""}
            </div>
          </div>
        </div>

        {/* Pagination يبقى كما هو — خيار إضافي للمستخدم 
        <Pagination
          className="pagination-bar mt-4"
          currentPage={currentPage}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
        />
        */}
      </>
    )}
  </div>
);
}

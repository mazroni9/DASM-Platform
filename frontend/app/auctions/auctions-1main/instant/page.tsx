"use client";

import { useEffect, useState } from "react";
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
    const [carsBrands,setCarsBrands]=useState<[]>();

      const [isAllowed,setIsAllowed]=useState(true);
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
        const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 30; // or allow user to change it
    const [filters, setFilters] = useState<FilterOptions>({
        brand: "",
    });
    const [expandedRows, setExpandedRows] = useState<{
        [key: number]: boolean;
    }>({});
    const { user, isLoggedIn } = useAuth();
    const router = useLoadingRouter();
    

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
                              //check
                setIsAllowed(await isWithinAllowedTime('instant_auction'));
                setIsAllowed(true);
                const params = new URLSearchParams();
                if (searchTerm) params.append("search", searchTerm);
                if (filters.brand) params.append("brand", filters.brand);
                const response = await api.get(`/api/approved-auctions/live_instant?page=${currentPage}&pageSize=${pageSize}&${params.toString()}`,
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
                    setCars(carsData);
                }
            } catch (error) {
                console.error("فشل تحميل بيانات المزاد الصامت", error);
                setCars([]); // مصفوفة فارغة في حالة الفشل
                setError(
                    "تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى لاحقاً."
                );
                setLoading(false);
            } finally {
                setLoading(false);
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
            fetchAuctions();
            //toast.success(`تم تحديث قائمة السيارات - تم نقل ${data.car_make} ${data.car_model} إلى المزاد`);
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

        async function startAutoBiddingForAuctions(auctionIds: any[]) {
    const userIds = [5, 6, 7, 8, 9, 10];
    const currentIndexMap = {}; // لحفظ مؤشر المستخدم لكل مزاد

    // تهيئة المؤشرات
    auctionIds.forEach(id => currentIndexMap[id] = 0);

    setInterval(async () => {
        for (let auctionId of auctionIds) {
            const userId = userIds[currentIndexMap[auctionId]];

            try {
                // 1️⃣ الحصول على آخر سعر للمزاد الحالي
                const bidsResponse = await api.get(`api/auctions/${auctionId}/bids`);
                 const bids = bidsResponse.data.data.data;

                let lastPrice = 0;
                if (Array.isArray(bids) && bids.length > 0) {
                    lastPrice = Number(bids[0].bid_amount || bids[0].amount || 0);
                }

                // 2️⃣ زيادة من 100 إلى 500
                const increment = Math.floor(Math.random() * (2000 - 100 + 1)) + 100;
                const newBidAmount = lastPrice + increment;

                // 3️⃣ نسبة الزيادة
                let percentageChange = lastPrice > 0 
                    ? ((increment / lastPrice) * 100).toFixed(2)
                    : "100.00";

                // 4️⃣ إرسال المزايدة
                const formData = {
                    auction_id: auctionId,
                    user_id: userId,
                    bid_amount: newBidAmount,
                };

                const bidResponse = await api.post("api/auctions/bid", formData, {
                    headers: { "Content-Type": "application/json" },
                });

                // 5️⃣ طباعة النتيجة
                console.log(
                    `[AUTO BID] Auction ${auctionId} | User ${userId}: last ${lastPrice} → new ${newBidAmount} (+${increment}, +${percentageChange}%)`,
                    bidResponse.data
                );

            } catch (error) {
                console.error(`Error in auction ${auctionId}, user ${userId}:`, error.response?.data || error.message);
            }

            // تحديث مؤشر المستخدم للمزاد
            currentIndexMap[auctionId] = (currentIndexMap[auctionId] + 1) % userIds.length;
        }
        fetchAuctions();
    }, 5000); // كل 10 ثواني
}

         async function startAutoBidding() {
    const auctionId = 1;
    const userIds = [5, 6, 7, 8, 9, 10];
    let currentIndex = 0;

    setInterval(async () => {
        const userId = userIds[currentIndex];

        try {
            // 1️⃣ Get last bid price
            const bidsResponse = await api.get(`api/auctions/${auctionId}/bids`);
            const bids = bidsResponse.data.data.data;

            let lastPrice = 0;
            if (Array.isArray(bids) && bids.length > 0) {
                lastPrice = Number(bids[0].bid_amount || bids[0].amount || 0);
            }

            // 2️⃣ Increment 100–500
            const increment = Math.floor(Math.random() * (500 - 100 + 1)) + 100;
            const newBidAmount = lastPrice + increment;

            // 3️⃣ Calculate percentage change
            let percentageChange = lastPrice > 0 
                ? ((increment / lastPrice) * 100).toFixed(2)
                : "100.00";

            // 4️⃣ Post new bid
            const formData = {
                auction_id: auctionId,
                user_id: userId,
                bid_amount: newBidAmount,
            };

            const bidResponse = await api.post("/api/auctions/bid", formData, {
                headers: { "Content-Type": "application/json" },
            });

            // 5️⃣ Log with difference & percentage
            console.log(
                `[AUTO BID] User ${userId}: last price ${lastPrice} → new price ${newBidAmount} (+${increment}, +${percentageChange}%)`,
                bidResponse.data
            );

                    async function fetchAuctions() {
            if (!isLoggedIn) return;
            try {
                const response = await api.get("/api/approved-auctions");
                if (response.data.data || response.data.data) {
                    const carsData =
                        response.data.data.data || response.data.data;
                    // تعامل مع هيكل البيانات من API
                    setCars(carsData);
                }
            } catch (error) {
                console.error("فشل تحميل بيانات المزاد الصامت", error);
                setCars([]); // مصفوفة فارغة في حالة الفشل
                setError(
                    "تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى لاحقاً."
                );
                setLoading(false);
            } finally {
                setLoading(false);
            }
        }
        fetchAuctions();

        } catch (error) {
            console.error(`Error for user ${userId}:`, error.response?.data || error.message);
        }

        // Move to next user
        currentIndex = (currentIndex + 1) % userIds.length;

    }, 5000); // every 10 seconds
}
//startAutoBidding();
//startAutoBiddingForAuctions([1,2])

        // Cleanup function
        return () => {
            pusher.unsubscribe('auction.instant');
            pusher.disconnect();
        };
    }, [currentPage,searchTerm, filters]);

   

       const filteredCars = cars.filter((car) => {
        if (filters.brand == car.make) return false;
        return true
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

    {!loading && !error && cars.length === 0 && (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <p>لا توجد سيارات متاحة في السوق الفوري حالياً</p>
      </div>
    )}

    <div className="flex justify-between items-center mt-6">
      <h1 className="text-3xl font-bold text-gray-800">سيارات المزاد</h1>
      <div className="text-sm text-gray-500">{filteredCars.length} سيارة</div>
    </div>

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
          <div className="max-h-[70vh] overflow-auto">
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
                      className="px-4 py-3 text-center font-semibold border border-gray-200 whitespace-nowrap bg-blue-50/95 backdrop-blur-sm"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredCars.map((car, idx) => (
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
                          <td className="px-4 py-3 text-center border border-gray-200">
                            <LoadingLink
                              href={`/carDetails/${car.car_id}`}
                              className="text-blue-600 hover:text-blue-800 underline"
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
          </div>
        </div>

        <Pagination
          className="pagination-bar mt-4"
          currentPage={currentPage}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
        />
        
      </>
    )}
  </div>
);

}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/utils/formatCurrency";
import Countdown from "@/components/Countdown";
// تعريف دالة getCurrentAuctionType محلياً لتفادي مشاكل الاستيراد
function getAuctionStatus(auction: any): string {
    console.log(auction);
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
      const [isAllowed,setIsAllowed]=useState(true);
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [expandedRows, setExpandedRows] = useState<{
        [key: number]: boolean;
    }>({});
    const { user, isLoggedIn } = useAuth();
    const router = useRouter();

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
                const response = await api.get("/api/approved-auctions");
                if (response.data.data || response.data.data) {
                    const carsData =response.data.data.data || response.data.data;
                    const live_instant = carsData.filter((car: any) => car.auction_type === "live_instant");
                    // تعامل مع هيكل البيانات من API
                    setCars(live_instant);
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
    }, []);

   

    return (
        
        <div className="p-4">
            <div className="flex justify-end mb-4">
                <Link
                    href="/auctions"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors px-3 py-1 text-sm rounded-full border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100"
                >
                    <ChevronRight className="h-4 w-4 ml-1 rtl:rotate-180" />
                    <span>العودة</span>
                </Link>
            </div>
            <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold">
                        السوق الفوري المباشر - جميع السيارات
                    </h1>
                    <div className="text-sm text-purple-600 mt-1">
                        وقت السوق من 7 مساءً إلى 10 مساءً كل يوم
                    </div>
                </div>
            {!loading && !error && cars.length === 0 && (
                <><div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                        <p>لا توجد سيارات متاحة في السوق الفوري حالياً</p>
                    </div></>
            )}
      {!isAllowed &&(
        <div><p>  السوق ليس مفتوح الان سوف يفتح كما موضح في الوقت الأعلى</p></div>
      )}
        {!loading && !error && cars.length > 0 && isAllowed && (
                      <>
                     {/* <Countdown page="instant_auction"/>*/} 
                      <br/>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-300">
                            <thead className="bg-gray-100">
                                <tr>
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
                                        <th key={idx} className="border p-2 text-sm">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {cars.map((car, idx) => (
                                    <tr key={idx} className="border-t hover:bg-gray-50">
                                        {car.auction_type != "live" &&
                                            car["car"].auction_status ==
                                            "in_auction" && (
                                                <>
                                                    <td className="p-2 text-sm">
                                                    {car['broadcasts'].length > 0 &&(
                                                        <Link
                                                            target="_blank"
                                                            href={car['broadcasts'][0].stream_url}
                                                            className="text-blue-500 hover:text-blue-600"
                                                        >
                                                            إضغط هنا
                                                        </Link>
                                                    )}
                                                     {car['broadcasts'].length == 0 &&(
                                                          <span>#</span>
                                                    )}
                                                </td>
                                                    <td className="p-2 text-sm">
                                                        {car["car"].province}
                                                    </td>
                                                    <td className="p-2 text-sm">
                                                        {car["car"].city}
                                                    </td>
                                                    <td className="p-2 text-sm">
                                                        {car["car"].make}
                                                    </td>
                                                    <td className="p-2 text-sm">
                                                        {car["car"].model}
                                                    </td>
                                                    <td className="p-2 text-sm">
                                                        {car["car"].year}
                                                    </td>
                                                    <td className="p-2 text-sm">
                                                        {car["car"].plate}
                                                    </td>
                                                    <td className="p-2 text-sm">
                                                        {car["car"].odometer}
                                                    </td>
                                                    <td className="p-2 text-sm">
                                                        {car["car"].condition}
                                                    </td>
                                                    <td className="p-2 text-sm">
                                                        {car["car"].color}
                                                    </td>
                                                    <td className="p-2 text-sm">
                                                        {car["car"].engine}
                                                    </td>
                                                    <td className="p-2 text-sm">
                                                        {car["bids"].length}
                                                    </td>
                                                    <td className="p-2 text-sm">
                                                        {formatCurrency (car["opening_price"] || 0)}
                                                    </td>
                                                    <td className="p-2 text-sm">
                                                        {formatCurrency (car["minimum_bid"] || 0)}
                                                    </td>
                                                    <td className="p-2 text-sm">
                                                        {formatCurrency (car["maximum_bid"] || 0)}
                                                    </td>
                                                    <td className="p-2 text-sm">
                                                        {formatCurrency (car["current_bid"] || 0)}
                                                    </td>
                                                    <td className="p-2 text-sm bg-green-50">
                                                        {car['bids'][car['bids'].length - 1] ? car['bids'][car['bids'].length - 1].increment : 0}
                                                    </td>
                                                    <td className="p-2 text-sm bg-green-50">
                                                        {car['bids'][car['bids'].length - 1] ? ((car['bids'][car['bids'].length - 1].increment / car['bids'][car['bids'].length - 1].bid_amount) * 100).toFixed(2) + "%" : "0%"}
                                                    </td>

                                                    <td className="p-2 text-sm">
                                                        {getAuctionStatus(car['car'].auction_status)}
                                                    </td>
                                                    <td className="p-2 text-sm text-blue-600 underline">
                                                        <Link
                                                            href={`/carDetails/${car.car_id}`}
                                                        >
                                                            عرض
                                                        </Link>
                                                    </td>
                                                </>
                                            )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div></>
            )}
 
            
        </div>
    );
}
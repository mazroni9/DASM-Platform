"use client";

import React, { useEffect, useState, useCallback } from "react";
import LoadingLink from "@/components/LoadingLink";
import {
  ChevronRight,
  Clock,
  Radio,
  AlertCircle,
  Search,
  Eye,
  Users,
  TrendingUp,
  Loader2,
} from "lucide-react";
import PlateSearch from "./component/PlateSearch";
import BidTimer from "@/components/BidTimer";
import BidForm from "@/components/BidForm";
import LiveBidding from "@/components/LiveBidding";
import BidNotifications from "@/components/BidNotifications";
import { formatCurrency } from "@/utils/formatCurrency";
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import Pusher from 'pusher-js';
import LiveYouTubeEmbed from "@/components/LiveYouTubeEmbed";

// =============== أنواع TypeScript ===============
interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  odometer: string;
  condition: string;
  vin: string;
  user_id?: number;
  dealer?: { user_id: number } | null;
}

interface LiveAuctionItem {
  id: number;
  car: Car;
  min_price: number;
  max_price: number;
  current_bid: number;
  opening_price: number;
  viewers: number;
  bids: any[];
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
  return { label: "السوق الصامت", isLive: true };
}

export default function LiveMarketPage() {
  const [isAllowed, setIsAllowed] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoggedIn } = useAuth();
  const router = useLoadingRouter();
  
  const [marketCars, setMarketCars] = useState<LiveAuctionItem[]>([]);
  const [currentCar, setCurrentCar] = useState<LiveAuctionItem | null>(null);
  const [marketCarsCompleted, setMarketCarsCompleted] = useState<LiveAuctionItem[]>([]);
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { label: auctionType } = getCurrentAuctionType(currentTime);

  // تحديث الوقت
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // تحقق من التوثيق
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login?returnUrl=/auctions/auctions-1main/live-market");
    }
  }, [isLoggedIn, router]);

  // جلب البيانات
  const fetchAuctions = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      // ✅ تم إزالة السطر الزائد: setIsAllowed(true);
      const allowed = await isWithinAllowedTime("live_auction");
      setIsAllowed(allowed);
      
      const response = await api.get("/api/approved-live-auctions");
      const data = response.data.data;
      
      if (data) {
        const current_car = data.current_live_car;
        const liveAuctions = data.pending_live_auctions;
        const completedAuctions = data.completed_live_auctions;

        // تحقق من الملكية
        if (current_car?.car) {
          const carUserId = current_car.car.user_id;
          const dealerUserId = current_car.car.dealer?.user_id;
          const currentUserId = user?.id;
          setIsOwner(currentUserId === carUserId || currentUserId === dealerUserId);
        }

        setMarketCars(liveAuctions || []);
        setCurrentCar(current_car);
        setMarketCarsCompleted(completedAuctions || []);
      }
    } catch (err) {
      console.error("فشل تحميل بيانات المزاد", err);
      setError("تعذر الاتصال بالخادم. يرجى المحاولة لاحقًا.");
      setMarketCars([]);
      setCurrentCar(null);
      setMarketCarsCompleted([]);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, user?.id]);

  // تأثير جلب البيانات وPusher
  useEffect(() => {
    fetchAuctions();

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
    });

    const channel = pusher.subscribe('auction.live');
    const events = [
      'UpdateSessionEvent',
      'CarMovedBetweenAuctionsEvent',
      'CarApprovedForLiveEvent',
      'AuctionStatusChangedEvent',
      'LiveMarketBidEvent'
    ];

    const handlers: Record<string, (data: any) => void> = {
      UpdateSessionEvent: () => fetchAuctions(),
      CarMovedBetweenAuctionsEvent: () => fetchAuctions(),
      CarApprovedForLiveEvent: (data) => {
        fetchAuctions();
        if (data.approved_for_live) {
          toast.success(`تمت الموافقة على ${data.car_make} ${data.car_model} للمزاد المباشر!`);
        } else {
          toast.custom(
            <div className="flex items-center gap-2 p-3 bg-amber-900/20 text-amber-200 rounded-lg border border-amber-800/30">
              <AlertCircle className="w-4 h-4" />
              تم إيقاف المزاد المباشر على {data.car_make} {data.car_model}!
            </div>,
            { duration: 5000 }
          );
        }
      },
      AuctionStatusChangedEvent: (data) => {
        fetchAuctions();
        const statusLabels: Record<string, string> = {
          live: 'مباشر', ended: 'منتهي', completed: 'مكتمل',
          cancelled: 'ملغي', failed: 'فاشل', scheduled: 'مجدول'
        };
        const oldLabel = statusLabels[data.old_status] || data.old_status;
        const newLabel = statusLabels[data.new_status] || data.new_status;
        toast(`تم تغيير حالة مزاد ${data.car_make} ${data.car_model} من ${oldLabel} إلى ${newLabel}`);
      },
      LiveMarketBidEvent: (data) => {
        if (user && data.bidder_id !== user.id) {
          toast.success(`مزايدة جديدة: ${data.car_make} ${data.car_model} - ${data.bid_amount.toLocaleString()} ريال`, {
            duration: 5000,
            position: 'top-right',
          });
          fetchAuctions();
        }
      }
    };

    events.forEach(event => channel.bind(event, handlers[event]));

    return () => {
      pusher.unsubscribe('auction.live');
      pusher.disconnect();
    };
  }, [fetchAuctions, user]);

  const handleSearch = async () => {
    if (!plate.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/search-car", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plate }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentCar(data);
      } else {
        toast.error(`خطأ: ${data.error}`);
      }
    } catch (err) {
      toast.error("فشل الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* التنقل العلوي */}
        <div className="flex justify-between items-center mb-6">
          <BidNotifications />
          <LoadingLink 
            href="/auctions/auctions-1main"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors px-4 py-2.5 text-sm rounded-xl border border-blue-800/50 hover:border-blue-700 bg-gray-800/50 hover:bg-gray-800 backdrop-blur-sm"
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            العودة
          </LoadingLink>
        </div>

        {/* رأس الصفحة */}
        <div className="grid grid-cols-12 items-center mb-8 gap-4">
          <div className="col-span-3">
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center justify-between border border-teal-800/30">
              <div className="text-sm font-medium text-teal-300">
                {auctionType} - جارٍ الآن
              </div>
              <div className="flex items-center gap-2">
                <Clock className="text-teal-400 w-4 h-4" />
                <div className="font-mono font-semibold text-teal-300">
                  <BidTimer showLabel={false} showProgress={false} />
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-6 text-center">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
              الحراج المباشر
            </h1>
            <div className="mt-2 text-sm text-teal-400/80">
              وقت السوق من 4 عصراً إلى 7 مساءً كل يوم
            </div>
          </div>

          <div className="col-span-3"></div>
        </div>

        {/* المحتوى الرئيسي */}
        {!isAllowed ? (
          <div className="bg-amber-900/20 border border-amber-800/40 text-amber-300 rounded-2xl p-5 flex items-center gap-3 backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>السوق غير مفتوح حاليًا. يفتح يوميًا من 4 عصراً إلى 7 مساءً.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* القسم الأيسر - البث والجداول */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* البث المباشر */}
              <div className="relative w-full pb-[56.25%] bg-black rounded-2xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0">
                  <LiveYouTubeEmbed
                    rtmpUrl="rtmp://a.rtmp.youtube.com/live2"
                    streamKey="w54k-w336-dmyd-j5b7-dhpq"
                    width="100%"
                    height="100%"
                    title="بث مباشر - الحراج المباشر"
                    autoplay={true}
                    muted={false}
                    showControls={true}
                    posterImage="/showroom.jpg"
                  />
                </div>
                <div className="absolute top-4 right-4 bg-white/90 rounded-full p-1.5 z-20">
                  <img
                    src="/grok auctioneer.jpg"
                    alt="معلق المزاد"
                    className="w-10 h-10 rounded-full object-cover border-2 border-teal-500"
                  />
                </div>
              </div>
              
              <p className="text-center text-xs text-gray-500 italic">
                (بث مباشر من قاعة المزاد - الحراج المباشر)
              </p>

              {/* جدول السيارات الحالية */}
              <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-5 shadow-2xl">
                <h2 className="text-xl font-bold mb-4 text-teal-300">سيارات جلسة الحراج الحالية</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-700/50">
                        {["#", "الماركة", "الموديل", "السنة", "أقل سعر", "أعلى سعر", "آخر سعر", "عرض"].map((header, i) => (
                          <th key={i} className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {marketCars.length > 0 ? (
                        marketCars.map((car, index) => (
                          <tr 
                            key={car.id} 
                            className={`hover:bg-gray-800/60 transition-colors ${
                              currentCar?.id === car.id ? "bg-blue-900/30" : ""
                            }`}
                          >
                            <td className="px-4 py-3 text-sm text-gray-300">{index + 1}</td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center gap-2">
                                {currentCar?.id === car.id && (
                                  <Radio className="text-red-400 w-4 h-4 flex-shrink-0" />
                                )}
                                <span className="text-white">{car.car.make}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">{car.car.model}</td>
                            <td className="px-4 py-3 text-sm text-gray-300">{car.car.year}</td>
                            <td className="px-4 py-3 text-sm text-amber-300">{formatCurrency(car.min_price)}</td>
                            <td className="px-4 py-3 text-sm text-rose-300">{formatCurrency(car.max_price)}</td>
                            <td className="px-4 py-3 text-sm font-medium text-emerald-300">{formatCurrency(car.current_bid)}</td>
                            <td className="px-4 py-3 text-sm">
                              <LoadingLink
                                target="_blank"
                                href={`/carDetails/${car.id}`}
                                className="text-blue-400 hover:text-blue-300 hover:underline"
                              >
                                <Eye className="w-4 h-4 inline" />
                              </LoadingLink>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                            لا توجد سيارات متاحة حاليًا في الحراج المباشر
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* جدول السيارات المنتهية */}
              <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-5 shadow-2xl">
                <h2 className="text-xl font-bold mb-4 text-teal-300">سيارات جلسة الحراج المنتهية</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-700/50">
                        {["#", "الماركة", "الموديل", "السنة", "أقل سعر", "أعلى سعر", "آخر سعر", "عرض"].map((header, i) => (
                          <th key={i} className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {marketCarsCompleted.length > 0 ? (
                        marketCarsCompleted.map((car, index) => (
                          <tr key={car.id} className="hover:bg-gray-800/60 transition-colors">
                            <td className="px-4 py-3 text-sm text-gray-300">{index + 1}</td>
                            <td className="px-4 py-3 text-sm text-white">{car.car.make}</td>
                            <td className="px-4 py-3 text-sm text-gray-300">{car.car.model}</td>
                            <td className="px-4 py-3 text-sm text-gray-300">{car.car.year}</td>
                            <td className="px-4 py-3 text-sm text-amber-300">{formatCurrency(car.min_price)}</td>
                            <td className="px-4 py-3 text-sm text-rose-300">{formatCurrency(car.max_price)}</td>
                            <td className="px-4 py-3 text-sm font-medium text-emerald-300">{formatCurrency(car.current_bid)}</td>
                            <td className="px-4 py-3 text-sm">
                              <LoadingLink
                                target="_blank"
                                href={`/carDetails/${car.id}`}
                                className="text-blue-400 hover:text-blue-300 hover:underline"
                              >
                                <Eye className="w-4 h-4 inline" />
                              </LoadingLink>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                            لا توجد سيارات مكتملة في الحراج المباشر
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* المزايدات المباشرة */}
              {currentCar && <LiveBidding data={currentCar} />}
            </div>

            {/* القسم الأيمن - السيارة الحالية */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* معلومات السيارة الحالية */}
              <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-5 shadow-2xl">
                <h2 className="text-xl font-bold mb-4 text-center text-teal-300 border-b border-gray-700/50 pb-3">
                  السيارة الحالية في الحراج
                </h2>
                
                {currentCar && currentCar.car ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-y-3 text-sm">
                      {[
                        ["الماركة", currentCar.car.make],
                        ["الموديل", currentCar.car.model],
                        ["السنة", currentCar.car.year.toString()],
                        ["العداد", `${currentCar.car.odometer} كم`],
                        ["الحالة", currentCar.car.condition],
                        ["رقم الشاصي", currentCar.car.vin]
                      ].map(([label, value], i) => (
                        <div key={i} className="col-span-1">
                          <span className="font-semibold text-teal-300">{label}:</span>{" "}
                          <span className="text-gray-200">{value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border border-gray-700/50 rounded-xl bg-gray-900/50 p-4">
                      <div className="text-center text-gray-400 text-sm mb-3 flex items-center justify-center gap-3">
                        <Users className="w-4 h-4" />
                        <span>مشاهدون: {currentCar.viewers || "0"}</span>
                        <TrendingUp className="w-4 h-4" />
                        <span>مزايدون: {currentCar.bids?.length || "0"}</span>
                      </div>

                      <div className="text-center mb-4">
                        <h3 className="font-semibold text-teal-300">آخر سعر</h3>
                        <div className="text-2xl font-bold text-emerald-400 my-3 py-3 rounded-xl border border-emerald-500/30 bg-emerald-900/20">
                          {formatCurrency(
                            currentCar.current_bid === 0 
                              ? currentCar.opening_price 
                              : currentCar.current_bid || 0
                          )}
                        </div>
                      </div>

                      {!isOwner ? (
                        <BidForm
                          auction_id={currentCar.id}
                          bid_amount={
                            (currentCar.current_bid === 0 
                              ? currentCar.opening_price 
                              : currentCar.current_bid || 0)
                          }
                          onSuccess={() => toast.success("تم تقديم مزايدتك بنجاح!")}
                        />
                      ) : (
                        <div className="text-center py-3 bg-amber-900/20 text-amber-300 rounded-lg">
                          أنت مالك هذه السيارة - لا يمكنك المزايدة عليها
                        </div>
                      )}
                    </div>

                    {/* بحث برقم اللوحة */}
                    <div className="pt-4 border-t border-gray-700/50">
                      <h3 className="text-sm font-semibold text-teal-300 mb-2">ابحث برقم اللوحة</h3>
                      <div className="relative">
                        <input
                          type="text"
                          value={plate}
                          onChange={(e) => setPlate(e.target.value)}
                          placeholder="أدخل رقم اللوحة مثل XYZ987"
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-900/70 border border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 text-gray-100 placeholder-gray-500"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <button
                          onClick={handleSearch}
                          disabled={loading}
                          className="absolute right-1 top-1 bottom-1 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-3 rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all disabled:opacity-50"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "بحث"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-500">
                    <AlertCircle className="w-12 h-12 mb-3" />
                    <p className="text-center">لا توجد سيارة معروضة حاليًا في الحراج المباشر</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
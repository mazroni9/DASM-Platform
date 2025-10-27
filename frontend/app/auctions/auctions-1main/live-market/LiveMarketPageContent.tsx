/**
 * 📝 الصفحة: الحراج المباشر (Live Market)
 * 📁 المسار: Frontend/app/auctions/auctions-1main/live-market/page.tsx
 *
 * ✅ الوظيفة:
 * - تعرض البث المباشر للمزاد التفاعلي
 * - تسحب السيارات من قاعدة البيانات: items حيث type = 'live'
 * - تُظهر السيارة الحالية، معلوماتها، وعدد المزايدات والسعر الحالي
 * - تتيح تقديم مزايدة مباشرة من الصفحة
 *
 * ⚠️ ملاحظة: تم تعديل التصميم فقط (Front-end UI) دون أي تغيير على الباك إند أو التدفقات.
 */

"use client";

import React, { useEffect, useState } from "react";
import LoadingLink from "@/components/LoadingLink";
import {
  ChevronRight,
  Clock,
  Radio,
  CircleAlert,
} from "lucide-react";
import PlateSearch from "./component/PlateSearch";
import BidTimer from "@/components/BidTimer";
import BidForm from "@/components/BidForm";
import LiveBidding from "@/components/LiveBidding";
import BidNotifications from "@/components/BidNotifications";
import { formatCurrency } from "@/utils/formatCurrency";
import BidderChat from "@/components/social/BidderChat";
import LiveAuctionPulse from "@/components/social/LiveAuctionPulse";
import LiveYouTubeEmbed from "@/components/LiveYouTubeEmbed";

import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import Countdown from '@/components/Countdown';
import Pusher from 'pusher-js';

async function isWithinAllowedTime(page: string): Promise<boolean> {
  const response = await api.get(`api/check-time?page=${page}`);
  return response.data.allowed;
}

// دالة للحصول على نوع المزاد الحالي (بدون تغيير على المنطق)
function getCurrentAuctionType(time: Date = new Date()): {
  label: string;
  isLive: boolean;
} {
  const h = time.getHours();

  if (h >= 16 && h < 19) {
    return { label: "الحراج المباشر", isLive: true };
  } else if (h >= 19 && h < 22) {
    return { label: "السوق الفوري المباشر", isLive: true };
  } else {
    return { label: "السوق الصامت", isLive: true };
  }
}

interface LiveMarketPageContentProps {
  sessionId?: string;
}

export default function LiveMarketPageContent({ sessionId }: LiveMarketPageContentProps) {
  const [isAllowed, setIsAllowed] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoggedIn } = useAuth();
  const router = useLoadingRouter();

  const [marketCars, setMarketCars] = useState<any[]>([]);
  const [currentCar, setCurrentCar] = useState<any>(null);
  const [marketCarsCompleted, setMarketCarsCompleted] = useState<any[]>([]);
  const [showBid, setShowBid] = useState(false);
  const [bid, setBid] = useState("");
  const [status, setStatus] = useState("");
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { label: auctionType } = getCurrentAuctionType(currentTime);

  // Verify user is authenticated (لا تعديل على السلوك)
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login?returnUrl=/dashboard/profile");
    }
  }, [isLoggedIn, router]);

  // جلب البيانات + Pusher (بدون تغيير على المنطق)
  useEffect(() => {
    async function fetchAuctions() {
      if (!isLoggedIn) return;
      try {
        setIsAllowed(true);

        let response;
        if (sessionId) {
          response = await api.get(`/api/sessions/live/${sessionId}`);
          if (response.data.data) {
            const carsData = response.data.data;
            let current_car = carsData.current_live_car;
            let liveAuctions = carsData.pending_live_auctions;
            let completedAuctions = carsData.completed_live_auctions;

            if (current_car && current_car.car) {
              let car_user_id = current_car.car.user_id;
              let current_user_id = user.id;
              let dealer_user_id = current_car.car.dealer ? current_car.car.dealer.user_id : null;

              setIsOwner(current_user_id == car_user_id || dealer_user_id == current_user_id);
            }

            setMarketCars(liveAuctions || []);
            setCurrentCar(current_car || null);
            setMarketCarsCompleted(completedAuctions || []);
          }
        } else {
          response = await api.get("/api/approved-live-auctions");
          if (response.data.data) {
            const carsData = response.data.data.data || response.data.data;
            let current_car = carsData.current_live_car;
            let liveAuctions = carsData.pending_live_auctions;
            let completedAuctions = carsData.completed_live_auctions;

            if (current_car && current_car.car) {
              let car_user_id = current_car.car.user_id;
              let current_user_id = user.id;
              let dealer_user_id = current_car.car.dealer ? current_car.car.dealer.user_id : null;

              setIsOwner(current_user_id == car_user_id || dealer_user_id == current_user_id);
            }

            setMarketCars(liveAuctions || []);
            setCurrentCar(current_car || null);
            setMarketCarsCompleted(completedAuctions || []);
          }
        }
      } catch (error) {
        console.error("Failed to load auction data", error);
        setMarketCars([]);
        setCurrentCar(null);
        setMarketCarsCompleted([]);
        setError("Could not connect to the server. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchAuctions();

    // Setup Pusher listener
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
    });

    const channelName = sessionId ? `session.${sessionId}` : 'auction.live';
    const channel = pusher.subscribe(channelName);

    channel.bind('UpdateSessionEvent', () => {
      fetchAuctions();
    });
    channel.bind('CarMovedBetweenAuctionsEvent', () => {
      fetchAuctions();
    });

    channel.bind('CarApprovedForLiveEvent', (data: any) => {
      fetchAuctions();
      if (data.approved_for_live) {
        toast.success(`تمت الموافقة على ${data.car_make} ${data.car_model} للمزاد المباشر!`);
      } else {
        toast.custom(
          <div
            style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#ffffcc' }}
            className="text-black flex items-center gap-2"
          >
            <CircleAlert className="w-4 h-4" /> تم إيقاف المزاد المباشر على {data.car_make} {data.car_model}!
          </div>,
          { duration: 5000 }
        );
      }
    });

    channel.bind('AuctionStatusChangedEvent', (data: any) => {
      fetchAuctions();
      const statusLabels: Record<string, string> = {
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

    channel.bind('LiveMarketBidEvent', (data: any) => {
      if (user && data.bidder_id !== user.id) {
        toast.success(`مزايدة جديدة: ${data.car_make} ${data.car_model} - ${data.bid_amount.toLocaleString()} ريال`, {
          duration: 5000,
          position: 'top-right',
        });
        fetchAuctions();
      }
    });

    return () => {
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [isLoggedIn, sessionId, user]);

  const submitBid = async () => {
    try {
      const res = await fetch("/api/submit-bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: currentCar.id,
          bid_amount: parseFloat(bid),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("✅ تمت المزايدة بنجاح");
        setBid("");
        setShowBid(false);
      } else {
        setStatus(`❌ خطأ: ${data.error}`);
      }
    } catch (err) {
      setStatus("❌ فشل الاتصال بالخادم");
    }
  };

  const handleSearch = async () => {
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
        setStatus("✅ تم البحث بنجاح");
      } else {
        setStatus(`❌ خطأ: ${data.error}`);
      }
    } catch (err) {
      setStatus("❌ فشل الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 px-4 py-6">
      <div className="max-w-7xl mx-auto">
        {/* الشريط العلوي: إشعارات + رجوع */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <BidNotifications />
          </div>

          {!sessionId && (
            <LoadingLink
              href="/auctions/auctions-1main"
              className="
                inline-flex items-center gap-1.5
                px-3 py-1.5 rounded-full text-sm
                bg-slate-900/70 border border-slate-800
                hover:bg-slate-900/90 transition-colors
                text-slate-100
              "
            >
              <ChevronRight className="h-4 w-4 ml-1 rtl:rotate-180" />
              <span>العودة</span>
            </LoadingLink>
          )}
        </div>

        {/* رأس الصفحة */}
        <div className="
          grid grid-cols-12 items-center gap-4 mb-6
          bg-slate-900/60 border border-slate-800 rounded-2xl p-3
        ">
          {/* شريط المزاد */}
          <div className="col-span-12 md:col-span-4">
            <div className="
              rounded-xl px-3 py-2
              bg-slate-950/80 border border-slate-800
              flex items-center justify-between
            ">
              <div className="text-sm">
                <div className="text-slate-200 font-medium">{auctionType} - جارٍ الآن</div>
              </div>
              <div className="flex items-center gap-2 text-teal-300">
                <Clock className="h-4 w-4" />
                <div className="text-base font-mono font-semibold dir-ltr">
                  <BidTimer showLabel={false} showProgress={false} />
                </div>
              </div>
            </div>
          </div>

          {/* عنوان */}
          <div className="col-span-12 md:col-span-4 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
              {sessionId ? 'جلسة المزاد المباشر' : 'الحراج المباشر'}
            </h1>
            <div className="text-xs md:text-sm text-slate-400 mt-1">
              {sessionId ? 'أهلاً بك في جلسة المزاد' : 'وقت السوق من 4 عصراً إلى 7 مساءً كل يوم'}
            </div>
          </div>

          {/* فراغ للموازنة */}
          <div className="col-span-12 md:col-span-4" />
        </div>

        {/* حالة الإتاحة */}
        {!isAllowed && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 p-3 text-sm">
            السوق ليس مفتوح الآن — سيفتح حسب الوقت الموضح في الأعلى
          </div>
        )}

        {isAllowed && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
            {/* يسار: البث + الجداول + LiveBidding */}
            <div className="md:col-span-7 flex flex-col space-y-6">
              {/* البث */}
              <div className="relative w-full pb-[56.25%] rounded-2xl overflow-hidden border border-slate-800 bg-black">
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

                {/* شعار المعلق */}
                <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur rounded-full p-1.5 z-20 border border-slate-800">
                  <img
                    src="/grok auctioneer.jpg"
                    alt="معلق المزاد"
                    className="w-10 h-10 rounded-full object-cover border border-teal-600/60"
                  />
                </div>
              </div>
              <div className="text-center text-xs text-slate-400 italic">
                (بث مباشر من قاعة المزاد - الحراج المباشر)
              </div>

              {/* جدول السيارات الحالية */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <h2 className="text-lg font-bold mb-3 text-slate-100">
                  سيارات جلسة الحراج الحالية
                </h2>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-950/70 text-slate-300">
                      <tr className="border-b border-slate-800/60">
                        <th className="px-4 py-3 text-right font-medium">#</th>
                        <th className="px-4 py-3 text-right font-medium">الماركة</th>
                        <th className="px-4 py-3 text-right font-medium">الموديل</th>
                        <th className="px-4 py-3 text-right font-medium">السنة</th>
                        <th className="px-4 py-3 text-right font-medium">أقل سعر</th>
                        <th className="px-4 py-3 text-right font-medium">أعلى سعر</th>
                        <th className="px-4 py-3 text-right font-medium">آخر سعر</th>
                        <th className="px-4 py-3 text-right font-medium">مشاهدة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marketCars && marketCars.length > 0 ? (
                        marketCars.map((car: any, index: number) => (
                          <tr
                            key={car.id}
                            className={`border-b border-slate-800/40 hover:bg-slate-900/40 transition ${
                              currentCar?.id === car.id ? "bg-teal-950/40" : ""
                            }`}
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-slate-200">
                              {index + 1}
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap text-slate-200">
                              <div className="flex items-center">
                                {currentCar?.id === car.id ? (
                                  <Radio className="me-2 text-teal-400" size={16} />
                                ) : null}
                                {car.car.make}
                              </div>
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap text-slate-200">
                              {car.car.model}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-200">
                              {car.car.year}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-200">
                              {formatCurrency(car.min_price)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-200">
                              {formatCurrency(car.max_price)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap font-semibold text-teal-400">
                              {formatCurrency(car.current_bid)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <LoadingLink
                                target="_blank"
                                href={`/carDetails/${car.id}`}
                                className="text-teal-300 hover:text-teal-200 underline-offset-4 hover:underline"
                              >
                                عرض
                              </LoadingLink>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-4 py-4 text-center text-slate-400"
                          >
                            لا توجد سيارات متاحة حاليًا في الحراج المباشر
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* جدول السيارات المنتهية */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <h2 className="text-lg font-bold mb-3 text-slate-100">
                  سيارات جلسة الحراج الحالية المنتهية
                </h2>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-950/70 text-slate-300">
                      <tr className="border-b border-slate-800/60">
                        <th className="px-4 py-3 text-right font-medium">#</th>
                        <th className="px-4 py-3 text-right font-medium">الماركة</th>
                        <th className="px-4 py-3 text-right font-medium">الموديل</th>
                        <th className="px-4 py-3 text-right font-medium">السنة</th>
                        <th className="px-4 py-3 text-right font-medium">أقل سعر</th>
                        <th className="px-4 py-3 text-right font-medium">أعلى سعر</th>
                        <th className="px-4 py-3 text-right font-medium">آخر سعر</th>
                        <th className="px-4 py-3 text-right font-medium">مشاهدة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marketCarsCompleted && marketCarsCompleted.length > 0 ? (
                        marketCarsCompleted.map((car: any, index: number) => (
                          <tr key={car.id} className="border-b border-slate-800/40 hover:bg-slate-900/40 transition">
                            <td className="px-4 py-3 whitespace-nowrap text-slate-200">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-200">
                              {car.car.make}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-200">
                              {car.car.model}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-200">
                              {car.car.year}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-200">
                              {formatCurrency(car.min_price)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-200">
                              {formatCurrency(car.max_price)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap font-semibold text-teal-400">
                              {formatCurrency(car.current_bid)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <LoadingLink
                                target="_blank"
                                href="#"
                                className="text-teal-300 hover:text-teal-200 underline-offset-4 hover:underline"
                              >
                                عرض
                              </LoadingLink>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-4 py-4 text-center text-slate-400"
                          >
                            لا توجد سيارات مكتملة في الحراج المباشر
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* المزايدة المباشرة */}
              {currentCar && <LiveBidding data={currentCar} />}
            </div>

            {/* يمين: معلومات السيارة + بحث اللوحة */}
            <div className="md:col-span-5 flex flex-col space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <h2 className="text-lg font-bold mb-3 text-center text-slate-100 border-b border-slate-800 pb-2">
                  السيارة الحالية في الحراج
                </h2>

                {currentCar && currentCar.car ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div><span className="text-slate-300">الماركة:</span> <span className="font-medium">{currentCar.car.make}</span></div>
                      <div><span className="text-slate-300">الموديل:</span> <span className="font-medium">{currentCar.car.model}</span></div>
                      <div><span className="text-slate-300">السنة:</span> <span className="font-medium">{currentCar.car.year}</span></div>
                      <div><span className="text-slate-300">العداد:</span> <span className="font-medium">{currentCar.car.odometer} كم</span></div>
                      <div><span className="text-slate-300">الحالة:</span> <span className="font-medium">{currentCar.car.condition}</span></div>
                      <div><span className="text-slate-300">رقم الشاصي:</span> <span className="font-medium">{currentCar.car.vin}</span></div>
                    </div>

                    {/* مشاهدون/مزايدون + آخر سعر + تقديم عرض */}
                    <div className="mt-3 border border-slate-800 rounded-xl bg-slate-950/60 p-3">
                      <div className="text-center text-slate-400 mb-2 text-xs">
                        <span>مشاهدون: {currentCar.viewers || "0"} | </span>
                        <span>مزايدون: {currentCar.bids?.length || "0"} (تقريباً)</span>
                      </div>

                      <div className="text-center mb-3">
                        <h3 className="font-semibold text-sm text-slate-300">آخر سعر</h3>
                        <div className="text-2xl font-bold text-teal-400 my-2 py-2 rounded-lg border-2 border-teal-700/30 bg-slate-900">
                          {formatCurrency(
                            currentCar.current_bid == 0
                              ? currentCar.opening_price
                              : currentCar.current_bid || 0
                          )}
                        </div>
                      </div>

                      {!showBid ? (
                        <button
                          hidden={isOwner}
                          onClick={() => setShowBid(!isOwner)}
                          className="
                            w-full py-2 rounded-lg font-bold text-lg
                            bg-gradient-to-r from-teal-600 to-teal-700 text-white
                            hover:from-teal-500 hover:to-teal-600
                            border border-teal-700/50 shadow-lg
                            transition-transform duration-200 hover:scale-[1.02]
                          "
                        >
                          قدم عرضك
                        </button>
                      ) : (
                        <div>
                          <BidForm
                            auction_id={parseInt(currentCar.id)}
                            bid_amount={parseInt(
                              (currentCar.current_bid == 0
                                ? currentCar.opening_price
                                : currentCar.current_bid || 0
                              )
                                .toString()
                                .replace(/,/g, "")
                            )}
                            onSuccess={() => {
                              setShowBid(false);
                              setStatus("✅ تمت المزايدة بنجاح");
                            }}
                          />
                          {status && (
                            <p className="text-center text-xs mt-2 text-slate-300">{status}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-slate-400">لا توجد سيارة معروضة حاليًا في الحراج المباشر</p>
                  </div>
                )}

                {/* بحث برقم اللوحة */}
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={plate}
                        onChange={(e) => setPlate(e.target.value)}
                        placeholder="أدخل رقم اللوحة مثل XYZ987"
                        className="
                          p-2 text-xs rounded-lg w-full
                          bg-slate-950/70 border border-slate-800
                          placeholder:text-slate-500 text-slate-100
                          focus:ring-2 focus:ring-teal-400/40 focus:border-teal-500
                        "
                      />
                      <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="
                          absolute left-0 top-0 h-full px-3 rounded-l-lg text-xs
                          bg-teal-600 hover:bg-teal-700 text-white
                          disabled:opacity-60
                        "
                      >
                        {loading ? "جارٍ..." : "بحث"}
                      </button>
                    </div>
                    <h3 className="text-xs font-semibold text-slate-300 whitespace-nowrap">
                      ابحث برقم اللوحة
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* خطأ عام إن وجد */}
        {error && (
          <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 p-3 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

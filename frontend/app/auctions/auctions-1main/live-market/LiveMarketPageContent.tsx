/**
 * 📝 الصفحة: الحراج المباشر (Live Market)
 * 📁 المسار: Frontend/app/auctions/auctions-1main/live-market/page.tsx
 *
 * ✅ الوظيفة:
 * - تعرض البث المباشر للمزاد التفاعلي
 * - تسحب السيارات من قاعدة البيانات: items حيث type = 'live'
 * - تُظهر السيارة الحالية، معلوماتها، وعدد المزايدات والسعر الحالي
 * - تتيح تقديم مزايدة مباشرة من الصفحة
 */

"use client";

import React, { useEffect, useState } from "react";
import LoadingLink from "@/components/LoadingLink";
import {
  ChevronRight,
  Clock,
  BellOff,
  Timer,
  Video,
  Radio,
  XCircle,
  CircleAlert,
} from "lucide-react";
import PlateSearch from "./component/PlateSearch";
import BidTimer from "@/components/BidTimer";
import BidForm from "@/components/BidForm";
import LiveBidding from "@/components/LiveBidding";
import BidNotifications from "@/components/BidNotifications";
import { formatCurrency } from "@/utils/formatCurrency";
// استيراد المكونات الجديدة
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

// دالة للحصول على نوع المزاد الحالي
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
    return { label: "السوق المتأخر", isLive: true };
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
  
  const [marketCars, setMarketCars] = useState([]);
  const [currentCar, setCurrentCar] = useState(null);
  const [marketCarsCompleted, setMarketCarsCompleted] = useState([]);
  const [showBid, setShowBid] = useState(false);
  const [bid, setBid] = useState("");
  const [status, setStatus] = useState("");
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { label: auctionType } = getCurrentAuctionType(currentTime);

  // تحديث الوقت كل ثانية
  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setCurrentTime(new Date());
  //   }, 1000);

  //   return () => clearInterval(timer);
  // }, []);

  // Removed client-side authentication redirect - now handled by middleware
  // Public page: authentication only required for bidding actions

  // تحديث الوقت كل ثانية
  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setCurrentTime(new Date());
  //   }, 1000);

  //   return () => clearInterval(timer);
  // }, []);

  // Fetch auction data - Public page, guests can view
  useEffect(() => {
    async function fetchAuctions() {
      // Public page - authentication only required for bidding actions
      try {
        setIsAllowed(true); // Live sessions are publicly viewable
        
        let response;
        if (sessionId) {
          response = await api.get(`/api/sessions/live/${sessionId}`);
          console.log('response',response);
          
          if (response.data.data) {

            const carsData = response.data.data;
            console.log('cars data',carsData);
              let current_car = carsData.current_live_car;
              let liveAuctions = carsData.pending_live_auctions;
              let completedAuctions = carsData.completed_live_auctions;
              
              if (current_car && current_car.car) {
                let car_user_id = current_car.car.user_id;
                let current_user_id = user?.id || null;
                let dealer_user_id = current_car.car.dealer ? current_car.car.dealer.user_id : null;
                
                if ((current_user_id) && (current_user_id == car_user_id || dealer_user_id == current_user_id)) {
                  setIsOwner(true);
                } else {
                  setIsOwner(false);
                }
              }
              
              setMarketCars(liveAuctions);
              setCurrentCar(current_car);
              setMarketCarsCompleted(completedAuctions);
            
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
                let current_user_id = user?.id || null;
                let dealer_user_id = current_car.car.dealer ? current_car.car.dealer.user_id : null;
              
              if (current_user_id && (current_user_id == car_user_id || dealer_user_id == current_user_id)) {
                setIsOwner(true);
              } else {
                setIsOwner(false);
              }
            }
            
            setMarketCars(liveAuctions);
            setCurrentCar(current_car);
            setMarketCarsCompleted(completedAuctions);
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

    // Setup Pusher listener for real-time auction updates
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
    });

    const channelName = sessionId ? `session.${sessionId}` : 'auction.live';
    const channel = pusher.subscribe(channelName);

    channel.bind('UpdateSessionEvent', (data: any) => {
      console.log('Session updated:', data);
      // Refresh auction data when session is updated
      fetchAuctions();
    });
    channel.bind('CarMovedBetweenAuctionsEvent', (data: any) => {
      console.log('Car moved to auction:', data);
      // Refresh auction data when cars are moved
      fetchAuctions();
      //toast.success(`تم تحديث قائمة السيارات - تم نقل ${data.car_make} ${data.car_model} إلى المزاد`);
    });

    // Listen for cars approved for live auction
    channel.bind('CarApprovedForLiveEvent', (data: any) => {
      console.log('Car approved for live auction:', data);
      // Refresh auction data when cars are approved for live
      fetchAuctions();
      if (data.approved_for_live) {
        toast.success(`تمت الموافقة على ${data.car_make} ${data.car_model} للمزاد المباشر!`);
      }else{
        toast.custom(<div style={{padding: '16px', borderRadius: '8px',backgroundColor: '#ffffcc'}} className="text-black flex items-center gap-2"> <CircleAlert className="w-4 h-4" /> تم إيقاف المزاد المباشر على {data.car_make} {data.car_model}!</div>,{
          duration: 5000,
         
        });
      }
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

    // Listen for live market bid events (excludes the bidder)
    channel.bind('LiveMarketBidEvent', (data: any) => {
      // Only show notification if the current user is not the bidder
      if (user && data.bidder_id !== user.id) {
        toast.success(`مزايدة جديدة: ${data.car_make} ${data.car_model} - ${data.bid_amount.toLocaleString()} ريال`, {
          duration: 5000,
          position: 'top-right',
        });
        // Refresh auction data to show updated bid
        fetchAuctions();
      }
    });

    // Note: Only listening on auction.live channel to avoid duplicate notifications

    // Cleanup function
    return () => {
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [sessionId, user]); // Removed isLoggedIn - page is now publicly accessible

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
  console.log(marketCars);
  return (
    <div className="min-h-screen bg-background p-4 py-6">
      <div className="max-w-7xl mx-auto">
        {/* زر العودة منفرد في الجهة اليمنى */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <BidNotifications />
          </div>
          {!sessionId && (
            <LoadingLink
              href="/auctions/auctions-1main"
              className="inline-flex items-center text-primary hover:text-primary/80 transition-colors px-3 py-1 text-sm rounded-full border border-primary/20 hover:border-primary/30 bg-primary/10 hover:bg-primary/20"
            >
              <ChevronRight className="h-4 w-4 ml-1 rtl:rotate-180" />
              <span>العودة</span>
            </LoadingLink>
          )}
        </div>

        {/* Page Header */}
        <div className="grid grid-cols-12 items-center mb-6 gap-4">
          {/* شريط المزاد في اليسار */}
          <div className="col-span-3 flex justify-start">
            <div className="bg-card border-r-4 border-secondary rounded-lg shadow-sm px-3 py-1.5 flex items-center justify-between">
              <div className="text-sm font-medium text-foreground ml-2">
                <div>{auctionType} - جارٍ الآن</div>
              </div>
              <div className="flex items-center gap-2 mr-2">
                <Clock className="text-secondary h-4 w-4" />
                <div className="text-base font-mono font-semibold text-secondary">
                  <BidTimer showLabel={false} showProgress={false} />
                </div>
              </div>
            </div>
          </div>

          {/* عنوان الصفحة في الوسط */}
          <div className="col-span-6 text-center">
            <h1 className="text-3xl font-bold text-primary">
              {sessionId ? 'جلسة المزاد المباشر' : 'الحراج المباشر'}
            </h1>
            <div className="text-sm text-primary/80 mt-1">
              {sessionId ? 'أهلاً بك في جلسة المزاد' : 'وقت السوق من 4 عصراً إلى 7 مساءً كل يوم'}
            </div>
          </div>

          {/* مساحة فارغة للتوازن */}
          <div className="col-span-3"></div>
        </div>

        {/* إعادة تصميم التخطيط الرئيسي - تغيير إلى صفين بدلاً من ثلاثة أعمدة */}
        {!isAllowed && (
          <div>
            <p> السوق ليس مفتوح الان سوف يفتح كما موضح في الوقت الأعلى</p>
          </div>
        )}
        {isAllowed && (
          <>
            {/* <Countdown page="live_auction"/>*/}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
              {/* القسم الأيسر - البث المباشر (مصغر) */}
              <div className="md:col-span-7 flex flex-col space-y-6">
                {/* مربع البث المباشر - استخدام مكون LiveYouTubeEmbed مع رابط RTMP بدلاً من ملحق يوتيوب */}
                <div className="relative w-full pb-[56.25%] bg-black rounded-lg overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full">
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
                  <div className="absolute top-4 right-4 bg-card bg-opacity-80 rounded-full p-1.5 z-20">
                    <img
                      src="/grok auctioneer.jpg"
                      alt="معلق المزاد"
                      className="w-10 h-10 rounded-full object-cover border-2 border-secondary"
                    />
                  </div>
                </div>
                <div className="text-center text-xs text-foreground/50 italic">
                  (بث مباشر من قاعة المزاد - الحراج المباشر)
                </div>

                {/* جدول السيارات في جلسة الحراج الحالية */}
                <div className="bg-card rounded-xl shadow-md p-4">
                  <h2 className="text-lg font-bold mb-3 text-primary">
                    سيارات جلسة الحراج الحالية
                  </h2>

                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-border divide-y divide-border">
                      <thead className="bg-background/50">
                        <tr>
                          <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">
                            #
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">
                            الماركة
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">
                            الموديل
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">
                            السنة
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">
                            أقل سعر
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">
                            أعلى سعر
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">
                            آخر سعر
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">
                            مشاهدة
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {marketCars && marketCars.length > 0 ? (
                          marketCars.map((car: any, index: number) => (
                            <tr
                              key={car.id}
                              className={`hover:bg-background ${
                                currentCar?.id === car.id ? "bg-primary/10" : ""
                              }`}
                            >
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                                {index + 1}
                              </td>

                              <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                                <div className="flex items-center">
                                  {currentCar?.id === car.id ? (
                                    <Radio
                                      color="red"
                                      className="me-2"
                                      size={16}
                                    />
                                  ) : (
                                   ""
                                  )}

                                  {car.car.make}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                                {car.car.model}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                                {car.car.year}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                                {formatCurrency(car.min_price)}{" "}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                                {formatCurrency(car.max_price)}{" "}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-primary">
                                {formatCurrency(car.current_bid)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-primary">
                                <LoadingLink
                                  target="_blank"
                                  href={`/carDetails/${car.car_id}`}
                                  className="hover:underline"
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
                              className="px-4 py-4 text-center text-sm text-foreground/50"
                            >
                              لا توجد سيارات متاحة حاليًا في الحراج المباشر
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* جدول السيارات في جلسة الحراج الحالية */}
                <div className="bg-card rounded-xl shadow-md p-4">
                  <h2 className="text-lg font-bold mb-3 text-primary">
                    {" "}
                    سيارات جلسة الحراج الحالية المنتهية
                  </h2>

                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-border divide-y divide-border">
                      <thead className="bg-background/50">
                        <tr>
                          <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">
                            #
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">
                            الماركة
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">
                            الموديل
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">
                            السنة
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">
                            أقل سعر
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">
                            أعلى سعر
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">
                            آخر سعر
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-foreground/70 uppercase tracking-wider">
                            مشاهدة
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {marketCarsCompleted &&
                        marketCarsCompleted.length > 0 ? (
                          marketCarsCompleted.map((car: any, index: number) => (
                            <tr key={car.id} className="hover:bg-background">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                                {index + 1}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                                {car.car.make}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                                {car.car.model}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                                {car.car.year}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                                {formatCurrency(car.min_price)}{" "}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                                {formatCurrency(car.max_price)}{" "}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-primary">
                                {formatCurrency(car.current_bid)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-primary">
                                <LoadingLink
                                  target="_blank"
                                  href="#"
                                  className="hover:underline"
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
                              className="px-4 py-4 text-center text-sm text-foreground/50"
                            >
                              لا توجد سيارات مكتملة في الحراج المباشر
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* إضافة مكون المزايدات المباشرة */}
                {currentCar && <LiveBidding data={currentCar} />}

                {/* إضافة مكون الدردشة بين المزايدين
    <BidderChat
      auctionId={parseInt(currentCar?.id) || 1}
      onNewQuestion={(message) => console.log('سؤال جديد:', message)}
    />
    */}
              </div>

              {/* القسم الأيمن - نبض المزاد والسيارة الحالية */}
              <div className="md:col-span-5 flex flex-col space-y-4">
                {/* مؤشر نبض المزاد المباشر
    <div>
      <LiveAuctionPulse
        auctionId={parseInt(currentCar?.id) || 1}
        initialViewers={87}
        initialBidders={15}
        initialInterestLevel={75}
        priceChangeRate={2.8}
        className="w-full h-[130px]"
      />
    </div>
    */}
                {/* معلومات السيارة */}
                <div className="bg-card p-4 rounded-xl shadow-md">
                  <h2 className="text-lg font-bold mb-3 border-b pb-2 text-center text-primary">
                    السيارة الحالية في الحراج
                  </h2>
                  {currentCar && currentCar.car ? (
                    <div>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <div>
                            <span className="font-semibold">الماركة:</span>{" "}
                            {currentCar.car.make}
                          </div>
                          <div>
                            <span className="font-semibold">الموديل:</span>{" "}
                            {currentCar.car.model}
                          </div>
                          <div>
                            <span className="font-semibold">السنة:</span>{" "}
                            {currentCar.car.year}
                          </div>
                          <div>
                            <span className="font-semibold">العداد:</span>{" "}
                            {currentCar.car.odometer} كم
                          </div>
                          <div>
                            <span className="font-semibold">الحالة:</span>{" "}
                            {currentCar.car.condition}
                          </div>
                          <div>
                            <span className="font-semibold">رقم الشاصي:</span>{" "}
                            {currentCar.car.vin}
                          </div>
                        </div>

                        {/* قسم تفاصيل المشاهدين والسعر وتقديم العرض - معاد تنسيقه */}
                        <div className="mt-3 border rounded-lg bg-background p-3">
                          {/* معلومات المشاهدين والمزايدين */}
                          <div className="text-center text-foreground/70 mb-2 text-xs">
                            <span>مشاهدون: {currentCar.viewers || "0"} | </span>
                            <span>
                              مزايدون: {currentCar.bids?.length || "0"}{" "}
                              (تقريباً)
                            </span>
                          </div>

                          {/* آخر سعر */}
                          <div className="text-center mb-3">
                            <h3 className="font-semibold text-base text-primary">
                              آخر سعر
                            </h3>
                            <div className="text-2xl font-bold text-secondary my-2 py-2 rounded-lg border-2 border-border bg-card">
                              {formatCurrency(
                                currentCar.current_bid == 0
                                  ? currentCar.opening_price
                                  : currentCar.current_bid || 0
                              )}
                            </div>
                          </div>

                          {/* زر تقديم العرض */}
                          {!showBid ? (
                            <button
                              hidden={isOwner}
                              onClick={() => setShowBid(!isOwner)}
                              className="w-full bg-secondary text-white py-2 rounded-lg hover:bg-secondary/90 font-bold text-xl border-2 border-secondary/80 shadow-lg transform hover:scale-105 transition-all duration-200 animate-pulse"
                              style={{ animation: "pulse 2.5s infinite" }}
                            >
                              <span className="flex items-center justify-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 mr-1.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                  />
                                </svg>
                                قدم عرضك
                              </span>
                            </button>
                          ) : (
                            <div>
                              <BidForm
                                auction_id={parseInt(currentCar.id)}
                                auction_type={'live'}
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
                                <p className="text-center text-sm mt-2">
                                  {status}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-foreground/50">
                        لا توجد سيارة معروضة حاليًا في الحراج المباشر
                      </p>
                    </div>
                  )}

                  {/* إضافة خانة البحث داخل مربع معلومات السيارة */}
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={plate}
                          onChange={(e) => setPlate(e.target.value)}
                          placeholder="أدخل رقم اللوحة مثل XYZ987"
                          className="p-1.5 text-xs border border-border rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary bg-background"
                        />
                        <button
                          onClick={handleSearch}
                          disabled={loading}
                          className="absolute left-0 top-0 h-full bg-primary text-white px-2 rounded-l-lg hover:bg-primary/90 whitespace-nowrap text-xs"
                        >
                          {loading ? "جارٍ..." : "بحث"}
                        </button>
                      </div>
                      <h3 className="text-xs font-semibold text-primary whitespace-nowrap">
                        ابحث برقم اللوحة
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

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

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Clock, BellOff, Timer, Video } from 'lucide-react';
import PlateSearch from './component/PlateSearch';
import BidTimer from '@/components/BidTimer';
import BidForm from '@/components/BidForm';
import LiveBidding from '@/components/LiveBidding';
import BidNotifications from '@/components/BidNotifications';
import { formatCurrency } from "@/utils/formatCurrency";
// استيراد المكونات الجديدة
import BidderChat from '@/components/social/BidderChat';
import LiveAuctionPulse from '@/components/social/LiveAuctionPulse';
import LiveYouTubeEmbed from '@/components/LiveYouTubeEmbed';

import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import Countdown from '@/components/Countdown';

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
    return { label: 'السوق الصامت', isLive: true };
  }
}

export default function LiveMarketPage() {
    const [isAllowed,setIsAllowed]=useState(true);
  const [isOwner,setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoggedIn } = useAuth();
  const router = useLoadingRouter();
  
  const [marketCars, setMarketCars] = useState([]);
  const [currentCar, setCurrentCar] = useState([]);
  const [marketCarsCompleted, setMarketCarsCompleted] = useState([]);
  const [showBid, setShowBid] = useState(false);
  const [bid, setBid] = useState('');
  const [status, setStatus] = useState('');
  const [plate, setPlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { label: auctionType } = getCurrentAuctionType(currentTime);

  // تحديث الوقت كل ثانية
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

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


            
setIsAllowed(await isWithinAllowedTime('live_auction'));
setIsAllowed(true);
              const response = await api.get('/api/approved-auctions');
              if (response.data.data || response.data.data) {
                  const carsData = response.data.data.data || response.data.data;
                   // تحويل البيانات إلى هيكل JSON
                   let liveAuctions = carsData.filter(car => {
                    return car.status === 'live' && car.auction_type === 'live' && !car.approved_for_live;
                   });

                   let completedAuctions = carsData.filter(car => {
                    return car.status === 'completed' && car.auction_type === 'live' && !car.approved_for_live;
                   });
                    let current_car = carsData.filter(car => {
                    return car.status === 'live' && car.auction_type === 'live' && car.approved_for_live;
                   });
                   console.log(carsData);
                                     
                   if(current_car.length > 0){
                       let car_user_id = current_car[0].car.user_id;
                       let current_user_id = user.id;
                       let dealer_user_id = current_car[0].car.dealer;
                      if(current_car[0].car.dealer !=null){
                        dealer_user_id = current_car[0].car.dealer.user_id;
                      }
                     
                  
                      if(current_user_id == car_user_id ){
                        setIsOwner(true);
                      }else if(dealer_user_id == current_user_id){
                        setIsOwner(true);
                      }else{
                        setIsOwner(false);
                      }
                   }
                 
                    // تعامل مع هيكل البيانات من API
                  setMarketCars(liveAuctions);
                  setCurrentCar(current_car);
                  setMarketCarsCompleted(completedAuctions);
                                     
       
              } else {
                  setMarketCars([]);
                  setCurrentCar([]);
                  setMarketCarsCompleted([]);
                  setError("تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى لاحقاً.");
                  setLoading(false);
              }
                  
          } catch (error) {
               console.error('فشل تحميل بيانات المزاد الصامت', error);
                 setMarketCars([]);
                  setCurrentCar([]);
                  setMarketCarsCompleted([]);
                  setError("تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى لاحقاً.");
                  setLoading(false);
          } finally {
              setLoading(false);
          }
      }
      fetchAuctions();
  }, []);

  const submitBid = async () => {
    try {
      const res = await fetch('/api/submit-bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: currentCar.id,
          bid_amount: parseFloat(bid),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('✅ تمت المزايدة بنجاح');
           setBid('');
        setShowBid(false);
      } else {
        setStatus(`❌ خطأ: ${data.error}`);
      }
    } catch (err) {
      setStatus('❌ فشل الاتصال بالخادم');
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/search-car', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate }),
      });

      const data = await res.json();
      if (res.ok) {
        setCurrentCar(data);
        setStatus('✅ تم البحث بنجاح');
      } else {
        setStatus(`❌ خطأ: ${data.error}`);
      }
    } catch (err) {
      setStatus('❌ فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 py-6">
      <div className="max-w-7xl mx-auto">
        {/* زر العودة منفرد في الجهة اليمنى */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <BidNotifications />
          </div>
          <Link 
            href="/auctions/auctions-1main" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors px-3 py-1 text-sm rounded-full border border-blue-200 	        hover:border-blue-300 bg-blue-50 hover:bg-blue-100"
          >
            <ChevronRight className="h-4 w-4 ml-1 rtl:rotate-180" />
            <span>العودة</span>
          </Link>
        </div>
        
        {/* رأس الصفحة: السوق الصامت - الحراج المباشر - وقت السوق */}
        <div className="grid grid-cols-12 items-center mb-6 gap-4">
          {/* شريط المزاد في اليسار */}
          <div className="col-span-3 flex justify-start">
            <div className="bg-white border-r-4 border-teal-500 rounded-lg shadow-sm px-3 py-1.5 flex items-center justify-between">
              <div className="text-sm font-medium text-gray-800 ml-2">
                <div>{auctionType} - جارٍ الآن</div>
              </div>
              <div className="flex items-center gap-2 mr-2">
                <Clock className="text-teal-500 h-4 w-4" />
                <div className="text-base font-mono font-semibold text-teal-800 dir-ltr">
                  <BidTimer showLabel={false} showProgress={false} />
                </div>
              </div>
            </div>
          </div>
          
          {/* عنوان الصفحة في الوسط */}
          <div className="col-span-6 text-center">
            <h1 className="text-3xl font-bold text-teal-700">الحراج المباشر</h1>
            <div className="text-sm text-teal-600 mt-1">وقت السوق من 4 عصراً إلى 7 مساءً كل يوم</div>
          </div>
          
          {/* مساحة فارغة للتوازن */}
          <div className="col-span-3"></div>
        </div>
        
       
        {/* إعادة تصميم التخطيط الرئيسي - تغيير إلى صفين بدلاً من ثلاثة أعمدة */}
             {!isAllowed &&(
        <div><p>  السوق ليس مفتوح الان سوف يفتح كما موضح في الوقت الأعلى</p></div>
      )}
         {isAllowed &&(
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
                    posterImage="/showroom.jpg" />
                </div>
                {/* شعار المعلق */}
                <div className="absolute top-4 right-4 bg-white bg-opacity-80 rounded-full p-1.5 z-20">
                  <img
                    src="/grok auctioneer.jpg"
                    alt="معلق المزاد"
                    className="w-10 h-10 rounded-full object-cover border-2 border-teal-600" />
                </div>
              </div>
              <div className="text-center text-xs text-gray-500 italic">
                (بث مباشر من قاعة المزاد - الحراج المباشر)
              </div>

              {/* جدول السيارات في جلسة الحراج الحالية */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <h2 className="text-lg font-bold mb-3 text-teal-800">سيارات جلسة الحراج الحالية</h2>

                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الماركة</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الموديل</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السنة</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">أقل سعر</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">أعلى سعر</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">آخر سعر</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مشاهدة</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">

                      {marketCars && marketCars.length > 0 ? (
                        marketCars.map((car: any, index: number) => (
                          <tr key={car.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{car.car.make}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{car.car.model}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{car.car.year}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatCurrency (car.min_price)} </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatCurrency (car.max_price)} </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-teal-600">{formatCurrency (car.current_bid)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-teal-600">
                              <Link target='_blank' href={`/carDetails/${car.id}`} className="hover:underline">عرض</Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-4 py-4 text-center text-sm text-gray-500">
                            لا توجد سيارات متاحة حاليًا في الحراج المباشر
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>


              {/* جدول السيارات في جلسة الحراج الحالية */}
              <div className="bg-white rounded-xl shadow-md p-4">
                <h2 className="text-lg font-bold mb-3 text-teal-800"> سيارات جلسة الحراج الحالية المنتهية</h2>

                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الماركة</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الموديل</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السنة</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">أقل سعر</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">أعلى سعر</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">آخر سعر</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مشاهدة</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">

                      {marketCarsCompleted && marketCarsCompleted.length > 0 ? (
                        marketCarsCompleted.map((car: any, index: number) => (
                          <tr key={car.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{car.car.make}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{car.car.model}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{car.car.year}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatCurrency (car.min_price)} </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatCurrency (car.max_price)} </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-teal-600">{formatCurrency (car.current_bid)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-teal-600">
                              <Link target='_blank' href="#" className="hover:underline">عرض</Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-4 py-4 text-center text-sm text-gray-500">
                            لا توجد سيارات مكتملة في الحراج المباشر
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* إضافة مكون المزايدات المباشرة */}
              {currentCar.length > 0 && (
                <LiveBidding data={currentCar[0] || []} />
              )}

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
              <div className="bg-white p-4 rounded-xl shadow-md">
                <h2 className="text-lg font-bold mb-3 border-b pb-2 text-center text-teal-800">السيارة الحالية في الحراج</h2>
                {currentCar.length > 0 ? (
                  currentCar.map((car: any, index: number) => (

                    <div key={index}>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          {}
                          <div><span className="font-semibold">الماركة:</span> {car.car.make}</div>
                          <div><span className="font-semibold">الموديل:</span> {car.car.model}</div>
                          <div><span className="font-semibold">السنة:</span> {car.car.year}</div>
                          <div><span className="font-semibold">العداد:</span> {car.car.odometer} كم</div>
                          <div><span className="font-semibold">الحالة:</span> {car.car.condition}</div>
                          <div><span className="font-semibold">رقم الشاصي:</span> {car.car.vin}</div>
                        </div>

                        {/* قسم تفاصيل المشاهدين والسعر وتقديم العرض - معاد تنسيقه */}
                        <div className="mt-3 border rounded-lg bg-gray-50 p-3">
                          {/* معلومات المشاهدين والمزايدين */}
                          <div className="text-center text-gray-600 mb-2 text-xs">
                            <span>مشاهدون: {currentCar.viewers || "0"} | </span>
                            <span>مزايدون: {car.bids.length || "0"} (تقريباً)</span>
                          </div>

                          {/* آخر سعر */}
                          <div className="text-center mb-3">
                            <h3 className="font-semibold text-base text-teal-800">آخر سعر</h3>
                            <div className="text-2xl font-bold text-teal-600 my-2 py-2 rounded-lg border-2 border-teal-200 bg-white">
                              {formatCurrency (car.current_bid == 0 ?  car.opening_price :car.current_bid  || 0)}
                            </div>
                          </div>

                          {/* زر تقديم العرض */}
                          {!showBid ? (
                            <button
                              hidden={isOwner}
                              onClick={() => setShowBid(!isOwner)}
                              className="w-full bg-gradient-to-r from-teal-500 to-teal-700 text-white py-2 rounded-lg hover:from-teal-600 hover:to-teal-800 font-bold text-xl border-2 border-teal-700 shadow-lg transform hover:scale-105 transition-all duration-200 animate-pulse"
                              style={{ animation: 'pulse 2.5s infinite' }}
                            >
                              <span className="flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                قدم عرضك
                              </span>
                            </button>
                          ) : (
                            <div>
                              <BidForm
                                auction_id={parseInt(car.id)}
                                bid_amount={parseInt((car.current_bid == 0 ?  car.opening_price :car.current_bid  || 0).toString().replace(/,/g, ''))}
                                user_id={car.user_id}
                                onSuccess={() => {
                                  setShowBid(false);
                                  setStatus('✅ تمت المزايدة بنجاح');
                                } } />
                              {status && <p className="text-center text-sm mt-2">{status}</p>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500">لا توجد سيارة معروضة حاليًا في الحراج المباشر</p>
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
                        className="p-1.5 text-xs border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-teal-300 focus:border-teal-500" />
                      <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="absolute left-0 top-0 h-full bg-teal-600 text-white px-2 rounded-l-lg hover:bg-teal-700 whitespace-nowrap text-xs"
                      >
                        {loading ? 'جارٍ...' : 'بحث'}
                      </button>
                    </div>
                    <h3 className="text-xs font-semibold text-teal-800 whitespace-nowrap">ابحث برقم اللوحة</h3>
                  </div>
                </div>
              </div>
            </div>
          </div></>
        )}
      </div>
    </div>
  );
}
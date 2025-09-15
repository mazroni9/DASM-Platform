'use client';

// ✅ صفحة عرض السوق الصامت مع رابط للتفاصيل السيارة
// المسار: /pages/silent/page.tsx

import React, { useEffect, useState, Fragment } from 'react';
import LoadingLink from "@/components/LoadingLink";
import { ChevronRight, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import BidTimer from '@/components/BidTimer';
import PriceInfoDashboard from '@/components/PriceInfoDashboard';
import { formatCurrency } from "@/utils/formatCurrency";
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/axios';
import { useLoadingRouter } from "@/hooks/useLoadingRouter";
import Countdown from '@/components/Countdown';
import Pusher from 'pusher-js';
import toast from 'react-hot-toast';
import Pagination from "@/components/Pagination";


async function isWithinAllowedTime(page: string): Promise<boolean> {
    const response = await api.get(`api/check-time?page=${page}`);
    return response.data.allowed;
}

// لا نستطيع إستيراد sqlite3 أو أي مكتبات قاعدة بيانات أخرى في جانب العميل!
// حذف:
// import sqlite3 from 'sqlite3';
// import { open } from 'sqlite';

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
  const [isAllowed,setIsAllowed]=useState(true);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedRows, setExpandedRows] = useState<{[key: number]: boolean}>({});
          const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10; // or allow user to change it
  const { user, isLoggedIn } = useAuth();
  const router = useLoadingRouter();
  
  
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
         setIsAllowed(await isWithinAllowedTime('late_auction'));
         setIsAllowed(true);
                const response = await api.get(`/api/approved-auctions/silent_instant?page=${currentPage}&pageSize=${pageSize}`);
                if (response.data.data || response.data.data) {
                    const carsData =response.data.data.data || response.data.data;
                    setTotalCount(response.data.data.total);
                    setCars(carsData);
                }
                  
          } catch (error) {
               console.error('فشل تحميل بيانات المزاد المتأخر', error);
              setCars([]); // مصفوفة فارغة في حالة الفشل
              setError("تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى لاحقاً.");
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
  }, [currentPage]);
  

  // تبديل حالة التوسيع للصف
  const toggleRowExpansion = (id: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="p-4">
      {/* زر العودة في أعلى يمين الصفحة */}
      <div className="flex justify-end mb-4">
        <LoadingLink 
          href="/auctions/auctions-1main" 
          className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors px-3 py-1 text-sm rounded-full border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100"
        >
          <ChevronRight className="h-4 w-4 ml-1 rtl:rotate-180" />
          <span>العودة</span>
        </LoadingLink>
      </div>

      <div className="grid grid-cols-12 items-center mb-6 gap-4">
        {/* شريط المزاد في اليسار */}
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
        
        {/* عنوان الصفحة في الوسط */}
        <div className="col-span-6 text-center relative">
          {/* إضافة صورة خلفية */}
          
          <h1 className="text-2xl font-bold relative z-10">السوق المتأخر</h1>
          <div className="text-sm text-purple-600 mt-1 relative z-10">وقت السوق من 10 مساءً إلى 4 عصراً اليوم التالي</div>
          <p className="text-gray-600 mt-1 text-sm relative z-10">مكمل للسوق الفوري المباشر في تركيبته ويختلف أنه ليس به بث مباشر وصاحب العرض يستطيع أن يغير سعر بالسالب أو الموجب بحد لا يتجاوز 10% من سعر إغلاق الفوري</p>
        </div>
        

      </div>
      
      {/* عرض الحالة */}
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
      {!isAllowed &&(
        <div><p>  السوق ليس مفتوح الان سوف يفتح كما موضح في الوقت الأعلى</p></div>
      )}
      {!loading && !error && cars.length > 0 && isAllowed && (
                              <>
                              {/* <Countdown page="late_auction"/>*/} 

                              <br />
                              <div className="bg-white p-4 rounded-lg shadow-sm">
          {/* عنوان قسم النتائج */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-lg font-bold text-gray-800">المزاد المتأخر - السيارات المتاحة</div>
            <div className="text-sm text-gray-600">عدد السيارات: {cars.length}</div>
          </div>

          {/* خط فاصل بين المزاد الفوري والصامت */}
          <div className="w-full border-b border-gray-300 my-4"></div>
          <p className="text-gray-600 mb-4">🕙 عند الساعة 10 مساءً يتم التحول من السوق الفوري المباشر إلى المزاد المتأخر. الأسعار أدناه هي أسعار المزاد المتأخر.</p>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase"></th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المدينة</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الماركة</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الموديل</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">سنة الصنع</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">سعر الإفتتاح</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">آخر سعر</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">التغير</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">تفاصيل</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cars.map((car, idx) => (

                  <Fragment key={idx}>
                    {car.auction_type != "live" && car["car"].auction_status == "in_auction" && (
                      <>
                        <tr className="hover:bg-gray-50 cursor-pointer">
                          <td className="px-2 whitespace-nowrap">
                            <button
                              onClick={() => toggleRowExpansion(idx)}
                              className="text-gray-500 hover:text-purple-600"
                            >
                              {expandedRows[idx] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </button>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{car['car'].city}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{car['car'].make}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{car['car'].model}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{car['car'].year}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatCurrency (car["minimum_bid"] || 0)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-purple-600">
                            {formatCurrency (car["current_bid"] || 0)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold `}>
                              {car['bids'][car['bids'].length - 1] ? formatCurrency (car['bids'][car['bids'].length - 1].increment) : 0} ({car['bids'][car['bids'].length - 1] ? ((car['bids'][car['bids'].length - 1].increment / car['bids'][car['bids'].length - 1].bid_amount) * 100).toFixed(2) + "%" : "0%"})
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-600 underline">
                            <a href={`../../carDetails/${car.car_id}`} target="_blank">عرض</a>
                          </td>
                        </tr>

                        {/* صف التفاصيل الإضافية */}
                        {expandedRows[idx] && (
                          <tr className="bg-gray-50">
                            <td colSpan={8} className="px-4 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <h4 className="font-semibold text-gray-700 mb-2">معلومات السيارة</h4>
                                  <ul className="space-y-1 text-sm">
                                    <li><span className="font-medium">العداد:</span> {car['car'].odometer} كم</li>
                                    <li><span className="font-medium">حالة السيارة:</span> {car['car'].condition || 'جيدة'}</li>
                                    <li><span className="font-medium">اللون:</span> {car['car'].color}</li>
                                    <li><span className="font-medium">نوع الوقود:</span> {car['car'].engine}</li>
                                  </ul>
                                </div>

                                <div>
                                  <h4 className="font-semibold text-gray-700 mb-2">معلومات المزايدة</h4>
                                  <ul className="space-y-1 text-sm">
                                    <li><span className="font-medium">المزايدات المقدمة:</span> {car['bids'].length}</li>
                                    <li><span className="font-medium">حالة المزايدة:</span> {car["status"] || 'مغلق'}</li>
                                    <li><span className="font-medium">نتيجة المزايدة:</span> {car["car"].auction_status}</li>
                                  </ul>
                                </div>

                                <div>
                                  <h4 className="font-semibold text-gray-700 mb-2">معلومات الأسعار</h4>
                                  <ul className="space-y-1 text-sm">
                                    <li><span className="font-medium">سعر الإفتتاح:</span> {formatCurrency (car["minimum_bid"] || 0)}</li>
                                    <li><span className="font-medium">أقل سعر:</span> {formatCurrency (car["minimum_bid"] || 0)}</li>
                                    <li><span className="font-medium">أعلى سعر:</span> {formatCurrency (car["maximum_bid"] || 0)}</li>
                                    <li><span className="font-medium">آخر سعر:</span> {formatCurrency (car["current_bid"] || 0)}</li>
                                    <li><span className="font-medium">التغير:</span> {car['bids'][car['bids'].length - 1] ? formatCurrency (car['bids'][car['bids'].length - 1].increment) : 0} ({car['bids'][car['bids'].length - 1] ? ((car['bids'][car['bids'].length - 1].increment / car['bids'][car['bids'].length - 1].bid_amount) * 100).toFixed(2) + "%" : "0%"})
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
          </div>
                                               <Pagination
        className="pagination-bar"
        currentPage={currentPage}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={page => setCurrentPage(page)}
      />
        </div></>
      )}
    </div>
  );
}

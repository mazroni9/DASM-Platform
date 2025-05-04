/**
 * 📝 الصفحة: الحراج المباشر (Live Market)
 * 📁 المسار: Frontend-local/app/auctions/auctions-main/live-market/page.tsx
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
import { ChevronRight, Clock } from 'lucide-react';
import PlateSearch from './component/PlateSearch';
import BidTimer from '@/components/BidTimer';
import BidForm from '@/components/BidForm';

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
  const [marketCars, setMarketCars] = useState([]);
  const [currentCar, setCurrentCar] = useState<any>(null);
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

  useEffect(() => {
    fetch('/api/items?type=live')
      .then(res => res.json())
      .then(data => {
        setMarketCars(data);
        if (data.length > 0) setCurrentCar(data[0]);
      })
      .catch(err => console.error('فشل في تحميل سيارات الحراج المباشر:', err));
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
        {/* العنوان الرئيسي للمنصة باللغة الإنجليزية */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-medium text-blue-700 tracking-wide max-w-2xl mx-auto pb-1.5 border-b border-gray-200">Digital Auctions Sectors Market</h1>
        </div>
        {/* زر العودة منفرد في الجهة اليمنى */}
        <div className="flex justify-end mb-4">
          <Link 
            href="/auctions" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors px-3 py-1 text-sm rounded-full border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100"
          >
            <ChevronRight className="h-4 w-4 ml-1 rtl:rotate-180" />
            <span>العودة</span>
          </Link>
        </div>
        
        {/* رأس الصفحة: السوق الصامت - الحراج المباشر - وقت السوق */}
        <div className="grid grid-cols-3 items-center mb-6 gap-4">
          {/* شريط المزاد في اليسار */}
          <div className="flex justify-start">
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
          <div className="text-center">
            <h1 className="text-3xl font-bold text-teal-700">الحراج المباشر</h1>
            <div className="text-sm text-teal-600 mt-1">وقت السوق من 4 عصراً إلى 7 مساءً كل يوم</div>
          </div>
          
          {/* مساحة فارغة للتوازن */}
          <div></div>
        </div>
        
        {/* إعادة تصميم التخطيط الرئيسي */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* مربع معلومات السيارة (يمين) */}
          <div className="md:col-span-1 flex flex-col">
            <div className="bg-white p-6 rounded-xl shadow-md h-full">
              <h2 className="text-xl font-bold mb-4 border-b pb-2 text-center text-teal-800">السيارة الحالية في الحراج</h2>
              
              {currentCar ? (
                <div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-y-3 text-base">
                      <div><span className="font-semibold">الماركة:</span> {currentCar.meta?.make || "شيفروليه"}</div>
                      <div><span className="font-semibold">الموديل:</span> {currentCar.meta?.model || "سيلفرادو"}</div>
                      <div><span className="font-semibold">السنة:</span> {currentCar.meta?.year || "2018"}</div>
                      <div><span className="font-semibold">العداد:</span> {currentCar.meta?.mileage || "135000"} كم</div>
                      <div><span className="font-semibold">الحالة:</span> {currentCar.meta?.condition || "جيدة"}</div>
                      <div><span className="font-semibold">رقم الشاصي:</span> {currentCar.vin || "XYZ987ABC654DEF"}</div>
                      <div className="col-span-2 mt-1"><span className="font-semibold">ملاحظات:</span> {currentCar.notes || "ملاحظات أولية..."}</div>
                    </div>
                    
                    <div className="text-base text-gray-600">
                      <span>مشاهدون: {currentCar.viewers || "127"} | </span>
                      <span>مزايدون: {currentCar.bidders || "15"} (تقريبًا)</span>
                    </div>
                    
                    {currentCar.report_url && (
                      <div>
                        <a 
                          href={currentCar.report_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-base inline-block"
                        >
                          عرض تقرير الفحص (PDF)
                        </a>
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <h3 className="font-semibold text-lg">آخر سعر أعلنه المحرج</h3>
                      <div className="text-3xl font-bold text-teal-600 mt-1">
                        {currentCar.current_price || "55,000"} ريال
                      </div>
                    </div>
                    
                    {!showBid ? (
                      <button 
                        onClick={() => setShowBid(true)}
                        className="mt-6 w-full bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 font-bold"
                      >
                        تأكيد المزايدة
                      </button>
                    ) : (
                      <div className="mt-6">
                        <BidForm 
                          itemId={parseInt(currentCar.id) || 1} 
                          currentPrice={parseInt((currentCar.current_price || "55000").toString().replace(/,/g, ''))} 
                          onSuccess={() => {
                            setShowBid(false);
                            setStatus('✅ تمت المزايدة بنجاح');
                          }}
                        />
                        {status && <p className="text-center text-sm mt-2">{status}</p>}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">لا توجد سيارة معروضة حاليًا في الحراج المباشر</p>
                </div>
              )}
              
              {/* إضافة خانة البحث داخل مربع معلومات السيارة */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={plate}
                      onChange={(e) => setPlate(e.target.value)}
                      placeholder="أدخل رقم اللوحة مثل XYZ987"
                      className="p-2 text-sm border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-teal-300 focus:border-teal-500"
                    />
                    <button
                      onClick={handleSearch}
                      disabled={loading}
                      className="absolute left-0 top-0 h-full bg-teal-600 text-white px-3 rounded-l-lg hover:bg-teal-700 whitespace-nowrap text-sm"
                    >
                      {loading ? 'جارٍ...' : 'بحث'}
                    </button>
                  </div>
                  <h3 className="text-sm font-semibold text-teal-800 whitespace-nowrap">ابحث برقم اللوحة</h3>
                </div>
              </div>
            </div>
          </div>

          {/* مربع البث المباشر (يسار) - متجاوب مع جميع أحجام الشاشات */}
          <div className="md:col-span-2">
            <div className="relative w-full pb-[70%] bg-black rounded-lg overflow-hidden">
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src="https://www.youtube.com/embed/live_stream?channel=UCxiLyu5z-T0FanDNotwTJcg&autoplay=1"
                title="البث المباشر"
                frameBorder="0"
                allowFullScreen
              ></iframe>
            </div>
            <div className="mt-3 text-center text-xs text-gray-500 italic">
              (بث مباشر من قاعة المزاد - إذا كنت لا ترى البث، فربما يكون المزاد لم يبدأ بعد)
            </div>
          </div>
        </div>

        {/* جدول السيارات في جلسة الحراج الحالية */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-teal-800">سيارات جلسة الحراج الحالية</h2>
          
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
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{car.meta?.make || "شيفروليه"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{car.meta?.model || "سيلفرادو"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{car.meta?.year || "2018"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{car.min_price || "50,000"} ريال</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{car.max_price || "60,000"} ريال</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-teal-600">{car.current_price || "55,000"} ريال</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-teal-600">
                        <Link href={`/car/${car.id}`} className="hover:underline">عرض</Link>
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
                {/* صف مثال في حالة عدم وجود بيانات كافية */}
                {marketCars && marketCars.length === 0 && (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">1</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">شيفروليه</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">سيلفرادو</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">2018</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">50,000 ريال</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">60,000 ريال</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-teal-600">55,000 ريال</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-teal-600">
                      <Link href={`/car/example`} className="hover:underline">عرض</Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

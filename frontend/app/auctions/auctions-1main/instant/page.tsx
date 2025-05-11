'use client';

import React, { useEffect, useState, Fragment } from 'react';
import Link from 'next/link';
import { ChevronRight, Clock, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import BidTimer from '@/components/BidTimer';
import PriceInfoDashboard from '@/components/PriceInfoDashboard';
import { formatMoney } from '@/app/lib/format-utils';

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

interface Car {
  id: number;
  الماركة: string;
  الموديل: string;
  "سنة الصنع": number;
  "رقم اللوحة": string;
  "رقم العداد": number;
  "حالة السيارة": string;
  "الحالة في المزاد": string;
  "لون السيارة": string;
  "نوع الوقود": string;
  "المزايدات المقدمة": number;
  "سعر الافتتاح": number;
  "اقل سعر": number;
  "اعلى سعر": number;
  "اخر سعر": number;
  "التغير": number;
  "نسبة التغير": string;
  "نتيجة المزايدة": string;
}

export default function InstantAuctionPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<{[key: number]: boolean}>({});
  
  const { label: auctionType } = getCurrentAuctionType(currentTime);

  // تحديث الوقت كل ثانية
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch('/api/auctions?type=live_instant')
      .then(res => res.json())
      .then(data => {
        setCars(data);
        setFilteredCars(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('فشل تحميل بيانات السوق الفوري المباشر', err);
        setLoading(false);
      });
  }, []);

  // تصفية السيارات بناءً على معايير البحث
  useEffect(() => {
    let result = [...cars];
    
    // تصفية بالبحث النصي (الماركة، الموديل، رقم اللوحة)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(car => 
        (car.الماركة?.toLowerCase()?.includes(searchLower)) ||
        (car.الموديل?.toLowerCase()?.includes(searchLower)) ||
        (car["رقم اللوحة"]?.toLowerCase()?.includes(searchLower))
      );
    }
    
    // تصفية بالسعر الأدنى
    if (minPrice) {
      const min = parseFloat(minPrice);
      result = result.filter(car => (car["اخر سعر"] || 0) >= min);
    }
    
    // تصفية بالسعر الأعلى
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      result = result.filter(car => (car["اخر سعر"] || 0) <= max);
    }
    
    setFilteredCars(result);
  }, [cars, searchTerm, minPrice, maxPrice]);

  // تبديل حالة التوسيع للصف
  const toggleRowExpansion = (id: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="p-4">
      <div className="flex justify-end mb-4">
        <Link 
          href="/auctions/auctions-1main" 
          className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors px-3 py-1 text-sm rounded-full border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100"
        >
          <ChevronRight className="h-4 w-4 ml-1 rtl:rotate-180" />
          <span>العودة</span>
        </Link>
      </div>

      <div className="grid grid-cols-12 items-center mb-6 gap-4">
        {/* شريط المزاد في اليسار */}
        <div className="col-span-3 flex justify-start">
          <div className="bg-white border-r-4 border-blue-500 rounded-lg shadow-sm px-3 py-1.5 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-800 ml-2">
              <div>{auctionType} - جارٍ الآن</div>
            </div>
            <div className="flex items-center gap-2 mr-2">
              <Clock className="text-blue-500 h-4 w-4" />
              <div className="text-base font-mono font-semibold text-blue-800 dir-ltr">
                <BidTimer showLabel={false} showProgress={false} />
              </div>
            </div>
          </div>
        </div>
        
        {/* عنوان الصفحة في الوسط */}
        <div className="col-span-6 text-center">
          <h1 className="text-2xl font-bold">السوق الفوري المباشر - جميع السيارات</h1>
          <div className="text-sm text-blue-600 mt-1">وقت السوق من 7 مساءً إلى 10 مساءً كل يوم</div>
        </div>
        
        {/* لوحة معلومات السعر المباشرة */}
        <div className="col-span-3">
          {cars.length > 0 && (
            <PriceInfoDashboard 
              currentPrice={cars[0]?.["اخر سعر"] || 0}
              previousPrice={cars[0]?.["اخر سعر"] - (cars[0]?.["التغير"] || 0)}
              auctionType="live_instant"
            />
          )}
        </div>
      </div>
      
      {/* قسم البحث والتصفية */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-wrap items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">البحث والتصفية</h2>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-blue-600 text-sm font-medium"
          >
            <Filter className="h-4 w-4 ml-1" />
            {showFilters ? 'إخفاء خيارات التصفية' : 'إظهار خيارات التصفية'}
          </button>
        </div>
        
        {/* حقل البحث */}
        <div className="relative">
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="البحث عن ماركة، موديل، أو رقم لوحة..."
            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* خيارات التصفية الإضافية */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السعر الأدنى</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="أدخل السعر الأدنى"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السعر الأعلى</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="أدخل السعر الأعلى"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* عرض النتائج والمعلومات */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">نتائج البحث</h2>
          <div className="text-sm text-gray-600">عدد السيارات: {filteredCars.length}</div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredCars.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            لا توجد نتائج تطابق معايير البحث
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase"></th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الماركة</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الموديل</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">سنة الصنع</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">السعر</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">التغير</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">تفاصيل</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCars.map((car, idx) => (
                  <Fragment key={idx}>
                    <tr className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-2 whitespace-nowrap">
                        <button 
                          onClick={() => toggleRowExpansion(idx)}
                          className="text-gray-500 hover:text-blue-600"
                        >
                          {expandedRows[idx] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{car.الماركة}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{car.الموديل}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{car["سنة الصنع"]}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                        {formatMoney(car["اخر سعر"] || 0)} ر.س
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${car["التغير"] > 0 ? 'bg-green-100 text-green-800' : car["التغير"] < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                          {car["التغير"] > 0 ? '+' : ''}{formatMoney(car["التغير"] || 0)} ({car["نسبة التغير"] || '0%'})
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 underline">
                        <a href={`/carDetails/${car.id}`} target="_blank">عرض</a>
                      </td>
                    </tr>
                    
                    {/* صف التفاصيل الإضافية */}
                    {expandedRows[idx] && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-2">معلومات السيارة</h4>
                              <ul className="space-y-1 text-sm">
                                <li><span className="font-medium">رقم اللوحة:</span> {car["رقم اللوحة"]}</li>
                                <li><span className="font-medium">العداد:</span> {car["رقم العداد"]} كم</li>
                                <li><span className="font-medium">حالة السيارة:</span> {car["حالة السيارة"]}</li>
                                <li><span className="font-medium">اللون:</span> {car["لون السيارة"]}</li>
                                <li><span className="font-medium">نوع الوقود:</span> {car["نوع الوقود"]}</li>
                              </ul>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-2">معلومات المزايدة</h4>
                              <ul className="space-y-1 text-sm">
                                <li><span className="font-medium">المزايدات المقدمة:</span> {car["المزايدات المقدمة"]}</li>
                                <li><span className="font-medium">حالة المزايدة:</span> {car["الحالة في المزاد"]}</li>
                                <li><span className="font-medium">نتيجة المزايدة:</span> {car["نتيجة المزايدة"]}</li>
                              </ul>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-2">معلومات الأسعار</h4>
                              <ul className="space-y-1 text-sm">
                                <li><span className="font-medium">سعر الافتتاح:</span> {formatMoney(car["سعر الافتتاح"] || 0)} ر.س</li>
                                <li><span className="font-medium">أقل سعر:</span> {formatMoney(car["اقل سعر"] || 0)} ر.س</li>
                                <li><span className="font-medium">أعلى سعر:</span> {formatMoney(car["اعلى سعر"] || 0)} ر.س</li>
                                <li><span className="font-medium">آخر سعر:</span> {formatMoney(car["اخر سعر"] || 0)} ر.س</li>
                                <li><span className="font-medium">التغير:</span> {formatMoney(car["التغير"] || 0)} ر.س ({car["نسبة التغير"]})</li>
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

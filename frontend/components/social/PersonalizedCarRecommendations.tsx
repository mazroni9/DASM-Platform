/**
 * 🧩 مكون توصيات السيارات المخصصة
 * 📁 المسار: components/social/PersonalizedCarRecommendations.tsx
 *
 * ✅ الوظيفة:
 * - عرض توصيات مخصصة للسيارات بناء على اهتمامات المزايد وسلوكه السابق
 * - تقسيم التوصيات لفئات (سيارات مشابهة، المزادات القادمة، القيمة المميزة)
 * - إمكانية تفعيل التنبيهات للمزادات المهمة
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Car, Bell, Calendar, ArrowUpRight, Bookmark, Star, Clock, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatMoney } from '@/app/lib/format-utils';

// واجهة بيانات السيارة الموصى بها
interface RecommendedCar {
  id: number;
  title: string;
  make: string;
  model: string;
  year: number;
  image: string;
  price: number;
  auctionDate?: string; // للمزادات القادمة
  timeLeft?: string; // الوقت المتبقي للمزادات الجارية
  isLiveNow?: boolean; // هل المزاد جارٍ الآن
  match?: number; // نسبة التطابق مع تفضيلات المستخدم (0-100)
  valueScore?: number; // مؤشر القيمة (0-100)
  isWatched?: boolean; // هل يراقبها المستخدم
}

interface PersonalizedCarRecommendationsProps {
  userId: string;
  limit?: number; // عدد التوصيات المعروضة لكل فئة
}

export default function PersonalizedCarRecommendations({ 
  userId, 
  limit = 3 
}: PersonalizedCarRecommendationsProps) {
  const [similarCars, setSimilarCars] = useState<RecommendedCar[]>([]);
  const [upcomingAuctions, setUpcomingAuctions] = useState<RecommendedCar[]>([]);
  const [valueDeals, setValueDeals] = useState<RecommendedCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'similar' | 'upcoming' | 'value'>('similar');
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  
  useEffect(() => {
    // محاكاة جلب البيانات من الخادم
    async function fetchRecommendations() {
      try {
        setLoading(true);
        
        // محاكاة تأخير الشبكة
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // بيانات تجريبية للتوصيات المشابهة
        const mockSimilarCars: RecommendedCar[] = [
          {
            id: 1001,
            title: 'لكزس ES350',
            make: 'لكزس',
            model: 'ES350',
            year: 2020,
            image: 'https://example.com/images/lexus-es350.jpg',
            price: 195000,
            isLiveNow: true,
            timeLeft: '35 دقيقة',
            match: 95,
            isWatched: true
          },
          {
            id: 1002,
            title: 'تويوتا أفالون',
            make: 'تويوتا',
            model: 'أفالون',
            year: 2021,
            image: 'https://example.com/images/toyota-avalon.jpg',
            price: 185000,
            isLiveNow: false,
            match: 88,
            isWatched: false
          },
          {
            id: 1003,
            title: 'نيسان ماكسيما',
            make: 'نيسان',
            model: 'ماكسيما',
            year: 2019,
            image: 'https://example.com/images/nissan-maxima.jpg',
            price: 150000,
            isLiveNow: false,
            match: 82,
            isWatched: false
          },
          {
            id: 1004,
            title: 'كيا K5',
            make: 'كيا',
            model: 'K5',
            year: 2021,
            image: 'https://example.com/images/kia-k5.jpg',
            price: 140000,
            isLiveNow: false,
            match: 78,
            isWatched: true
          }
        ];
        
        // بيانات تجريبية للمزادات القادمة
        const mockUpcomingAuctions: RecommendedCar[] = [
          {
            id: 2001,
            title: 'مرسيدس E200',
            make: 'مرسيدس',
            model: 'E200',
            year: 2020,
            image: 'https://example.com/images/mercedes-e200.jpg',
            price: 220000,
            auctionDate: '2023-10-25T14:00:00',
            match: 92,
            isWatched: true
          },
          {
            id: 2002,
            title: 'بي إم دبليو 520i',
            make: 'بي إم دبليو',
            model: '520i',
            year: 2019,
            image: 'https://example.com/images/bmw-520i.jpg',
            price: 210000,
            auctionDate: '2023-10-26T16:00:00',
            match: 85,
            isWatched: false
          },
          {
            id: 2003,
            title: 'أودي A6',
            make: 'أودي',
            model: 'A6',
            year: 2020,
            image: 'https://example.com/images/audi-a6.jpg',
            price: 225000,
            auctionDate: '2023-10-27T18:00:00',
            match: 80,
            isWatched: false
          }
        ];
        
        // بيانات تجريبية لصفقات القيمة الجيدة
        const mockValueDeals: RecommendedCar[] = [
          {
            id: 3001,
            title: 'هيونداي سوناتا',
            make: 'هيونداي',
            model: 'سوناتا',
            year: 2020,
            image: 'https://example.com/images/hyundai-sonata.jpg',
            price: 120000,
            valueScore: 92,
            isLiveNow: true,
            timeLeft: '50 دقيقة',
            isWatched: false
          },
          {
            id: 3002,
            title: 'تويوتا كامري',
            make: 'تويوتا',
            model: 'كامري',
            year: 2019,
            image: 'https://example.com/images/toyota-camry.jpg',
            price: 110000,
            valueScore: 89,
            auctionDate: '2023-10-25T15:30:00',
            isWatched: true
          },
          {
            id: 3003,
            title: 'هوندا أكورد',
            make: 'هوندا',
            model: 'أكورد',
            year: 2018,
            image: 'https://example.com/images/honda-accord.jpg',
            price: 95000,
            valueScore: 87,
            auctionDate: '2023-10-26T12:00:00',
            isWatched: false
          }
        ];
        
        setSimilarCars(mockSimilarCars);
        setUpcomingAuctions(mockUpcomingAuctions);
        setValueDeals(mockValueDeals);
      } catch (err) {
        console.error('فشل في جلب التوصيات:', err);
        setError('لم نتمكن من جلب التوصيات. يرجى المحاولة مرة أخرى لاحقًا.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchRecommendations();
  }, [userId]);
  
  // تبديل مراقبة السيارة
  const toggleWatchCar = (carId: number) => {
    // تحديث سيارات مشابهة
    setSimilarCars(prevCars => 
      prevCars.map(car => 
        car.id === carId
          ? { ...car, isWatched: !car.isWatched }
          : car
      )
    );
    
    // تحديث المزادات القادمة
    setUpcomingAuctions(prevAuctions => 
      prevAuctions.map(car => 
        car.id === carId
          ? { ...car, isWatched: !car.isWatched }
          : car
      )
    );
    
    // تحديث صفقات القيمة
    setValueDeals(prevDeals => 
      prevDeals.map(car => 
        car.id === carId
          ? { ...car, isWatched: !car.isWatched }
          : car
      )
    );
    
    // في التنفيذ الفعلي، يتم إرسال طلب API هنا لتحديث حالة المراقبة في الخادم
  };
  
  // تنسيق تاريخ المزاد
  const formatAuctionDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return 'اليوم';
    } else if (diffDays === 1) {
      return 'غدًا';
    } else if (diffDays < 7) {
      return `بعد ${diffDays} أيام`;
    } else {
      return date.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' });
    }
  };
  
  // الانتقال إلى صفحة السيارة
  const navigateToCarPage = (carId: number) => {
    router.push(`/car/${carId}`);
  };
  
  // عرض حالة التحميل
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
        <div className="p-4 border-b">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="p-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="h-16 w-24 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // عرض حالة الخطأ
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 text-center text-red-500">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }
  
  // تحديد البيانات المعروضة بناء على التبويب النشط
  const getActiveTabData = (): RecommendedCar[] => {
    switch (activeTab) {
      case 'similar':
        return similarCars;
      case 'upcoming':
        return upcomingAuctions;
      case 'value':
        return valueDeals;
      default:
        return similarCars;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* رأس المكون */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <h3 className="font-bold flex items-center">
          <Car className="h-5 w-5 ml-2" />
          توصيات مخصصة لك
        </h3>
        <p className="text-blue-100 text-sm mt-1">
          بناءً على اهتماماتك وسلوك المزايدة السابق
        </p>
      </div>
      
      {/* تبويبات التصفية */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('similar')}
          className={`flex-1 py-2.5 text-sm font-medium ${
            activeTab === 'similar'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          سيارات مشابهة
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 py-2.5 text-sm font-medium ${
            activeTab === 'upcoming'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          مزادات قادمة
        </button>
        <button
          onClick={() => setActiveTab('value')}
          className={`flex-1 py-2.5 text-sm font-medium ${
            activeTab === 'value'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          قيمة مميزة
        </button>
      </div>
      
      {/* قائمة السيارات الموصى بها */}
      <div className="divide-y divide-gray-100">
        {getActiveTabData().slice(0, limit).map((car) => (
          <div key={car.id} className="p-3 hover:bg-gray-50">
            <div className="flex space-x-3 rtl:space-x-reverse">
              {/* صورة السيارة */}
              <div className="w-24 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                <img 
                  src={car.image} 
                  alt={car.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // استبدال الصورة بصورة بديلة في حالة الخطأ
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96x64?text=DASM';
                  }}
                />
              </div>
              
              {/* معلومات السيارة */}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{car.title}</h4>
                    <p className="text-sm text-gray-500">
                      {car.year} • {formatMoney(car.price)} ريال
                    </p>
                  </div>
                  
                  {/* أيقونات الإجراءات */}
                  <div className="flex items-center space-x-1 rtl:space-x-reverse">
                    <button
                      title={car.isWatched ? 'إلغاء المراقبة' : 'إضافة للمراقبة'}
                      onClick={() => toggleWatchCar(car.id)}
                      className={`p-1.5 rounded-full ${
                        car.isWatched
                          ? 'text-blue-500 bg-blue-50 hover:bg-blue-100'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      <Bookmark className="h-4 w-4" fill={car.isWatched ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      title="عرض التفاصيل"
                      onClick={() => navigateToCarPage(car.id)}
                      className="p-1.5 text-gray-400 rounded-full hover:bg-gray-100"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {/* المؤشرات الإضافية */}
                <div className="flex items-center mt-1.5 text-xs">
                  {/* نسبة التطابق */}
                  {car.match && (
                    <div className="flex items-center mr-3 text-blue-600">
                      <Star className="h-3 w-3 mr-0.5" fill="currentColor" />
                      <span>تطابق {car.match}%</span>
                    </div>
                  )}
                  
                  {/* مؤشر القيمة */}
                  {car.valueScore && (
                    <div className="flex items-center mr-3 text-green-600">
                      <Zap className="h-3 w-3 mr-0.5" />
                      <span>قيمة جيدة {car.valueScore}%</span>
                    </div>
                  )}
                  
                  {/* مؤشر الوقت */}
                  {car.isLiveNow && (
                    <div className="flex items-center mr-3 text-red-500">
                      <div className="h-2 w-2 bg-red-500 rounded-full mr-1 animate-pulse"></div>
                      <span>مباشر الآن • {car.timeLeft}</span>
                    </div>
                  )}
                  
                  {/* تاريخ المزاد القادم */}
                  {car.auctionDate && !car.isLiveNow && (
                    <div className="flex items-center mr-3 text-gray-500">
                      <Calendar className="h-3 w-3 mr-0.5" />
                      <span>{formatAuctionDate(car.auctionDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* تذييل المكون */}
      <div className="bg-gray-50 p-3 text-center">
        <Link href="/recommendations" className="text-blue-600 text-sm hover:underline">
          عرض جميع التوصيات
        </Link>
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { BarChart, AlertCircle, ArrowUpRight, Zap, Video } from 'lucide-react';
import LoadingLink from "@/components/LoadingLink";

// واجهة نشاط المزاد
interface AuctionActivity {
  venueId: string;
  venueName: string;
  carModel: string;
  carYear: number;
  currentPrice: number;
  bidCount: number;
  activityScore: number;
  isLive: boolean;
}

interface ActivityMonitorProps {
  className?: string;
  onSwitchToVenue?: (venueId: string) => void;
}

export default function ActivityMonitor({ className, onSwitchToVenue }: ActivityMonitorProps) {
  const [activities, setActivities] = useState<AuctionActivity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'activity' | 'price'>('activity');

  // جلب بيانات النشاط عند تحميل المكون
  useEffect(() => {
    fetchActivityData();
    
    // تحديث البيانات كل 30 ثانية
    const interval = setInterval(fetchActivityData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // جلب بيانات نشاط المعارض
  const fetchActivityData = async () => {
    setIsLoading(true);
    
    try {
      // في التطبيق الحقيقي، سنجلب البيانات من الخادم
      // للآن، نستخدم بيانات وهمية
      const mockActivities: AuctionActivity[] = [
        {
          venueId: 'dasm-1',
          venueName: 'معرض dasm-1 - الدمام',
          carModel: 'تويوتا كامري',
          carYear: 2022,
          currentPrice: 85000,
          bidCount: 23,
          activityScore: 89,
          isLive: true
        },
        {
          venueId: 'dasm-5',
          venueName: 'معرض dasm-5 - الدمام',
          carModel: 'لكزس ES',
          carYear: 2023,
          currentPrice: 175000,
          bidCount: 15,
          activityScore: 65,
          isLive: true
        },
        {
          venueId: 'dasm-11',
          venueName: 'معرض dasm-11 - الرياض',
          carModel: 'جيب شيروكي',
          carYear: 2021,
          currentPrice: 120000,
          bidCount: 18,
          activityScore: 72,
          isLive: true
        },
        {
          venueId: 'dasm-20',
          venueName: 'معرض dasm-20 - الرياض',
          carModel: 'هيونداي سوناتا',
          carYear: 2023,
          currentPrice: 95000,
          bidCount: 10,
          activityScore: 45,
          isLive: false
        },
        {
          venueId: 'dasm-25',
          venueName: 'معرض dasm-25 - جدة',
          carModel: 'نيسان باترول',
          carYear: 2020,
          currentPrice: 160000,
          bidCount: 8,
          activityScore: 38,
          isLive: false
        }
      ];
      
      setActivities(mockActivities);
    } catch (err) {
      setError('تعذر جلب بيانات النشاط');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // التبديل إلى معرض
  const handleSwitchToVenue = (venueId: string) => {
    if (onSwitchToVenue) {
      onSwitchToVenue(venueId);
    }
  };

  // ترتيب المعارض حسب النشاط أو السعر
  const sortedActivities = [...activities].sort((a, b) => {
    if (sortBy === 'activity') {
      return b.activityScore - a.activityScore;
    } else {
      return b.currentPrice - a.currentPrice;
    }
  });

  // تحديد لون مؤشر النشاط
  const getActivityColor = (score: number) => {
    if (score >= 75) return 'bg-red-500';
    if (score >= 50) return 'bg-orange-500';
    if (score >= 25) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  // تنسيق السعر
  const formatPrice = (price: number) => {
    return price.toLocaleString() + ' ريال';
  };

  return (
    <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <BarChart className="mr-2 h-5 w-5" />
        مراقبة نشاط المعارض
      </h2>
      
      {/* عرض الأخطاء إن وجدت */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 rounded-md mb-4 flex items-start">
          <AlertCircle className="text-red-500 mt-0.5 ml-2 flex-shrink-0 h-5 w-5" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      {/* ترتيب النتائج */}
      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {isLoading ? 'جارٍ تحديث البيانات...' : `${activities.length} معرض نشط`}
        </div>
        
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <span className="text-sm text-gray-700">ترتيب حسب:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('activity')}
              className={`px-2 py-1 text-xs rounded-md ${
                sortBy === 'activity'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              النشاط
            </button>
            <button
              onClick={() => setSortBy('price')}
              className={`px-2 py-1 text-xs rounded-md ${
                sortBy === 'price'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              السعر
            </button>
          </div>
        </div>
      </div>
      
      {/* قائمة المعارض */}
      <div className="space-y-3">
        {sortedActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            لا توجد بيانات نشاط متاحة.
          </div>
        ) : (
          sortedActivities.map((activity) => (
            <div
              key={activity.venueId}
              className={`p-3 border rounded-lg ${
                activity.activityScore >= 75 ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-900">
                    {activity.venueName}
                    {activity.isLive && (
                      <span className="mr-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
                        <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse mr-1"></span>
                        مباشر
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {activity.carModel} - {activity.carYear}
                  </p>
                </div>
                
                <div className="text-left">
                  <div className="font-bold text-lg text-gray-900">
                    {formatPrice(activity.currentPrice)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {activity.bidCount} مزايدة
                  </div>
                </div>
              </div>
              
              {/* مؤشر النشاط */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600">مستوى النشاط</span>
                  <span className="text-xs font-bold">{activity.activityScore}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getActivityColor(activity.activityScore)}`}
                    style={{ width: `${activity.activityScore}%` }}
                  ></div>
                </div>
              </div>
              
              {/* أزرار التحكم */}
              <div className="flex justify-between">
                <LoadingLink 
                  href={`/broadcasts?venue=${activity.venueId}`}
                  target="_blank"
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <Video className="h-3.5 w-3.5 mr-1" />
                  مشاهدة البث
                </LoadingLink>
                
                <button
                  onClick={() => handleSwitchToVenue(activity.venueId)}
                  className={`flex items-center text-sm ${
                    activity.activityScore >= 75
                      ? 'text-red-600 hover:text-red-800'
                      : 'text-blue-600 hover:text-blue-800'
                  }`}
                >
                  {activity.activityScore >= 75 ? (
                    <>
                      <Zap className="h-3.5 w-3.5 mr-1" />
                      التبديل فوراً
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                      التبديل إلى المعرض
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* زر تحديث البيانات */}
      <div className="mt-4 text-center">
        <button
          onClick={fetchActivityData}
          disabled={isLoading}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
        >
          {isLoading ? 'جارٍ التحديث...' : 'تحديث البيانات'}
        </button>
      </div>
    </div>
  );
} 
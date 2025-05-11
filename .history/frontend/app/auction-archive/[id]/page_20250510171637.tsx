/**
 * 📝 الصفحة: تفاصيل المزاد المسجل
 * 📁 المسار: frontend/app/auction-archive/[id]/page.tsx
 *
 * ✅ الوظيفة:
 * - عرض تفاصيل المزاد المسجل
 * - تشغيل فيديو المزاد مع عرض البيانات المتزامنة
 * - عرض قائمة السيارات المباعة في المزاد
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Car, 
  TrendingUp, 
  Download, 
  BookOpen,
  Share2, 
  ChevronDown, 
  ChevronUp, 
  Tag
} from 'lucide-react';
import RecordedAuctionPlayer from '@/components/archive/RecordedAuctionPlayer';
import AuctionCarList from '@/components/archive/AuctionCarList';
import { formatMoney } from '@/app/lib/format-utils';
import { formatDate } from '@/app/lib/format-utils';

// واجهة بيانات السيارة المباعة
interface AuctionSoldCar {
  id: number;
  make: string;
  model: string;
  year: number;
  imageUrl: string;
  startPrice: number;
  finalPrice: number;
  bidCount: number;
  timestamp: number;
  duration: number;
  bidders: number;
  color?: string;
  fuelType?: string;
  transmission?: string;
}

// واجهة أحداث المزاد
interface AuctionEvent {
  timestamp: number;
  type: 'bid' | 'sale' | 'announcement' | 'highlight';
  description: string;
  amount?: number;
  carId?: number;
}

// واجهة بيانات المزاد المفصلة
interface AuctionDetails {
  id: number;
  title: string;
  date: string;
  endTime: string;
  venue: string;
  location: string;
  description: string;
  thumbnailUrl: string;
  recordingUrl: string;
  duration: number;
  totalCars: number;
  soldCars: number;
  totalBids: number;
  totalParticipants: number;
  totalSales: number;
  auctioneer: string;
  organizationName: string;
  organizationLogo: string;
  cars: AuctionSoldCar[];
  events: AuctionEvent[];
  hasHighlights: boolean;
  similar: {
    id: number;
    title: string;
    date: string;
  }[];
}

export default function AuctionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const auctionId = params?.id;
  
  const [loading, setLoading] = useState(true);
  const [auction, setAuction] = useState<AuctionDetails | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  // محاكاة جلب بيانات المزاد
  useEffect(() => {
    const fetchAuctionDetails = async () => {
      setLoading(true);
      
      try {
        // محاكاة تأخير الشبكة
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // لأغراض العرض، نقوم بمحاكاة استرجاع البيانات بالاعتماد على معرف المزاد
        // في التطبيق الفعلي، ستكون هذه البيانات مستردة من الخادم
        const mockAuction: AuctionDetails = {
          id: Number(auctionId),
          title: 'مزاد السيارات الفاخرة - الرياض 2023',
          date: '2023-11-15T18:00:00Z',
          endTime: '2023-11-15T21:00:00Z',
          venue: 'معرض الرياض للسيارات',
          location: 'الرياض - حي العليا',
          description: 'تمّ إقامة مزاد السيارات الفاخرة في معرض الرياض، وشهد إقبالاً كبيراً من المزايدين والمهتمين. شمل المزاد مجموعة متنوعة من السيارات الفاخرة من مختلف الماركات العالمية، وتميز بتنظيم محكم وشفافية عالية في آلية البيع. تخلل المزاد عدة منافسات قوية على العديد من السيارات المميزة، وتم تحقيق مبيعات تجاوزت التوقعات. تميز المزاد بحضور نخبة من هواة ومقتني السيارات الفاخرة، وشهد تسجيل أرقام قياسية لبعض الموديلات النادرة.',
          thumbnailUrl: 'https://example.com/images/auction1.jpg',
          recordingUrl: 'https://example.com/videos/auction1.mp4',
          duration: 180, // 3 ساعات
          totalCars: 25,
          soldCars: 22,
          totalBids: 348,
          totalParticipants: 156,
          totalSales: 8750000,
          auctioneer: 'عبدالله محمد القحطاني',
          organizationName: 'شركة المزادات المتميزة',
          organizationLogo: 'https://example.com/images/org-logo.png',
          hasHighlights: true,
          similar: [
            { id: 2, title: 'مزاد السيارات الكلاسيكية - جدة', date: '2023-10-22T19:00:00Z' },
            { id: 3, title: 'مزاد السيارات الرياضية - الرياض', date: '2023-10-10T17:30:00Z' }
          ],
          // بيانات السيارات المباعة في المزاد
          cars: [
            {
              id: 101,
              make: 'مرسيدس',
              model: 'S-Class',
              year: 2021,
              imageUrl: 'https://example.com/images/mercedes-s-class.jpg',
              startPrice: 450000,
              finalPrice: 520000,
              bidCount: 24,
              timestamp: 1200, // 20 دقيقة من بداية المزاد
              duration: 180, // 3 دقائق
              bidders: 8,
              color: 'أسود',
              fuelType: 'بنزين',
              transmission: 'أوتوماتيك'
            },
            {
              id: 102,
              make: 'بي إم دبليو',
              model: '7-Series',
              year: 2020,
              imageUrl: 'https://example.com/images/bmw-7-series.jpg',
              startPrice: 380000,
              finalPrice: 425000,
              bidCount: 18,
              timestamp: 2700, // 45 دقيقة من بداية المزاد
              duration: 210, // 3.5 دقائق
              bidders: 6,
              color: 'أبيض',
              fuelType: 'بنزين',
              transmission: 'أوتوماتيك'
            },
            {
              id: 103,
              make: 'أودي',
              model: 'A8',
              year: 2022,
              imageUrl: 'https://example.com/images/audi-a8.jpg',
              startPrice: 420000,
              finalPrice: 490000,
              bidCount: 22,
              timestamp: 4500, // 1:15 ساعة من بداية المزاد
              duration: 240, // 4 دقائق
              bidders: 9,
              color: 'رمادي',
              fuelType: 'بنزين',
              transmission: 'أوتوماتيك'
            },
            {
              id: 104,
              make: 'لكزس',
              model: 'LS 500',
              year: 2021,
              imageUrl: 'https://example.com/images/lexus-ls500.jpg',
              startPrice: 400000,
              finalPrice: 450000,
              bidCount: 16,
              timestamp: 6300, // 1:45 ساعة من بداية المزاد
              duration: 150, // 2.5 دقائق
              bidders: 5,
              color: 'فضي',
              fuelType: 'بنزين',
              transmission: 'أوتوماتيك'
            },
            {
              id: 105,
              make: 'بورش',
              model: 'باناميرا',
              year: 2022,
              imageUrl: 'https://example.com/images/porsche-panamera.jpg',
              startPrice: 500000,
              finalPrice: 580000,
              bidCount: 28,
              timestamp: 8100, // 2:15 ساعة من بداية المزاد
              duration: 270, // 4.5 دقائق
              bidders: 12,
              color: 'أحمر',
              fuelType: 'بنزين',
              transmission: 'أوتوماتيك'
            }
          ],
          // أحداث المزاد المهمة
          events: [
            {
              timestamp: 300, // 5 دقائق
              type: 'announcement',
              description: 'بدء المزاد وترحيب المنادي بالحضور'
            },
            {
              timestamp: 1200, // 20 دقيقة
              type: 'highlight',
              description: 'بيع مرسيدس S-Class بمبلغ قياسي',
              amount: 520000,
              carId: 101
            },
            {
              timestamp: 2700, // 45 دقيقة
              type: 'bid',
              description: 'منافسة قوية على سيارة BMW',
              carId: 102
            },
            {
              timestamp: 4500, // 1:15 ساعة
              type: 'highlight',
              description: 'بيع أودي A8 بعد مزايدة حماسية',
              amount: 490000,
              carId: 103
            },
            {
              timestamp: 8100, // 2:15 ساعة
              type: 'highlight',
              description: 'أعلى سعر في المزاد لسيارة بورش باناميرا',
              amount: 580000,
              carId: 105
            },
            {
              timestamp: 10500, // 2:55 ساعة
              type: 'announcement',
              description: 'اختتام المزاد وإعلان النتائج النهائية'
            }
          ]
        };
        
        setAuction(mockAuction);
      } catch (error) {
        console.error('خطأ في استرجاع بيانات المزاد:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (auctionId) {
      fetchAuctionDetails();
    }
  }, [auctionId]);
  
  // الانتقال إلى نقطة معينة في تسجيل الفيديو
  const jumpToTimestamp = (timestamp: number) => {
    // يمكن تنفيذ هذه الوظيفة باستخدام مرجع للمشغل
    console.log(`الانتقال إلى النقطة الزمنية: ${timestamp} ثانية`);
    // يتم استدعاء دالة في مكون مشغل الفيديو
  };
  
  // تنسيق المدة من الدقائق إلى ساعات ودقائق
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours} ساعة${hours > 1 ? ' و' : ''}${mins > 0 ? ` ${mins} دقيقة` : ''}`;
    }
    
    return `${mins} دقيقة`;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="aspect-video bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded mb-6"></div>
              </div>
              <div>
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-16 bg-gray-200 rounded"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!auction) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center max-w-md">
          <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">لم يتم العثور على المزاد</h2>
          <p className="text-gray-600 mb-6">عذراً، المزاد المطلوب غير موجود أو تم حذفه.</p>
          <Link href="/auction-archive" className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
            <ArrowLeft className="h-4 w-4 ml-2" />
            العودة لأرشيف المزادات
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-4">
        {/* زر العودة وعنوان المزاد */}
        <div className="mb-6">
          <Link 
            href="/auction-archive" 
            className="inline-flex items-center text-teal-600 hover:text-teal-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 ml-1.5" />
            <span>العودة لأرشيف المزادات</span>
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{auction.title}</h1>
          
          <div className="flex flex-wrap items-center text-gray-600 gap-x-4 gap-y-2">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 ml-1.5 text-gray-400" />
              <span>{formatDate(new Date(auction.date))}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 ml-1.5 text-gray-400" />
              <span>{formatDuration(auction.duration)}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 ml-1.5 text-gray-400" />
              <span>{auction.venue} - {auction.location}</span>
            </div>
          </div>
        </div>
        
        {/* مشغل الفيديو */}
        <div className="mb-8">
          <RecordedAuctionPlayer
            recordingUrl={auction.recordingUrl}
            title={auction.title}
            carEvents={auction.cars}
            auctionEvents={auction.events}
            thumbnailUrl={auction.thumbnailUrl}
            hasHighlights={auction.hasHighlights}
          />
        </div>
        
        {/* المحتوى الرئيسي ولوحة المعلومات */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* عمود المحتوى الرئيسي */}
          <div className="lg:col-span-2 space-y-6">
            {/* وصف المزاد */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">نبذة عن المزاد</h2>
              <div className={`text-gray-600 relative ${!showFullDescription && 'max-h-32 overflow-hidden'}`}>
                <p>{auction.description}</p>
                {!showFullDescription && (
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
                )}
              </div>
              {auction.description.length > 200 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="mt-2 text-teal-600 text-sm flex items-center hover:underline"
                >
                  {showFullDescription ? (
                    <>
                      <ChevronUp className="h-4 w-4 ml-1" />
                      عرض أقل
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 ml-1" />
                      قراءة المزيد
                    </>
                  )}
                </button>
              )}
            </div>
            
            {/* قائمة السيارات المباعة */}
            <AuctionCarList 
              cars={auction.cars} 
              onJumpToTimestamp={jumpToTimestamp}
            />
            
            {/* تفاصيل المنظم */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">تفاصيل التنظيم</h2>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-shrink-0 w-16 h-16 relative bg-gray-100 rounded-lg overflow-hidden">
                  {/* شعار المنظم */}
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">{auction.organizationName}</h3>
                  <p className="text-gray-600 text-sm">المنادي: {auction.auctioneer}</p>
                  <div className="mt-2">
                    <Link href="#" className="text-teal-600 text-sm hover:underline">
                      عرض المزيد من مزادات هذا المنظم
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* لوحة المعلومات الجانبية */}
          <div className="space-y-6">
            {/* ملخص المزاد */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">ملخص المزاد</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">إجمالي المبيعات</div>
                    <div className="text-xl font-bold text-teal-600">
                      {formatMoney(auction.totalSales)} ريال
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">السيارات المباعة</div>
                    <div className="text-xl font-bold text-gray-800">
                      {auction.soldCars} / {auction.totalCars}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">المزايدات</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {auction.totalBids}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">المشاركون</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {auction.totalParticipants}
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">معدل البيع</div>
                  <div className="text-lg font-semibold flex items-center text-green-600">
                    <TrendingUp className="h-4 w-4 ml-1" />
                    {Math.round((auction.soldCars / auction.totalCars) * 100)}%
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">متوسط سعر البيع</div>
                  <div className="text-lg font-semibold text-gray-800">
                    {formatMoney(auction.totalSales / auction.soldCars)} ريال
                  </div>
                </div>
              </div>
            </div>
            
            {/* إجراءات */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">إجراءات</h3>
              
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                  <BookOpen className="h-4 w-4" />
                  <span>تنزيل تقرير المزاد PDF</span>
                </button>
                
                <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                  <Share2 className="h-4 w-4" />
                  <span>مشاركة المزاد</span>
                </button>
                
                <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                  <Tag className="h-4 w-4" />
                  <span>مزادات مشابهة</span>
                </button>
              </div>
            </div>
            
            {/* مزادات مشابهة */}
            {auction.similar && auction.similar.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">مزادات مشابهة</h3>
                
                <div className="space-y-3">
                  {auction.similar.map(sim => (
                    <Link 
                      key={sim.id} 
                      href={`/auction-archive/${sim.id}`}
                      className="block p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="font-medium text-gray-800">{sim.title}</div>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <Calendar className="h-3.5 w-3.5 ml-1.5" />
                        {formatDate(new Date(sim.date))}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
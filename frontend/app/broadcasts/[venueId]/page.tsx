'use client';

import React, { useEffect, useState } from 'react';
import LoadingLink from "@/components/LoadingLink";
import { ChevronRight, Clock, Video, ExternalLink, MapPin, Info, Users } from 'lucide-react';
import BidTimer from '@/components/BidTimer';
import LiveBidding from '@/components/LiveBidding';
import BidderChat from '@/components/social/BidderChat';
import { formatCurrency } from "@/utils/formatCurrency";

// المعارض العشرة من نفس القائمة في OtherVenuesGrid
const venuesData = [
  // 10 معارض في الدمام والمنطقة الشرقية
  {
    id: 'venue-101',
    name: 'معرض الخليج للسيارات - الدمام',
    location: 'الدمام، حي الشاطئ، طريق الخليج',
    thumbnail: '/logo.jpg',
    youtubeVideoId: 'jfKfPfyJRdk',
    viewersCount: 541,
    isLive: true,
    detailsUrl: '/auctions/auctions-1main/live-market',
    description: 'أحد أكبر معارض السيارات في المنطقة الشرقية، يقدم تشكيلة واسعة من السيارات الفاخرة والاقتصادية الجديدة والمستعملة بضمانات معتمدة وخدمات ما بعد البيع.'
  },
  {
    id: 'venue-102',
    name: 'معرض السيارات الفاخرة - الدمام',
    location: 'الدمام، حي الفيصلية، طريق الملك فهد',
    thumbnail: '/logo.jpg',
    youtubeVideoId: 'jfKfPfyJRdk',
    viewersCount: 328,
    isLive: true,
    detailsUrl: '/auctions/auctions-1main/live-market',
    description: 'معرض متخصص في السيارات الفاخرة والرياضية، يوفر للعملاء تجربة شراء استثنائية مع مجموعة مختارة من أفخم الماركات العالمية وأحدث الموديلات.'
  },
  {
    id: 'venue-103',
    name: 'معرض الشرق للسيارات الفاخرة - الخبر',
    location: 'الخبر، حي العقربية، طريق الملك سلمان',
    thumbnail: '/logo.jpg',
    youtubeVideoId: 'jfKfPfyJRdk',
    viewersCount: 217,
    isLive: true,
    detailsUrl: '/auctions/auctions-1main/live-market',
    description: 'معرض رائد في مدينة الخبر يقدم سيارات فاخرة وحصرية من أفضل العلامات التجارية العالمية، مع خدمة عملاء متميزة وعروض تمويلية مرنة.'
  },
  {
    id: 'venue-104',
    name: 'معرض الأحساء للسيارات',
    location: 'الأحساء، المبرز، طريق الرياض',
    thumbnail: '/logo.jpg',
    youtubeVideoId: 'jfKfPfyJRdk',
    viewersCount: 412,
    isLive: false,
    detailsUrl: '/auctions/auctions-1main/live-market',
    description: 'معرض رائد في محافظة الأحساء يقدم مجموعة متنوعة من السيارات بأنواعها المختلفة، مع خدمات الصيانة والضمان وتسهيلات في الدفع للعملاء.'
  },
  {
    id: 'venue-105',
    name: 'معرض النقل الثقيل - الدمام',
    location: 'الدمام، المنطقة الصناعية، طريق الخليج',
    thumbnail: '/logo.jpg',
    youtubeVideoId: 'jfKfPfyJRdk',
    viewersCount: 275,
    isLive: true,
    detailsUrl: '/auctions/auctions-1main/live-market',
    description: 'معرض متخصص في مركبات النقل الثقيل والشاحنات والمعدات الصناعية من مختلف الماركات العالمية، يقدم حلول نقل متكاملة للشركات والأفراد.'
  },
  {
    id: 'venue-106',
    name: 'معرض الخليج الجديد - الجبيل',
    location: 'الجبيل، حي الفناتير، شارع الخليج',
    thumbnail: '/logo.jpg',
    youtubeVideoId: 'jfKfPfyJRdk',
    viewersCount: 196,
    isLive: true,
    detailsUrl: '/auctions/auctions-1main/live-market',
    description: 'معرض حديث في مدينة الجبيل الصناعية، يوفر تشكيلة واسعة من السيارات الجديدة والمستعملة مع خدمات الفحص والضمان وتسهيلات بنكية متنوعة.'
  },
  {
    id: 'venue-107',
    name: 'معرض الشرقية للسيارات',
    location: 'الظهران، حي الدوحة، طريق الأمير محمد',
    thumbnail: '/logo.jpg',
    youtubeVideoId: 'jfKfPfyJRdk',
    viewersCount: 142,
    isLive: false,
    detailsUrl: '/auctions/auctions-1main/live-market',
    description: 'من أقدم وأعرق معارض السيارات في الظهران، يقدم خبرة أكثر من 25 عاماً في سوق السيارات مع تشكيلة متنوعة من المركبات وخدمات مميزة.'
  },
  {
    id: 'venue-108',
    name: 'معرض القطيف للسيارات',
    location: 'القطيف، شارع السوق، قرب الكورنيش',
    thumbnail: '/logo.jpg',
    youtubeVideoId: 'jfKfPfyJRdk',
    viewersCount: 188,
    isLive: true,
    detailsUrl: '/auctions/auctions-1main/live-market',
    description: 'معرض متميز في محافظة القطيف، يوفر مجموعة من السيارات الاقتصادية والعائلية بأسعار منافسة مع ضمانات حقيقية وخدمات ما بعد البيع.'
  },
  {
    id: 'venue-109',
    name: 'معرض الصدارة - الخبر',
    location: 'الخبر، حي اليرموك، طريق الدمام',
    thumbnail: '/logo.jpg',
    youtubeVideoId: 'jfKfPfyJRdk',
    viewersCount: 104,
    isLive: true,
    detailsUrl: '/auctions/auctions-1main/live-market',
    description: 'معرض عصري في مدينة الخبر، يتميز بتقديم أحدث موديلات السيارات مع باقات تمويلية متنوعة وخدمة عملاء استثنائية في بيئة احترافية.'
  },
  {
    id: 'venue-110',
    name: 'معرض رأس تنورة للسيارات',
    location: 'رأس تنورة، الشارع الرئيسي، بجوار البلدية',
    thumbnail: '/logo.jpg',
    youtubeVideoId: 'jfKfPfyJRdk',
    viewersCount: 231,
    isLive: true,
    detailsUrl: '/auctions/auctions-1main/live-market',
    description: 'المعرض الرائد في منطقة رأس تنورة، يخدم العملاء منذ أكثر من عقد، ويقدم سيارات متنوعة تناسب احتياجات سكان المنطقة بأسعار تنافسية.'
  },
  
  // 10 معارض في الرياض
  {
    id: 'venue-111',
    name: 'معرض السيارات الأول - الرياض',
    location: 'الرياض، حي العليا، طريق الملك فهد',
    thumbnail: '/logo.jpg',
    youtubeVideoId: 'jfKfPfyJRdk',
    viewersCount: 476,
    isLive: true,
    detailsUrl: '/auctions/auctions-1main/live-market',
    description: 'أحد أكبر معارض السيارات في العاصمة الرياض، يمتد على مساحة واسعة ويقدم تشكيلة شاملة من السيارات الجديدة والمستعملة مع خدمات متكاملة.'
  },
  {
    id: 'venue-112',
    name: 'معرض السيارات الفاخرة - الرياض',
    location: 'الرياض، حي الورود، طريق العروبة',
    thumbnail: '/logo.jpg',
    youtubeVideoId: 'jfKfPfyJRdk',
    viewersCount: 387,
    isLive: false,
    detailsUrl: '/auctions/auctions-1main/live-market',
    description: 'معرض متخصص في السيارات الفاخرة في قلب العاصمة، يوفر مجموعة نخبوية من السيارات الفاخرة والرياضية من أرقى الماركات العالمية.'
  },
  {
    id: 'venue-113',
    name: 'معرض السيارات الألمانية - الرياض',
    location: 'الرياض، حي النخيل، طريق الأمير تركي',
    thumbnail: '/logo.jpg',
    youtubeVideoId: 'jfKfPfyJRdk',
    viewersCount: 355,
    isLive: true,
    detailsUrl: '/auctions/auctions-1main/live-market',
    description: 'معرض متخصص في السيارات الألمانية الفاخرة مثل مرسيدس وبي إم دبليو وأودي وبورش، يقدم خدمات بيع وشراء وصيانة احترافية.'
  },
  {
    id: 'venue-114',
    name: 'معرض سيارات التميمي - الرياض',
    location: 'الرياض، حي الملز، شارع الصناعة',
    thumbnail: '/logo.jpg',
    youtubeVideoId: 'jfKfPfyJRdk',
    viewersCount: 245,
    isLive: true,
    detailsUrl: '/auctions/auctions-1main/live-market',
    description: 'معرض عائلي بخبرة تمتد لأكثر من 30 عاماً في سوق السيارات، يقدم تشكيلة متنوعة من السيارات الاقتصادية والعائلية بأسعار منافسة.'
  },
  {
    id: 'venue-115',
    name: 'معرض سيارات الوطن - الرياض',
    location: 'الرياض، حي العزيزية، طريق مكة المكرمة',
    thumbnail: '/logo.jpg',
    youtubeVideoId: 'jfKfPfyJRdk',
    viewersCount: 390,
    isLive: true,
    detailsUrl: '/auctions/auctions-1main/live-market',
    description: 'معرض وطني كبير في العاصمة الرياض، يضم تشكيلة واسعة من السيارات المحلية والمستوردة مع باقات ضمان شاملة وخدمات ما بعد البيع.'
  },
  {
    id: 'venue-116',
    name: 'معرض الصدارة للسيارات - الخرج',
    location: 'الخرج، حي الناصفة، طريق الملك فهد',
    thumbnail: '/logo.jpg',
    youtubeVideoId: 'jfKfPfyJRdk',
    viewersCount: 145,
    isLive: false,
    detailsUrl: '/auctions/auctions-1main/live-market',
    description: 'المعرض الرائد في محافظة الخرج، يخدم سكان المحافظة والمناطق المجاورة بتشكيلة متنوعة من السيارات وخدمات تمويلية متعددة.'
  },
  {
    id: 'venue-117',
    name: 'معرض الرياض للسيارات الكلاسيكية',
    location: 'الرياض، حي السلي، طريق الدائري الشرقي',
    thumbnail: '/logo.jpg',
    youtubeVideoId: 'jfKfPfyJRdk',
    viewersCount: 321,
    isLive: true,
    detailsUrl: '/auctions/auctions-1main/live-market',
    description: 'معرض فريد متخصص في السيارات الكلاسيكية والنادرة، يعرض قطعاً تاريخية من مختلف العصور ويقدم خدمات ترميم وصيانة متخصصة.'
  },
  {
    id: 'venue-118',
    name: 'معرض صحارى للسيارات - الرياض',
    location: 'الرياض، طريق الثمامة، حي الرمال',
    thumbnail: '/logo.jpg',
    youtubeVideoId: 'jfKfPfyJRdk',
    viewersCount: 172,
    isLive: true,
    detailsUrl: '/auctions/auctions-1main/live-market',
    description: 'معرض متميز يتخصص في سيارات الدفع الرباعي والسيارات المناسبة للصحراء والبر، مع خدمات تعديل وتجهيز السيارات للرحلات البرية.'
  },
  {
    id: 'venue-119',
    name: 'معرض النجم للسيارات - الرياض',
    location: 'الرياض، حي المنصورة، شارع الإمام سعود',
    thumbnail: '/logo.jpg',
    youtubeVideoId: 'jfKfPfyJRdk',
    viewersCount: 278,
    isLive: false,
    detailsUrl: '/auctions/auctions-1main/live-market',
    description: 'معرض عصري في العاصمة الرياض، يقدم تشكيلة من السيارات الجديدة والمستعملة مع ضمانات موثوقة وأسعار منافسة وخدمة ممتازة.'
  },
  {
    id: 'venue-120',
    name: 'معرض القمة للسيارات - الرياض',
    location: 'الرياض، حي النسيم، طريق خريص',
    thumbnail: '/logo.jpg',
    youtubeVideoId: 'jfKfPfyJRdk',
    viewersCount: 211,
    isLive: true,
    detailsUrl: '/auctions/auctions-1main/live-market',
    description: 'معرض متكامل في شرق الرياض، يتميز بتقديم مجموعة كبيرة من السيارات المتنوعة بخيارات تمويلية متعددة وعروض موسمية جذابة.'
  },
  
  // 5 معارض في جدة
  {
    id: 'venue-121',
    name: 'معرض سيارات النخبة - جدة',
    location: 'جدة، طريق الملك، حي الشاطئ',
    thumbnail: '/logo.jpg',
    youtubeVideoId: 'jfKfPfyJRdk',
    viewersCount: 312,
    isLive: true,
    detailsUrl: '/auctions/auctions-1main/live-market',
    description: 'من أكبر معارض السيارات في جدة، يوفر تشكيلة متنوعة من السيارات الجديدة والمستعملة بأسعار تنافسية وخدمة عملاء ممتازة.'
  },
  {
    id: 'venue-122',
    name: 'معرض السيارات اليابانية - جدة',
    location: 'جدة، حي المروة، طريق الملك فهد',
    thumbnail: '/logo.jpg',
    youtubeVideoId: 'jfKfPfyJRdk',
    viewersCount: 205,
    isLive: false,
    detailsUrl: '/auctions/auctions-1main/live-market',
    description: 'معرض متخصص في السيارات اليابانية الأصلية والمستوردة، يقدم موديلات حصرية من تويوتا ولكزس وهوندا ونيسان مع قطع غيار أصلية وخدمات صيانة.'
  },
  {
    id: 'venue-123',
    name: 'معرض الفخامة للسيارات - جدة',
    location: 'جدة، حي الرحاب، طريق الأمير ماجد',
    thumbnail: '/logo.jpg',
    youtubeVideoId: 'jfKfPfyJRdk',
    viewersCount: 257,
    isLive: true,
    detailsUrl: '/auctions/auctions-1main/live-market',
    description: 'معرض متخصص في السيارات الفاخرة والرياضية في مدينة جدة، يوفر تجربة شراء استثنائية مع مجموعة نخبوية من السيارات الفاخرة.'
  },
  {
    id: 'venue-124',
    name: 'معرض الأمير للسيارات - جدة',
    location: 'جدة، طريق المدينة، حي البوادي',
    thumbnail: '/logo.jpg',
    youtubeVideoId: 'jfKfPfyJRdk',
    viewersCount: 246,
    isLive: true,
    detailsUrl: '/auctions/auctions-1main/live-market',
    description: 'معرض عريق في مدينة جدة بخبرة أكثر من 20 عاماً، يقدم سيارات متنوعة مع باقات صيانة وضمان شاملة وتسهيلات تمويلية مرنة.'
  },
  {
    id: 'venue-125',
    name: 'معرض البلد للسيارات - جدة',
    location: 'جدة، حي البلد، شارع قابل',
    thumbnail: '/logo.jpg',
    youtubeVideoId: 'jfKfPfyJRdk',
    viewersCount: 167,
    isLive: false,
    detailsUrl: '/auctions/auctions-1main/live-market',
    description: 'معرض تاريخي في قلب جدة القديمة، يجمع بين العراقة والحداثة، ويقدم سيارات متنوعة تناسب مختلف الأذواق والميزانيات.'
  }
  // ... المزيد من المعارض
];

// أمثلة على السيارات المعروضة في هذا المعرض
const sampleCars = [
  {
    id: '1',
    make: 'مرسيدس',
    model: 'S500',
    year: 2023,
    current_price: 480000,
    min_price: 450000,
    max_price: 500000,
    image: '/logo.jpg',
    condition: 'ممتازة'
  },
  {
    id: '2',
    make: 'بي إم دبليو',
    model: 'X7',
    year: 2022,
    current_price: 420000,
    min_price: 380000,
    max_price: 450000,
    image: '/logo.jpg',
    condition: 'جيدة جداً'
  },
  {
    id: '3',
    make: 'لكزس',
    model: 'LX600',
    year: 2023,
    current_price: 520000,
    min_price: 500000,
    max_price: 550000,
    image: '/logo.jpg',
    condition: 'ممتازة'
  }
];

export default function VenueBroadcastPage({ params }: { params: { venueId: string } }) {
  const [venue, setVenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCar, setCurrentCar] = useState<any>(null);
  
  // إضافة متغير حالة جديد لتخزين عدد المشاهدين الحقيقي
  const [realViewersCount, setRealViewersCount] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // دالة لجلب عدد المشاهدين من API
  const fetchViewersCount = async () => {
    try {
      const response = await fetch(`/api/venues/${params.venueId}/viewers`);
      if (response.ok) {
        const data = await response.json();
        setRealViewersCount(data.viewers_count);
      }
    } catch (err) {
      console.error("Error fetching viewers count", err);
    }
  };

  // دالة لإرسال نبضة Ping لتحديث حالة المشاهد
  const pingVenue = async () => {
    try {
      const response = await fetch(`/api/venues/${params.venueId}/ping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session_id);
        setRealViewersCount(data.viewers_count);
      }
    } catch (err) {
      console.error("Error sending ping", err);
    }
  };

  useEffect(() => {
    // محاكاة جلب بيانات المعرض
    const fetchVenue = () => {
      setLoading(true);
      try {
        // البحث عن المعرض بالمعرف
        const foundVenue = venuesData.find(v => v.id === params.venueId);
        
        if (foundVenue) {
          setVenue(foundVenue);
          // تعيين السيارة الأولى كسيارة افتراضية
          if (sampleCars.length > 0) {
            setCurrentCar(sampleCars[0]);
          }
          
          // أول استدعاء للحصول على عدد المشاهدين وإنشاء جلسة
          pingVenue();
        } else {
          setError('لم يتم العثور على المعرض المطلوب');
        }
      } catch (err) {
        setError('حدث خطأ أثناء جلب بيانات المعرض');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVenue();
    
    // إعداد مؤقت لإرسال نبضات Ping دورية كل 30 ثانية
    const pingInterval = setInterval(() => {
      if (venue) {
        pingVenue();
      }
    }, 30000);
    
    // تنظيف المؤقت عند إزالة المكون
    return () => {
      clearInterval(pingInterval);
    };
  }, [params.venueId]);



  if (error || !venue) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">خطأ</h1>
          <p className="text-gray-700 mb-4">{error || 'لم يتم العثور على المعرض المطلوب'}</p>
          <LoadingLink 
            href="/broadcasts" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ChevronRight className="h-4 w-4 ml-1 rtl:rotate-180" />
            <span>العودة إلى صفحة البث</span>
          </LoadingLink>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 py-6">
      <div className="max-w-7xl mx-auto">
        {/* زر العودة منفرد في الجهة اليمنى والمشاهدين في منطقة متميزة */}
        <div className="flex justify-between items-center mb-4">
          <div></div> {/* عنصر فارغ للمحافظة على محاذاة العناصر */}
          <LoadingLink 
            href="/auctions/auctions-1main" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors px-3 py-1 text-sm rounded-full border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100"
          >
            <ChevronRight className="h-4 w-4 ml-1 rtl:rotate-180" />
            <span>العودة</span>
          </LoadingLink>
        </div>
        
        {/* إضافة قسم المشاهدين كعنصر منفصل في الأعلى مع عرض العدد الحقيقي */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6">
          <div className="flex items-center space-x-2 rtl:space-x-reverse bg-white/80 backdrop-blur-sm py-1 px-4 rounded-full shadow-sm border border-blue-100">
            <Users className="h-4 w-4 ml-1 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">{realViewersCount} مشاهد</span>
          </div>
        </div>
        
        {/* رأس الصفحة: معلومات المعرض */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{venue.name}</h1>
              <div className="flex items-center mt-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 ml-1 flex-shrink-0" />
                <span>{venue.location}</span>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <LoadingLink 
                href="/broadcasts"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <span className="text-sm">العودة إلى صفحة بث المعارض</span>
                <ExternalLink className="h-4 w-4 mr-1" />
              </LoadingLink>
            </div>
          </div>
          
          {venue.description && (
            <div className="mt-4 p-3 bg-blue-50 text-sm text-blue-800 rounded-md">
              <div className="flex">
                <Info className="h-5 w-5 ml-2 flex-shrink-0" />
                <p>{venue.description}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* القسم الرئيسي: البث المباشر والمعلومات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* العمود الأيمن - معلومات السيارة الحالية */}
          <div className="md:col-span-1 flex flex-col space-y-6">
            {/* معلومات السيارة */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-bold mb-4 border-b pb-2 text-center text-teal-800">السيارة الحالية في المزاد</h2>
              
              {currentCar ? (
                <div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-y-3 text-base">
                      <div><span className="font-semibold">الماركة:</span> {currentCar.make}</div>
                      <div><span className="font-semibold">الموديل:</span> {currentCar.model}</div>
                      <div><span className="font-semibold">السنة:</span> {currentCar.year}</div>
                      <div><span className="font-semibold">الحالة:</span> {currentCar.condition}</div>
                    </div>
                    
                    {/* قسم تفاصيل المشاهدين والسعر وتقديم العرض */}
                    <div className="mt-4 border rounded-lg bg-gray-50 p-4">
                      {/* آخر سعر */}
                      <div className="text-center mb-4">
                        <h3 className="font-semibold text-lg text-teal-800">آخر سعر</h3>
                        <div className="text-3xl font-bold text-teal-600 my-3 py-3 rounded-lg border-2 border-teal-200 bg-white">
                          {formatCurrency (currentCar.current_price)} ريال
                        </div>
                      </div>
                      
                      {/* زر تقديم العرض */}
                      <LoadingLink 
                        href={venue.detailsUrl}
                        className="block w-full bg-gradient-to-r from-teal-500 to-teal-700 text-white py-4 rounded-lg hover:from-teal-600 hover:to-teal-800 font-bold text-xl border-2 border-teal-700 shadow-lg transform hover:scale-105 transition-all duration-200 text-center"
                      >
                        قدم عرضك
                      </LoadingLink>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">لا توجد سيارة معروضة حاليًا في هذا المعرض</p>
                </div>
              )}
            </div>
          </div>

          {/* العمود الأوسط - البث المباشر والدردشة */}
          <div className="md:col-span-2 flex flex-col space-y-6">
            {/* مربع البث المباشر */}
            <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${venue.youtubeVideoId}?autoplay=1&mute=1&modestbranding=1&rel=0&showinfo=0&controls=1&enablejsapi=1&hl=ar`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                title={`بث مباشر - ${venue.name}`}
              ></iframe>
              
              {/* شارة البث المباشر */}
              {venue.isLive && (
                <div className="absolute top-4 left-4 px-2.5 py-1 bg-red-600 text-white text-xs font-bold rounded flex items-center">
                  <span className="h-2 w-2 bg-white rounded-full animate-pulse mr-1.5"></span>
                  مباشر
                </div>
              )}
            </div>
            
            {/* جدول السيارات المعروضة في المعرض */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 text-teal-800">سيارات متوفرة في {venue.name}</h2>
              
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
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اختيار</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sampleCars.map((car, index) => (
                      <tr key={car.id} className={`hover:bg-gray-50 ${currentCar?.id === car.id ? 'bg-blue-50' : ''}`}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{car.make}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{car.model}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{car.year}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatCurrency (car.min_price)} ريال</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatCurrency (car.max_price)} ريال</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-teal-600">{formatCurrency (car.current_price)} ريال</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600">
                          <button 
                            onClick={() => setCurrentCar(car)} 
                            className="hover:underline text-blue-600"
                          >
                            عرض
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* إضافة مكون الدردشة */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 text-teal-800">التواصل مع المعرض</h2>
              <p className="text-gray-600 mb-4">يمكنك طرح أسئلتك واستفساراتك حول السيارات المعروضة هنا</p>
              
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col space-y-4 border rounded-lg p-4 h-48 overflow-y-auto bg-gray-50">
                  <div className="self-start bg-gray-200 rounded-lg px-3 py-2 max-w-[75%]">
                    <p className="text-sm">مرحباً بكم في معرض {venue.name}! كيف يمكننا مساعدتك؟</p>
                    <span className="text-xs text-gray-500 mt-1 block">مدير المعرض • 10:15 ص</span>
                  </div>
                  <div className="self-end bg-blue-100 rounded-lg px-3 py-2 max-w-[75%]">
                    <p className="text-sm">هل لديكم سيارات رياضية موديل 2023؟</p>
                    <span className="text-xs text-gray-500 mt-1 block">أنت • الآن</span>
                  </div>
                </div>
                <div className="flex">
                  <input 
                    type="text" 
                    className="flex-grow border rounded-r-lg px-3 py-2 focus:outline-none focus:border-teal-500" 
                    placeholder="اكتب سؤالك هنا..."
                  />
                  <button className="bg-teal-600 text-white px-4 py-2 rounded-l-lg hover:bg-teal-700">
                    إرسال
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* روابط المعارض الأخرى */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">تصفح معارض أخرى</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {venuesData
              .filter(v => v.id !== venue.id)
              .slice(0, 4)
              .map(v => (
                <LoadingLink 
                  key={v.id}
                  href={`/broadcasts/${v.id}`}
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden flex-shrink-0 mr-3">
                    <div className="w-full h-full bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url('${v.thumbnail}')` }}></div>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{v.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{v.location}</p>
                  </div>
                </LoadingLink>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
} 
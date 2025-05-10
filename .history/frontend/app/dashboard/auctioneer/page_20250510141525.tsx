/**
 * 📝 واجهة المُحرّج (المنادي)
 * 📁 المسار: frontend/app/dashboard/auctioneer/page.tsx
 *
 * ✅ الوظيفة:
 * - عرض واجهة خاصة للمُحرّج في غرفة الكنترول
 * - عرض السيارة الحالية والمزايدات الواردة من الإنترنت
 * - توفير أدوات التحكم في المزاد (إنهاء المزاد، الانتقال للسيارة التالية، إلخ)
 * - عرض السيارات المقبلة في المزاد
 * - عرض إحصائيات المزاد المباشرة
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Eye, Users, Clock, AlertCircle, ThumbsUp, ThumbsDown, ChevronRight, ChevronLeft } from 'lucide-react';
import CurrentCar from './components/CurrentCar';
import OnlineBids from './components/OnlineBids';
import SpeechToText from './components/SpeechToText';
import UpcomingCars from './components/UpcomingCars';
import AuctionControls from './components/AuctionControls';
import LiveStats from './components/LiveStats';

// نوع بيانات السيارة
interface Car {
  id: number;
  title: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  color: string;
  vin: string;
  condition: string;
  images: string[];
  min_price: number;
  max_price: number;
  current_price: number;
  description: string;
  seller_id: number;
  seller_name?: string;
  status: 'pending' | 'active' | 'sold' | 'unsold';
  created_at: string;
}

// نوع بيانات المزايدة
interface Bid {
  id: string;
  car_id: number;
  bidder_id: number;
  bidder_name: string;
  amount: number;
  timestamp: string;
  is_online: boolean;
}

export default function AuctioneerPage() {
  const [currentCar, setCurrentCar] = useState<Car | null>(null);
  const [upcomingCars, setUpcomingCars] = useState<Car[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [viewerCount, setViewerCount] = useState<number>(0);
  const [bidderCount, setBidderCount] = useState<number>(0);
  const [auctionStatus, setAuctionStatus] = useState<'waiting' | 'active' | 'paused'>('waiting');
  const [transcribedText, setTranscribedText] = useState<string>('');
  
  // جلب بيانات السيارة الحالية وقائمة السيارات القادمة
  useEffect(() => {
    // في الحالة الحقيقية، سنستخدم طلب API
    // محاكاة السيارة الحالية
    const mockCurrentCar: Car = {
      id: 123,
      title: 'تويوتا كامري 2020 فل كامل',
      make: 'تويوتا',
      model: 'كامري',
      year: 2020,
      mileage: 35000,
      color: 'أبيض',
      vin: 'ABC123XYZ456789',
      condition: 'ممتاز',
      images: ['/images/cars/camry1.jpg', '/images/cars/camry2.jpg', '/images/cars/camry3.jpg'],
      min_price: 85000,
      max_price: 110000,
      current_price: 92000,
      description: 'تويوتا كامري 2020 قير أوتوماتيك، فل كامل، ماشي 35 ألف كم، ضمان وصيانة مجانية لدى الوكيل',
      seller_id: 45,
      seller_name: 'معرض الأمانة للسيارات',
      status: 'active',
      created_at: '2023-10-15T08:00:00Z'
    };
    
    // محاكاة قائمة السيارات القادمة
    const mockUpcomingCars: Car[] = [
      {
        id: 124,
        title: 'نيسان باترول 2022 بلاتينيوم',
        make: 'نيسان',
        model: 'باترول',
        year: 2022,
        mileage: 15000,
        color: 'أسود',
        vin: 'DEF456XYZ789012',
        condition: 'ممتاز',
        images: ['/images/cars/patrol1.jpg', '/images/cars/patrol2.jpg'],
        min_price: 280000,
        max_price: 320000,
        current_price: 0,
        description: 'نيسان باترول 2022 بلاتينيوم، نظيفة جداً، صبغة وكالة',
        seller_id: 48,
        seller_name: 'معرض النخبة للسيارات',
        status: 'pending',
        created_at: '2023-10-16T08:00:00Z'
      },
      {
        id: 125,
        title: 'مرسيدس E200 2019',
        make: 'مرسيدس',
        model: 'E200',
        year: 2019,
        mileage: 45000,
        color: 'رمادي',
        vin: 'GHI789XYZ012345',
        condition: 'جيد جداً',
        images: ['/images/cars/mercedes1.jpg', '/images/cars/mercedes2.jpg'],
        min_price: 150000,
        max_price: 180000,
        current_price: 0,
        description: 'مرسيدس E200 موديل 2019، أول مالك من الوكالة، فل الفل',
        seller_id: 52,
        seller_name: 'معرض الصفوة للسيارات',
        status: 'pending',
        created_at: '2023-10-16T09:00:00Z'
      },
      {
        id: 126,
        title: 'لكزس LX570 2021 بلاك اديشن',
        make: 'لكزس',
        model: 'LX570',
        year: 2021,
        mileage: 22000,
        color: 'أسود',
        vin: 'JKL012XYZ345678',
        condition: 'ممتاز',
        images: ['/images/cars/lexus1.jpg', '/images/cars/lexus2.jpg'],
        min_price: 420000,
        max_price: 470000,
        current_price: 0,
        description: 'لكزس LX570 2021 بلاك اديشن، كامل المواصفات، بدون حوادث',
        seller_id: 55,
        seller_name: 'معرض الفخامة للسيارات',
        status: 'pending',
        created_at: '2023-10-16T10:00:00Z'
      }
    ];
    
    // محاكاة البيانات
    setCurrentCar(mockCurrentCar);
    setUpcomingCars(mockUpcomingCars);
    setViewerCount(213);
    setBidderCount(42);
    setAuctionStatus('active');
    
    // محاكاة المزايدات
    const mockBids: Bid[] = [
      {
        id: 'b1',
        car_id: 123,
        bidder_id: 101,
        bidder_name: 'أحمد محمد',
        amount: 92000,
        timestamp: new Date(Date.now() - 30000).toISOString(),
        is_online: true
      },
      {
        id: 'b2',
        car_id: 123,
        bidder_id: 102,
        bidder_name: 'علي سعيد',
        amount: 91000,
        timestamp: new Date(Date.now() - 60000).toISOString(),
        is_online: false
      },
      {
        id: 'b3',
        car_id: 123,
        bidder_id: 103,
        bidder_name: 'فهد عبدالله',
        amount: 90000,
        timestamp: new Date(Date.now() - 90000).toISOString(),
        is_online: true
      }
    ];
    
    setBids(mockBids);
    
    // في الحالة الحقيقية، سنستخدم WebSocket للاتصال المباشر
    const bidInterval = setInterval(() => {
      const newBid: Bid = {
        id: `b${Date.now()}`,
        car_id: 123,
        bidder_id: 100 + Math.floor(Math.random() * 20),
        bidder_name: `مزايد ${Math.floor(Math.random() * 100)}`,
        amount: mockCurrentCar.current_price + (1000 * Math.floor(Math.random() * 3) + 1000),
        timestamp: new Date().toISOString(),
        is_online: Math.random() > 0.5
      };
      
      // تحديث السعر الحالي للسيارة إذا كان العرض الجديد أعلى
      if (newBid.amount > mockCurrentCar.current_price) {
        setCurrentCar(prevCar => prevCar ? { ...prevCar, current_price: newBid.amount } : null);
      }
      
      setBids(prev => [newBid, ...prev].slice(0, 20)); // الاحتفاظ بآخر 20 مزايدة فقط
    }, 15000); // كل 15 ثانية
    
    return () => clearInterval(bidInterval);
  }, []);
  
  // التعامل مع تغيير السيارة الحالية
  const handleNextCar = () => {
    if (upcomingCars.length > 0) {
      const nextCar = upcomingCars[0];
      setCurrentCar({ ...nextCar, status: 'active', current_price: nextCar.min_price });
      setUpcomingCars(prev => prev.slice(1));
      setBids([]);
      setAuctionStatus('active');
    }
  };
  
  // التعامل مع إنهاء المزاد الحالي
  const handleEndAuction = (sold: boolean) => {
    if (currentCar) {
      setCurrentCar(prev => prev ? { ...prev, status: sold ? 'sold' : 'unsold' } : null);
      setAuctionStatus('waiting');
      // في الحالة الحقيقية، سنرسل طلب API لتحديث حالة السيارة
    }
  };
  
  // التعامل مع إيقاف/تشغيل المزاد مؤقتًا
  const handleTogglePause = () => {
    setAuctionStatus(prev => prev === 'active' ? 'paused' : 'active');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* الشريط العلوي */}
      <header className="bg-gray-800 text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <h1 className="text-2xl font-bold">واجهة المُحرّج</h1>
            <div className={`h-3 w-3 rounded-full ${auctionStatus === 'active' ? 'bg-green-500 animate-pulse' : auctionStatus === 'paused' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
          </div>
          
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="flex items-center">
              <Eye className="h-5 w-5 mr-1.5" />
              <span>{viewerCount} مشاهد</span>
            </div>
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-1.5" />
              <span>{bidderCount} مزايد</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-1.5" />
              <span>05:34 مساءً</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* المحتوى الرئيسي */}
      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* العمود الأيمن: تفاصيل السيارة الحالية + أزرار التحكم */}
          <div className="lg:col-span-1 space-y-6">
            {/* السيارة الحالية */}
            <CurrentCar car={currentCar} />
            
            {/* أزرار التحكم */}
            <AuctionControls 
              auctionStatus={auctionStatus}
              onNextCar={handleNextCar}
              onEndAuction={handleEndAuction}
              onTogglePause={handleTogglePause}
            />
            
            {/* الإحصائيات المباشرة */}
            <LiveStats
              viewerCount={viewerCount}
              bidderCount={bidderCount}
              highestBid={currentCar?.current_price || 0}
              bidCount={bids.length}
            />
          </div>
          
          {/* العمود الأوسط: المزايدات الواردة + تحويل الصوت إلى نص */}
          <div className="lg:col-span-1 space-y-6">
            {/* المزايدات الواردة */}
            <OnlineBids bids={bids} />
            
            {/* تحويل الصوت إلى نص */}
            <SpeechToText 
              onTranscriptionChange={setTranscribedText} 
              isActive={auctionStatus === 'active'}
            />
            
            {/* النص المحول (للعرض على شاشة المزاد) */}
            {transcribedText && (
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-lg font-bold text-gray-800 mb-2">النص المعروض على الشاشة:</h2>
                <div className="bg-gray-100 p-3 rounded border border-gray-300 text-xl font-bold text-center">
                  {transcribedText}
                </div>
              </div>
            )}
          </div>
          
          {/* العمود الأيسر: السيارات القادمة */}
          <div className="lg:col-span-1">
            <UpcomingCars cars={upcomingCars} />
          </div>
        </div>
      </main>
    </div>
  );
} 
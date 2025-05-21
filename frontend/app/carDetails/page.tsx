/**
 * ==================================================
 * ملف: frontend/app/carDetails/page.tsx
 * الغرض: صفحة عرض تفاصيل السيارة/الشاحنة/الحافلة
 * الارتباطات: 
 *  - يستخدم مكون BidForm لتقديم المزايدات
 *  - يستخدم مكون CarDataEntryButton لإضافة سيارة جديدة
 *  - يعرض معرض الصور بشكل جذاب للمركبة
 * ==================================================
 */

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BidForm from '@/components/BidForm';
import CarDataEntryButton from '@/components/CarDataEntryButton';
import Link from 'next/link';

// Loading component to show while the main content is loading
function CarDetailsLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl">جاري تحميل البيانات...</div>
    </div>
  );
}

// Main content component that uses useSearchParams
function CarDetailsContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  
  // جلب بيانات السيارة/الشاحنة/الحافلة
  useEffect(() => {
    if (!id) {
      setError('معرف المركبة غير موجود');
      setLoading(false);
      return;
    }
    
    fetch(`/api/items?id=${id}`)
      .then(res => {
        if (!res.ok) throw new Error('فشل في جلب البيانات');
        return res.json();
      })
      .then(data => {
        setItem(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('خطأ في جلب بيانات المركبة:', err);
        setError('حدث خطأ أثناء جلب بيانات المركبة');
        setLoading(false);
      });
  }, [id]);
  
  // تحديث البيانات بعد نجاح المزايدة
  const refreshData = () => {
    if (id) {
      setLoading(true);
      fetch(`/api/items?id=${id}`)
        .then(res => res.json())
        .then(data => {
          setItem(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">جاري تحميل البيانات...</div>
      </div>
    );
  }
  
  if (error || !item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-xl text-red-600 mb-4">{error || 'معرف المركبة غير موجود'}</div>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <Link href="/auctions" className="text-blue-600 hover:underline">
            العودة إلى المزادات
          </Link>
          <div className="my-4 text-gray-500">أو</div>
          <CarDataEntryButton label="إدخال بيانات سيارتك" variant="primary" />
        </div>
        <div className="mt-6 max-w-lg text-center text-gray-600">
          <p>يمكنك إدخال بيانات سيارتك وإضافة صورها وتقارير فحصها من خلال النموذج المخصص</p>
        </div>
      </div>
    );
  }
  
  // تحضير قائمة الصور
  const images = (() => {
    try {
      const parsedImages = JSON.parse(item.images || '[]');
      return Array.isArray(parsedImages) ? parsedImages : [];
    } catch {
      return [];
    }
  })();
  
  // إضافة صور حافلات وشاحنات إضافية إذا لم تكن هناك صور كافية
  if (images.length < 4) {
    const additionalImages = [
      '/auctionsPIC/car-busesTrucksPIC/bus-1.jpg',
      '/auctionsPIC/car-busesTrucksPIC/bus-2.jpg',
      '/auctionsPIC/car-busesTrucksPIC/bus-3.jpg',
      '/auctionsPIC/car-busesTrucksPIC/bus-4.jpg',
      '/auctionsPIC/car-busesTrucksPIC/truck-1.jpg',
      '/auctionsPIC/car-busesTrucksPIC/truck-2.jpg',
      '/auctionsPIC/car-busesTrucksPIC/truck-3.jpg',
      '/auctionsPIC/car-busesTrucksPIC/truck-4.jpg'
    ];
    
    // إضافة صور حتى يصبح لدينا ما لا يقل عن 4 صور
    for (let i = 0; i < additionalImages.length && images.length < 4; i++) {
      if (!images.includes(additionalImages[i])) {
        images.push(additionalImages[i]);
      }
    }
  }
  
  // الصورة الحالية المختارة
  const currentImage = images[selectedImageIndex];
  
  // وظائف التنقل بين الصور
  const goToPreviousImage = () => {
    setSelectedImageIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };
  
  const goToNextImage = () => {
    setSelectedImageIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      {/* نافذة عرض الصور المكبرة */}
      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative w-full max-w-4xl mx-auto">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowImageModal(false); }}
              className="absolute top-0 right-0 m-4 text-white text-2xl z-10 hover:text-gray-300"
            >
              ✖
            </button>
            <img 
              src={currentImage} 
              alt={item.title} 
              className="max-w-full max-h-[80vh] mx-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-car.jpg';
              }}
            />
            <div className="absolute inset-x-0 bottom-4 flex justify-center space-x-2 rtl:space-x-reverse">
              {images.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(idx); }}
                  className={`w-3 h-3 rounded-full ${idx === selectedImageIndex ? 'bg-white' : 'bg-gray-400'}`}
                  aria-label={`عرض الصورة ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* زر العودة */}
        <div className="mb-4">
          <Link 
            href="/auctions/auctions-2car/busesTrucks" 
            className="text-blue-600 hover:underline inline-flex items-center rtl:space-x-reverse"
          >
            <span className="ml-1">←</span>
            <span>العودة إلى صفحة المزادات</span>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">{item.title}</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* قسم معرض الصور */}
              <div className="order-2 lg:order-1">
                {/* الصورة الرئيسية */}
                <div 
                  className="bg-gray-100 rounded-lg overflow-hidden relative cursor-pointer"
                  onClick={() => setShowImageModal(true)}
                >
                  <img 
                    src={currentImage} 
                    alt={item.title} 
                    className="w-full h-96 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-car.jpg';
                    }}
                  />
                  
                  {/* أزرار التنقل بين الصور */}
                  {images.length > 1 && (
                    <>
                      <button 
                        onClick={(e) => { e.stopPropagation(); goToPreviousImage(); }}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-opacity-70"
                        aria-label="الصورة السابقة"
                      >
                        &lt;
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); goToNextImage(); }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-opacity-70"
                        aria-label="الصورة التالية"
                      >
                        &gt;
                      </button>
                    </>
                  )}
                </div>
                
                {/* شريط الصور المصغرة */}
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {images.map((img, idx) => (
                    <div 
                      key={idx}
                      className={`cursor-pointer border-2 rounded-md overflow-hidden ${idx === selectedImageIndex ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200 hover:border-gray-300'}`}
                      onClick={() => setSelectedImageIndex(idx)}
                    >
                      <img 
                        src={img} 
                        alt={`صورة ${idx + 1}`} 
                        className="w-full h-16 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-car.jpg';
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* معلومات السعر للشاشات الصغيرة */}
                <div className="mt-6 block lg:hidden">
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-2xl font-bold text-blue-600">
                      السعر الحالي: {item.current_price?.toLocaleString()} ريال
                    </p>
                    {item.auction_result && (
                      <p className="text-lg text-green-600 mt-2">{item.auction_result}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* تفاصيل المركبة */}
              <div className="order-1 lg:order-2">
                {/* معلومات السعر للشاشات الكبيرة */}
                <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200 hidden lg:block">
                  <p className="text-2xl font-bold text-blue-600">
                    السعر الحالي: {item.current_price?.toLocaleString()} ريال
                  </p>
                  {item.auction_result && (
                    <p className="text-lg text-green-600 mt-2">{item.auction_result}</p>
                  )}
                </div>
                
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">وصف المركبة</h2>
                  <p className="text-gray-700">{item.description}</p>
                </div>
                
                {item.inspection_report && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">تقرير الفحص</h2>
                    <p className="text-gray-700">{item.inspection_report}</p>
                  </div>
                )}
                
                {/* نموذج المزايدة */}
                <div className="mt-8">
                  <BidForm 
                    itemId={parseInt(id!)} 
                    currentPrice={item.current_price} 
                    onSuccess={refreshData}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export the main component with Suspense boundary
export default function CarDetails() {
  return (
    <Suspense fallback={<CarDetailsLoading />}>
      <CarDetailsContent />
    </Suspense>
  );
}

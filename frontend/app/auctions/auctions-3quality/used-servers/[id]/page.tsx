/**
 * 📝 الصفحة: تفاصيل السيرفر المستعمل
 * 📁 المسار: Frontend-local/app/auctions/auctions-quality/used-servers/[id]/page.tsx
 * 
 * ✅ الوظيفة:
 * - عرض تفاصيل السيرفر المستعمل المختار
 * - عرض صور متعددة للسيرفر
 * - عرض المواصفات والسعر وبيانات الاتصال
 * - إمكانية تنزيل ملف PDF للتقرير الفني إن وجد
 * 
 * 🔄 الارتباطات:
 * - يتم الوصول إليها من: صفحة قائمة السيرفرات المستعملة (/auctions/auctions-quality/used-servers)
 * - تعود إلى: صفحة قائمة السيرفرات المستعملة
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  Clipboard, 
  Download, 
  FileText, 
  FileWarning, 
  Info, 
  Monitor, 
  Phone, 
  Server, 
  Tag, 
  ShoppingCart 
} from 'lucide-react';

interface ServerDetails {
  id: number;
  name: string;
  description: string;
  specs: string;
  price: number;
  condition: string;
  images: string[];
  pdf_report: string;
  created_at: string;
}

export default function ServerDetailsPage() {
  const params = useParams();
  const router = useLoadingRouter();
  
  const [server, setServer] = useState<ServerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // ترجمة حالة السيرفر
  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'new': return 'جديد';
      case 'excellent': return 'مستعمل ممتاز';
      case 'good': return 'مستعمل مقبول';
      default: return condition;
    }
  };

  // جلب تفاصيل السيرفر
  useEffect(() => {
    const fetchServerDetails = async () => {
      setIsLoading(true);
      try {
        // استدعاء API لجلب تفاصيل السيرفر المحدد
        const response = await fetch(`/api/products/${params.id}`);
        
        if (!response.ok) {
          throw new Error('فشل في جلب بيانات السيرفر');
        }
        
        const data = await response.json();
        
        // معالجة البيانات
        const serverData = {
          ...data.product,
          // تحويل سلسلة JSON إلى مصفوفة إذا كانت الصور مخزنة كسلسلة
          images: typeof data.product.images === 'string' ? JSON.parse(data.product.images) : data.product.images
        };
        
        setServer(serverData);
      } catch (err) {
        console.error("خطأ في جلب البيانات:", err);
        setError('حدث خطأ أثناء تحميل بيانات السيرفر. يرجى المحاولة مرة أخرى.');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchServerDetails();
    }
  }, [params.id]);

  // التغيير إلى الصورة التالية
  const nextImage = () => {
    if (server && server.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === server.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  // التغيير إلى الصورة السابقة
  const prevImage = () => {
    if (server && server.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? server.images.length - 1 : prevIndex - 1
      );
    }
  };

  // تنسيق تاريخ الإضافة
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg text-gray-600">جاري تحميل تفاصيل السيرفر...</p>
        </div>
      </div>
    );
  }

  if (error || !server) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <div className="text-center py-8">
            <FileWarning size={64} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {error || 'لم يتم العثور على السيرفر المطلوب'}
            </h2>
            <p className="text-gray-600 mb-6">
              قد يكون هذا السيرفر غير موجود أو تم إزالته
            </p>
            <Link 
              href="/auctions/auctions-quality/used-servers" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
            >
              العودة إلى قائمة السيرفرات
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 py-6">
        <div className="container mx-auto px-4">
          <Link 
            href="/auctions/auctions-quality/used-servers" 
            className="flex items-center text-white hover:text-white/90 transition mb-4"
          >
            <ArrowLeft size={20} className="ml-2" />
            <span>العودة إلى قائمة السيرفرات</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">{server.name}</h1>
          <div className="flex items-center text-white/80 mt-2">
            <Calendar className="ml-2" size={16} />
            <span>تم الإضافة: {formatDate(server.created_at)}</span>
          </div>
        </div>
      </div>

      {/* محتوى الصفحة */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
            {/* صور السيرفر */}
            <div className="order-2 lg:order-1">
              {server.images && server.images.length > 0 ? (
                <div className="space-y-4">
                  <div className="relative h-80 bg-gray-100 rounded-lg overflow-hidden">
                    <Image 
                      src={server.images[currentImageIndex]} 
                      alt={`${server.name} - صورة ${currentImageIndex + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain"
                    />
                    
                    {/* أزرار التنقل بين الصور */}
                    {server.images.length > 1 && (
                      <>
                        <button 
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition z-10"
                          aria-label="الصورة السابقة"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-180"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </button>
                        <button 
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition z-10"
                          aria-label="الصورة التالية"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* مصغرات الصور */}
                  {server.images.length > 1 && (
                    <div className="flex overflow-x-auto gap-2 pb-2">
                      {server.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`relative h-16 w-16 flex-shrink-0 rounded overflow-hidden border-2 ${
                            currentImageIndex === index ? 'border-blue-600' : 'border-transparent'
                          }`}
                        >
                          <Image 
                            src={image} 
                            alt={`مصغرة ${index + 1}`}
                            fill 
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Server size={80} className="text-gray-300" />
                </div>
              )}
              
              {/* تقرير PDF */}
              {server.pdf_report && (
                <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-800 mb-2 flex items-center">
                    <FileText className="ml-2 text-blue-600" size={20} />
                    تقرير فني للسيرفر
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    يمكنك تنزيل التقرير الفني أو شهادة الضمان من الرابط أدناه
                  </p>
                  <a 
                    href={server.pdf_report} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-700 hover:text-blue-800 font-medium"
                  >
                    <Download size={16} className="ml-1" />
                    تنزيل التقرير
                  </a>
                </div>
              )}
            </div>
            
            {/* تفاصيل السيرفر */}
            <div className="order-1 lg:order-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Server className="text-blue-600 ml-2" size={24} />
                  <h2 className="text-2xl font-bold text-gray-800">تفاصيل السيرفر</h2>
                </div>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {getConditionLabel(server.condition)}
                </span>
              </div>
              
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-2">الوصف</h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {server.description}
                </p>
              </div>
              
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-2 flex items-center">
                  <Monitor className="ml-2 text-blue-600" size={18} />
                  المواصفات التقنية
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <pre className="text-gray-700 whitespace-pre-line font-mono text-sm">
                    {server.specs}
                  </pre>
                </div>
              </div>
              
              <div className="bg-blue-600 text-white p-4 rounded-lg mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-lg">السعر:</span>
                  <span className="text-2xl font-bold">{server.price.toLocaleString()} ريال</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <button className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition flex items-center justify-center">
                  <ShoppingCart className="ml-2" size={18} />
                  <span>طلب شراء</span>
                </button>
                <button className="bg-blue-100 hover:bg-blue-200 text-blue-800 py-3 px-4 rounded-lg transition flex items-center justify-center">
                  <Phone className="ml-2" size={18} />
                  <span>طلب استفسار</span>
                </button>
              </div>
              
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg">
                <h3 className="font-bold text-amber-800 mb-2 flex items-center">
                  <Info className="ml-2 text-amber-600" size={18} />
                  معلومات هامة
                </h3>
                <ul className="text-amber-700 text-sm space-y-2">
                  <li className="flex items-start">
                    <span className="inline-block h-5 w-5 rounded-full bg-amber-200 text-amber-800 text-center flex-shrink-0 ml-2">1</span>
                    <span>الضمان على السيرفر حسب الحالة المذكورة</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block h-5 w-5 rounded-full bg-amber-200 text-amber-800 text-center flex-shrink-0 ml-2">2</span>
                    <span>يُنصَح بفحص السيرفر قبل الشراء</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block h-5 w-5 rounded-full bg-amber-200 text-amber-800 text-center flex-shrink-0 ml-2">3</span>
                    <span>يمكن طلب معاينة السيرفر قبل الشراء</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* زر العودة للخلف */}
        <div className="mt-8 text-center">
          <Link 
            href="/auctions/auctions-quality/used-servers" 
            className="inline-flex items-center text-blue-700 hover:text-blue-800"
          >
            <ArrowLeft size={16} className="ml-1" />
            <span>العودة إلى قائمة السيرفرات</span>
          </Link>
        </div>
      </div>
    </div>
  );
} 
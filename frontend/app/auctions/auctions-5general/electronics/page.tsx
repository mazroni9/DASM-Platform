'use client';

import React, { useState, useEffect } from 'react';
import LoadingLink from "@/components/LoadingLink";
import { ChevronRight, Smartphone, Laptop, Camera, Tv, Speaker, Tablet, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

export default function ElectronicsMarketPage() {
  // حالات للتحكم بتحميل البيانات وعرضها
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  
  // تحميل المنتجات عند فتح الصفحة
  useEffect(() => {
    const fetchElectronicsProducts = async () => {
      try {
        setIsLoading(true);
        
        // استدعاء منتجات الإلكترونيات من API
        const response = await fetch('/api/items?category=electronics&limit=8&sort=newest');
        
        if (!response.ok) {
          throw new Error('Failed to fetch electronics products');
        }
        
        const data = await response.json();
        setFeaturedProducts(data || []);
      } catch (err) {
        console.error('Error fetching electronics products:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchElectronicsProducts();
  }, []);

  const categories = [
    { title: "هواتف ذكية", icon: Smartphone, count: 64 },
    { title: "حواسيب محمولة", icon: Laptop, count: 48 },
    { title: "كاميرات", icon: Camera, count: 27 },
    { title: "أجهزة تلفاز", icon: Tv, count: 32 },
    { title: "أجهزة صوت", icon: Speaker, count: 45 },
    { title: "أجهزة لوحية", icon: Tablet, count: 29 }
  ];

  // المميزات الخاصة بسوق الإلكترونيات
  const features = [
    {
      title: "ضمان الأجهزة",
      description: "جميع الأجهزة مفحوصة وتأتي مع ضمان لمدة شهر ضد عيوب المصنع"
    },
    {
      title: "إمكانية التجربة",
      description: "يمكنك تجربة الجهاز قبل الشراء للتأكد من حالته وأدائه"
    },
    {
      title: "خصوصية البيانات",
      description: "نضمن مسح جميع البيانات الشخصية من الأجهزة قبل إعادة بيعها"
    }
  ];

  // دالة لاستخراج معلومات إضافية من JSON
  const extractAdditionalInfo = (product) => {
    try {
      const additionalInfo = product.additional_info 
        ? (typeof product.additional_info === 'string' 
            ? JSON.parse(product.additional_info) 
            : product.additional_info)
        : {};
        
      return {
        deviceType: additionalInfo.deviceType || '',
        brand: additionalInfo.brand || '',
        model: additionalInfo.model || '',
        specs: additionalInfo.specs || '',
        storage: additionalInfo.storage || '',
        productionYear: additionalInfo.productionYear || '',
      };
    } catch (err) {
      console.error('Error parsing additional info:', err);
      return {};
    }
  };

  // دالة لتنسيق عرض الصورة
  const getItemImage = (product) => {
    if (product.images && product.images.length > 0) {
      return `/uploads/${product.images[0]}`;
    }
    return '/placeholder/electronics.jpg'; // صورة بديلة في حال عدم وجود صورة
  };

  return (
    <div className="container mx-auto p-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <LoadingLink 
          href="/auctions/auctions-5general" 
          className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors px-4 py-2 rounded-full border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100 rtl:flex-row-reverse"
        >
          <ArrowLeft className="h-4 w-4 ltr:mr-1 rtl:ml-1 rtl:rotate-180" />
          <span>العودة إلى الأسواق العامة</span>
        </LoadingLink>
        
        <h1 className="text-3xl font-bold text-center text-blue-700">سوق الأجهزة الإلكترونية</h1>
        
        <div className="bg-white border-r-4 border-blue-500 rounded-lg shadow-sm px-3 py-1.5 flex items-center">
          <div className="text-sm font-medium text-gray-800">
            أجهزة مستعملة بضمان
          </div>
        </div>
      </div>
      
      {/* البانر الرئيسي */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg overflow-hidden mb-10">
        <div className="p-8 text-white">
          <h2 className="text-3xl font-bold mb-3">أجهزة إلكترونية حديثة بأسعار معقولة</h2>
          <p className="text-xl opacity-90 mb-6">
            نقدم مجموعة متنوعة من الأجهزة الإلكترونية المستعملة والمجددة بضمان وجودة عالية
          </p>
          <div className="flex flex-wrap gap-3">
            {features.map((feature, index) => (
              <div key={index} className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-white">{feature.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* تصنيفات المنتجات */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        {categories.map((category, index) => (
          <div 
            key={index}
            className="bg-white rounded-lg shadow-md hover:shadow-lg p-5 text-center transition-all hover:-translate-y-1 border border-gray-100"
          >
            <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-3">
              <category.icon size={24} />
            </div>
            <h3 className="font-medium text-gray-800">{category.title}</h3>
            <p className="text-gray-500 text-sm">{category.count} جهاز</p>
          </div>
        ))}
      </div>
      
      {/* المنتجات المميزة */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6 border-b pb-2">الأجهزة المميزة</h2>
        

        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
            حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.
          </div>
        )}
        
        {!isLoading && !error && featuredProducts.length === 0 && (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <p className="text-gray-500">لا توجد منتجات متاحة حالياً. يرجى التحقق لاحقاً.</p>
            <LoadingLink 
              href="/forms/electronics-auction-request" 
              className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              إضافة أول جهاز إلكتروني
            </LoadingLink>
          </div>
        )}
        
        {!isLoading && !error && featuredProducts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => {
              const additionalInfo = extractAdditionalInfo(product);
              return (
                <div 
                  key={product.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg overflow-hidden transition-transform hover:-translate-y-1 border border-gray-100"
                >
                  <div className="h-48 bg-gray-200 relative">
                    <Image 
                      src={getItemImage(product)}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-lg">{product.title}</h3>
                      <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {additionalInfo.deviceType || "إلكترونيات"}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                    {additionalInfo.brand && (
                      <p className="text-gray-500 text-xs mb-2">
                        <span className="font-medium">الماركة:</span> {additionalInfo.brand}
                      </p>
                    )}
                    {additionalInfo.specs && (
                      <p className="text-gray-500 text-xs mb-2">
                        <span className="font-medium">المواصفات:</span> {additionalInfo.specs}
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xl font-bold text-blue-600">{product.current_price} ريال</span>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        الحالة: {product.condition || "مستعمل"}
                      </span>
                    </div>
                    <LoadingLink 
                      href={`/auctions/auctions-5general/electronics/${product.id}`}
                      className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors block text-center"
                    >
                      عرض التفاصيل
                    </LoadingLink>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="mt-6 text-center">
          <LoadingLink 
            href="/auctions/auctions-5general/electronics/all"
            className="px-6 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg transition inline-block"
          >
            عرض المزيد من الأجهزة
          </LoadingLink>
        </div>
      </div>
      
      {/* مميزات الأجهزة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {features.map((feature, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6 border-t-4 border-blue-400">
            <h3 className="font-bold text-lg mb-2 text-blue-700">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>
      
      {/* بيع الأجهزة */}
      <div className="bg-blue-50 rounded-xl shadow-md p-8 border-r-4 border-blue-500 mb-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-center">هل لديك أجهزة إلكترونية ترغب في بيعها؟</h2>
          <p className="text-gray-600 mb-6 text-center">
            يمكنك الآن بيع أجهزتك الإلكترونية التي لم تعد بحاجة لها بكل سهولة. نوفر لك منصة آمنة وندعمك في عملية البيع من البداية إلى النهاية.
          </p>
          <div className="flex justify-center">
            <LoadingLink
              href="/forms/electronics-auction-request"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
            >
              بيع جهازك الآن
            </LoadingLink>
          </div>
        </div>
      </div>
      
      {/* الأسئلة الشائعة */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-6 border-b pb-2">الأسئلة الشائعة</h2>
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h3 className="font-bold text-lg mb-2">كيف أتأكد من حالة الجهاز قبل الشراء؟</h3>
            <p className="text-gray-600">
              نوفر تقرير فحص تفصيلي لكل جهاز، يشمل اختبارات الأداء ونسبة صحة البطارية وحالة الشاشة. كما يمكنك طلب تجربة الجهاز قبل الشراء للتأكد من حالته.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h3 className="font-bold text-lg mb-2">هل تقدمون ضمانًا على الأجهزة المستعملة؟</h3>
            <p className="text-gray-600">
              نعم، جميع الأجهزة الإلكترونية تأتي مع ضمان لمدة شهر ضد عيوب المصنع. يمكن أيضًا شراء ضمان إضافي لبعض الأجهزة مقابل رسوم إضافية.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h3 className="font-bold text-lg mb-2">كيف تضمنون خصوصية بياناتي عند بيع جهازي؟</h3>
            <p className="text-gray-600">
              نستخدم برامج متطورة لمسح البيانات بشكل آمن من جميع الأجهزة، ونقدم شهادة حذف البيانات مع كل جهاز. يمكنك أيضًا حضور عملية إعادة ضبط المصنع للجهاز.
            </p>
          </div>
        </div>
      </div>
      
      {/* نصائح للمشترين */}
      <div className="mt-10 bg-blue-50 p-6 rounded-xl border border-blue-200">
        <h2 className="text-xl font-bold mb-4 text-blue-800">نصائح عند شراء الأجهزة الإلكترونية المستعملة</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>تحقق من عمر الجهاز وتاريخ إصداره قبل الشراء</li>
          <li>اطلب الاطلاع على تقرير حالة البطارية للأجهزة المحمولة</li>
          <li>اسأل عن حالة الضمان الأصلي للمنتج</li>
          <li>تأكد من توفر جميع الملحقات الأساسية مع الجهاز</li>
          <li>اختبر جميع وظائف الجهاز الأساسية أثناء المعاينة</li>
        </ul>
      </div>
    </div>
  );
} 
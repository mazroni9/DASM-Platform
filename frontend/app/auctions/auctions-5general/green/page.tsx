'use client';

import React, { useState, useEffect } from 'react';
import LoadingLink from "@/components/LoadingLink";
import { ChevronRight, Leaf, Recycle, Flower, Sun, Wind, Droplets } from 'lucide-react';
import Image from 'next/image';

export default function GreenMarketPage() {
  // حالات للتحكم بتحميل البيانات وعرضها
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  
  // تحميل المنتجات عند فتح الصفحة
  useEffect(() => {
    const fetchGreenProducts = async () => {
      try {
        setIsLoading(true);
        
        // استدعاء منتجات الخضراء من API
        const response = await fetch('/api/items?category=green&limit=8&sort=newest');
        
        if (!response.ok) {
          throw new Error('Failed to fetch green products');
        }
        
        const data = await response.json();
        setFeaturedProducts(data || []);
      } catch (err) {
        console.error('Error fetching green products:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGreenProducts();
  }, []);

  const categories = [
    { title: "طاقة متجددة", icon: Sun, count: 28 },
    { title: "منتجات معاد تدويرها", icon: Recycle, count: 36 },
    { title: "الزراعة العضوية", icon: Flower, count: 42 },
    { title: "توفير المياه", icon: Droplets, count: 24 },
    { title: "تنقل أخضر", icon: Wind, count: 19 },
    { title: "منتجات طبيعية", icon: Leaf, count: 31 }
  ];

  // المميزات الخاصة بسوق المنتجات الخضراء
  const features = [
    {
      title: "صديقة للبيئة",
      description: "منتجات مستدامة تقلل من البصمة الكربونية وتحافظ على الموارد الطبيعية"
    },
    {
      title: "موفرة للطاقة",
      description: "تساعد على تقليل استهلاك الطاقة وخفض فواتير الكهرباء والمياه"
    },
    {
      title: "معتمدة بيئيًا",
      description: "منتجات مفحوصة ومعتمدة من جهات متخصصة في المعايير البيئية"
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
        ecoCert: additionalInfo.ecoCert || '',
        energySaving: additionalInfo.energySaving || '',
        productType: additionalInfo.productType || '',
        origin: additionalInfo.origin || '',
        materials: additionalInfo.materials || '',
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
    return '/placeholder/green.jpg'; // صورة بديلة في حال عدم وجود صورة
  };

  return (
    <div className="container mx-auto p-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <LoadingLink 
          href="/auctions/auctions-5general" 
          className="inline-flex items-center text-green-600 hover:text-green-700 transition-colors px-4 py-2 rounded-full border border-green-200 hover:border-green-300 bg-green-50 hover:bg-green-100 rtl:flex-row-reverse"
        >
          <ChevronRight className="h-4 w-4 ltr:mr-1 rtl:ml-1 rtl:rotate-180" />
          <span>العودة</span>
        </LoadingLink>
        
        <h1 className="text-3xl font-bold text-center text-green-700">سوق المنتجات الخضراء</h1>
        
        <div className="bg-white border-r-4 border-green-500 rounded-lg shadow-sm px-3 py-1.5 flex items-center">
          <div className="text-sm font-medium text-gray-800">
            منتجات صديقة للبيئة
          </div>
        </div>
      </div>
      
      {/* البانر الرئيسي */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg overflow-hidden mb-10">
        <div className="p-8 text-white">
          <h2 className="text-3xl font-bold mb-3">منتجات مستدامة لحياة أكثر خضرة</h2>
          <p className="text-xl opacity-90 mb-6">
            مجموعة متنوعة من المنتجات الصديقة للبيئة التي تساعد على تقليل التأثير البيئي وتوفير الطاقة والموارد
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
            <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-600 mb-3">
              <category.icon size={24} />
            </div>
            <h3 className="font-medium text-gray-800">{category.title}</h3>
            <p className="text-gray-500 text-sm">{category.count} منتج</p>
          </div>
        ))}
      </div>
      
      {/* المنتجات المميزة */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6 border-b pb-2">المنتجات المميزة</h2>
        
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
            حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.
          </div>
        )}
        
        {!isLoading && !error && featuredProducts.length === 0 && (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <p className="text-gray-500">لا توجد منتجات متاحة حالياً. يرجى التحقق لاحقاً.</p>
            <LoadingLink 
              href="/forms/green-auction-request" 
              className="mt-4 inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              إضافة أول منتج أخضر
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
                      <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {additionalInfo.productType || "منتج أخضر"}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                    {additionalInfo.ecoCert && (
                      <p className="text-gray-500 text-xs mb-2">
                        <span className="font-medium">الشهادة البيئية:</span> {additionalInfo.ecoCert}
                      </p>
                    )}
                    {additionalInfo.energySaving && (
                      <p className="text-gray-500 text-xs mb-2">
                        <span className="font-medium">توفير الطاقة:</span> {additionalInfo.energySaving}
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xl font-bold text-green-600">{product.current_price} ريال</span>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        الحالة: {product.condition || "مستعمل"}
                      </span>
                    </div>
                    <LoadingLink 
                      href={`/auctions/auctions-5general/green/${product.id}`}
                      className="mt-4 w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors block text-center"
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
            href="/auctions/auctions-5general/green/all"
            className="px-6 py-2 border border-green-600 text-green-600 hover:bg-green-50 rounded-lg transition inline-block"
          >
            عرض المزيد من المنتجات الخضراء
          </LoadingLink>
        </div>
      </div>
      
      {/* مميزات المنتجات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {features.map((feature, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6 border-t-4 border-green-400">
            <h3 className="font-bold text-lg mb-2 text-green-700">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>
      
      {/* بيع المنتجات */}
      <div className="bg-green-50 rounded-xl shadow-md p-8 border-r-4 border-green-500 mb-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-center">هل لديك منتجات صديقة للبيئة ترغب في بيعها؟</h2>
          <p className="text-gray-600 mb-6 text-center">
            يمكنك المساهمة في نشر ثقافة الاستدامة من خلال بيع منتجاتك الخضراء ووصولها لمن يبحث عن أسلوب حياة صديق للبيئة.
          </p>
          <div className="flex justify-center">
            <LoadingLink
              href="/forms/green-auction-request"
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
            >
              بيع منتجاتك الخضراء
            </LoadingLink>
          </div>
        </div>
      </div>
      
      {/* الأسئلة الشائعة */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-6 border-b pb-2">الأسئلة الشائعة</h2>
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h3 className="font-bold text-lg mb-2">كيف أتأكد من المعايير البيئية للمنتجات؟</h3>
            <p className="text-gray-600">
              جميع المنتجات في سوق المنتجات الخضراء تخضع لتقييم بيئي وتحمل شهادات معتمدة. يمكنك الاطلاع على تفاصيل الشهادات البيئية في صفحة كل منتج.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h3 className="font-bold text-lg mb-2">هل المنتجات المستعملة تعتبر خضراء؟</h3>
            <p className="text-gray-600">
              نعم، إعادة استخدام المنتجات يعتبر من أهم ممارسات الاستدامة. المنتجات المستعملة تقلل من استهلاك الموارد وتقليل النفايات، مما يجعلها خيارًا صديقًا للبيئة.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h3 className="font-bold text-lg mb-2">هل تقدمون خدمات تركيب للأنظمة الخضراء؟</h3>
            <p className="text-gray-600">
              نعم، نوفر خدمات تركيب للعديد من المنتجات مثل أنظمة الطاقة الشمسية وأنظمة ترشيد المياه. يمكنك الاستفسار عن خدمات التركيب المتاحة عند الشراء.
            </p>
          </div>
        </div>
      </div>
      
      {/* فوائد المنتجات الخضراء */}
      <div className="mt-10 bg-green-50 p-6 rounded-xl border border-green-200">
        <h2 className="text-xl font-bold mb-4 text-green-800">فوائد استخدام المنتجات الخضراء</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>تقليل التأثير البيئي والمساهمة في الحفاظ على كوكب الأرض</li>
          <li>توفير في تكاليف الطاقة والمياه على المدى الطويل</li>
          <li>الحد من التعرض للمواد الكيميائية الضارة في المنتجات التقليدية</li>
          <li>تحسين جودة الهواء الداخلي في المنزل</li>
          <li>تعزيز الاقتصاد المستدام ودعم المنتجين المحليين</li>
        </ul>
      </div>
    </div>
  );
} 
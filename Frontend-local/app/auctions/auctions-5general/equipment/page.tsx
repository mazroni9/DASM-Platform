'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Wrench, Hammer, Shovel, Cog, Ruler, Scissors } from 'lucide-react';
import Image from 'next/image';
import CategoryIcon from './components/CategoryIcon';

// Definición de tipos
interface ProductAdditionalInfo {
  equipmentType?: string;
  brand?: string;
  powerSource?: string;
  year?: string;
}

interface Product {
  id: string | number;
  title: string;
  description: string;
  current_price: string | number;
  condition: string;
  images?: string[];
  additional_info?: string | ProductAdditionalInfo;
}

export default function EquipmentMarketPage() {
  // حالات للتحكم بتحميل البيانات وعرضها
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  
  // تحميل المنتجات عند فتح الصفحة
  useEffect(() => {
    const fetchEquipmentProducts = async () => {
      try {
        setIsLoading(true);
        
        // استدعاء منتجات المعدات من API
        const response = await fetch('/api/items?category=equipment&limit=8&sort=newest');
        
        if (!response.ok) {
          throw new Error('Failed to fetch equipment products');
        }
        
        const data = await response.json();
        setFeaturedProducts(data.items || []);
      } catch (err: any) {
        console.error('Error fetching equipment products:', err);
        setError(err.message || 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEquipmentProducts();
  }, []);

  const categories = [
    { title: "أدوات يدوية", icon: Wrench, count: 56 },
    { title: "معدات كهربائية", icon: Cog, count: 42 },
    { title: "معدات البناء", icon: Hammer, count: 28 },
    { title: "معدات حدائق", icon: Scissors, count: 35 },
    { title: "أدوات قياس", icon: Ruler, count: 22 },
    { title: "معدات حفر", icon: Shovel, count: 18 }
  ];

  // المميزات الخاصة بسوق المعدات
  const features = [
    {
      title: "فحص وصيانة مسبقة",
      description: "جميع المعدات تخضع للفحص والصيانة قبل العرض"
    },
    {
      title: "تجربة قبل الشراء",
      description: "إمكانية تجربة المعدات للتأكد من حالتها وأدائها"
    },
    {
      title: "ضمان على المعدات",
      description: "ضمان لمدة شهر على معظم المعدات الكهربائية"
    }
  ];

  // دالة لاستخراج معلومات إضافية من JSON
  const extractAdditionalInfo = (product: Product): ProductAdditionalInfo => {
    try {
      const additionalInfo = product.additional_info 
        ? (typeof product.additional_info === 'string' 
            ? JSON.parse(product.additional_info) 
            : product.additional_info)
        : {};
        
      return {
        equipmentType: additionalInfo.equipmentType || '',
        brand: additionalInfo.brand || '',
        powerSource: additionalInfo.powerSource || '',
        year: additionalInfo.year || '',
      };
    } catch (err) {
      console.error('Error parsing additional info:', err);
      return {};
    }
  };

  // دالة لتنسيق عرض الصورة
  const getItemImage = (product: Product): string => {
    if (product.images && product.images.length > 0) {
      return `/uploads/${product.images[0]}`;
    }
    return '/placeholder/equipment.jpg'; // صورة بديلة في حال عدم وجود صورة
  };

  return (
    <div className="container mx-auto p-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <Link 
          href="/auctions/auctions-5general" 
          className="inline-flex items-center text-gray-700 hover:text-gray-800 transition-colors px-4 py-2 rounded-full border border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100 rtl:flex-row-reverse"
        >
          <ChevronRight className="h-4 w-4 ltr:mr-1 rtl:ml-1 rtl:rotate-180" />
          <span>العودة</span>
        </Link>
        
        <h1 className="text-3xl font-bold text-center text-gray-800">سوق المعدات العامة</h1>
        
        <div className="bg-white border-r-4 border-gray-500 rounded-lg shadow-sm px-3 py-1.5 flex items-center">
          <div className="text-sm font-medium text-gray-800">
            معدات وأدوات بحالة جيدة
          </div>
        </div>
      </div>
      
      {/* البانر الرئيسي */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-xl shadow-lg overflow-hidden mb-10">
        <div className="p-8 text-white">
          <h2 className="text-3xl font-bold mb-3">معدات وأدوات احترافية بأسعار معقولة</h2>
          <p className="text-xl opacity-90 mb-6">
            مجموعة متنوعة من المعدات والأدوات المستعملة والمجددة بحالة ممتازة لجميع الاستخدامات المنزلية والمهنية
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
            <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 text-gray-700 mb-3">
              <CategoryIcon icon={category.icon} size={24} />
            </div>
            <h3 className="font-medium text-gray-800">{category.title}</h3>
            <p className="text-gray-500 text-sm">{category.count} منتج</p>
          </div>
        ))}
      </div>
      
      {/* المنتجات المميزة */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6 border-b pb-2">المعدات المميزة</h2>
        
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-700"></div>
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
            <Link 
              href="/forms/equipment-auction-request" 
              className="mt-4 inline-block px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition"
            >
              إضافة أول منتج معدات
            </Link>
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
                      <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {additionalInfo.equipmentType || "معدات عامة"}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                    {additionalInfo.brand && (
                      <p className="text-gray-500 text-xs mb-2">
                        <span className="font-medium">الماركة:</span> {additionalInfo.brand}
                      </p>
                    )}
                    {additionalInfo.powerSource && (
                      <p className="text-gray-500 text-xs mb-2">
                        <span className="font-medium">مصدر الطاقة:</span> {additionalInfo.powerSource}
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xl font-bold text-gray-700">{product.current_price} ريال</span>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        الحالة: {product.condition || "مستعمل"}
                      </span>
                    </div>
                    <Link 
                      href={`/auctions/auctions-5general/equipment/${product.id}`}
                      className="mt-4 w-full py-2 bg-gray-700 hover:bg-gray-800 text-white rounded transition-colors block text-center"
                    >
                      عرض التفاصيل
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="mt-6 text-center">
          <Link 
            href="/auctions/auctions-5general/equipment/all"
            className="px-6 py-2 border border-gray-700 text-gray-700 hover:bg-gray-50 rounded-lg transition inline-block"
          >
            عرض المزيد من المعدات
          </Link>
        </div>
      </div>
      
      {/* مميزات المعدات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {features.map((feature, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6 border-t-4 border-gray-500">
            <h3 className="font-bold text-lg mb-2 text-gray-800">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>
      
      {/* بيع المعدات */}
      <div className="bg-gray-50 rounded-xl shadow-md p-8 border-r-4 border-gray-500 mb-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-center">هل لديك معدات أو أدوات ترغب في بيعها؟</h2>
          <p className="text-gray-600 mb-6 text-center">
            يمكنك الآن بيع معداتك وأدواتك التي لم تعد بحاجة لها. سنساعدك على الوصول إلى المشترين المهتمين وضمان عملية بيع آمنة وسريعة.
          </p>
          <div className="flex justify-center">
            <Link
              href="/forms/equipment-auction-request"
              className="px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white font-medium rounded-lg transition"
            >
              بيع معداتك الآن
            </Link>
          </div>
        </div>
      </div>
      
      {/* الأسئلة الشائعة */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-6 border-b pb-2">الأسئلة الشائعة</h2>
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h3 className="font-bold text-lg mb-2">كيف أتأكد من حالة المعدات قبل الشراء؟</h3>
            <p className="text-gray-600">
              نوفر تقرير فحص لكل معدة يتضمن حالتها وتاريخ صيانتها. كما يمكنك طلب معاينة شخصية وتجربة المعدة في موقعنا قبل اتخاذ قرار الشراء.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h3 className="font-bold text-lg mb-2">هل هناك ضمان على المعدات؟</h3>
            <p className="text-gray-600">
              نعم، نقدم ضمان لمدة شهر على معظم المعدات الكهربائية، يغطي أي عيوب مصنعية أو أعطال غير ناتجة عن سوء الاستخدام. المعدات اليدوية تخضع لشروط ضمان خاصة.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h3 className="font-bold text-lg mb-2">ما هي طرق الدفع المتاحة؟</h3>
            <p className="text-gray-600">
              نقبل الدفع النقدي، والتحويل البنكي، وبطاقات الائتمان. يمكنك أيضًا الدفع بالتقسيط على 3 أشهر بدون فوائد للمنتجات التي تزيد قيمتها عن 1000 ريال.
            </p>
          </div>
        </div>
      </div>
      
      {/* نصائح للمشترين */}
      <div className="mt-10 bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-gray-800">نصائح عند شراء المعدات المستعملة</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>افحص المعدة بشكل كامل للتأكد من عدم وجود أجزاء مكسورة أو مفقودة</li>
          <li>تحقق من الأسلاك والتوصيلات الكهربائية في المعدات الكهربائية</li>
          <li>اطلب معلومات عن عمر المعدة وعدد ساعات استخدامها السابق</li>
          <li>اسأل عن توفر قطع غيار وملحقات إضافية للمعدة</li>
          <li>اطلب دائمًا تجربة المعدة قبل الشراء للتأكد من أدائها</li>
        </ul>
      </div>
    </div>
  );
} 
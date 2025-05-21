'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, PencilRuler, Sofa, Smartphone, Leaf } from 'lucide-react';

export default function SelectiveMarketsPage() {
  // بيانات الأسواق العامة
  const markets = [
    {
      id: 'electronics',
      title: 'سوق الأجهزة الإلكترونية',
      description: 'أحدث الأجهزة الإلكترونية المستعملة والمجددة بضمان وجودة عالية',
      icon: Smartphone,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      hoverColor: 'hover:bg-blue-100',
      items: [
        'الهواتف الذكية والتابلت',
        'الحواسيب المحمولة وسطح المكتب',
        'الكاميرات وملحقاتها',
        'أجهزة الصوت والسماعات',
        'الشاشات وأجهزة العرض'
      ]
    },
    {
      id: 'furniture',
      title: 'سوق الأثاث المنزلي',
      description: 'تشكيلة واسعة من الأثاث المنزلي والمكتبي المستعمل بحالة ممتازة',
      icon: Sofa,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-500',
      hoverColor: 'hover:bg-amber-100',
      items: [
        'أثاث غرف النوم',
        'أثاث غرف المعيشة',
        'طاولات وكراسي الطعام',
        'أثاث المكاتب',
        'قطع الديكور والإكسسوارات'
      ]
    },
    {
      id: 'equipment',
      title: 'سوق المعدات العامة',
      description: 'معدات وأدوات متنوعة للاستخدامات المنزلية والمهنية',
      icon: PencilRuler,
      color: 'text-gray-700',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-500',
      hoverColor: 'hover:bg-gray-100',
      items: [
        'معدات البناء والتشييد',
        'أدوات ومعدات الحدائق',
        'معدات ورش العمل',
        'أدوات وأجهزة منزلية',
        'معدات الرياضة واللياقة'
      ]
    },
    {
      id: 'green',
      title: 'السوق الأخضر',
      description: 'منتجات صديقة للبيئة تدعم الاستدامة والحفاظ على الموارد الطبيعية',
      icon: Leaf,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
      hoverColor: 'hover:bg-green-100',
      items: [
        'منتجات الطاقة المتجددة',
        'أجهزة موفرة للطاقة',
        'منتجات قابلة لإعادة التدوير',
        'مستلزمات الزراعة المنزلية',
        'منتجات عضوية ومستدامة'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-16">
      {/* شريط التنقل العلوي */}
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link
              href="/auctions"
              className="flex items-center text-blue-600 hover:text-blue-800 transition"
            >
              <ArrowLeft size={20} className="ml-2" />
              <span>العودة إلى الأسواق الرئيسية</span>
            </Link>
            <h1 className="text-xl font-bold">الأسواق العامة</h1>
          </div>
        </div>
      </div>

      {/* بانر علوي */}
      <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">الأسواق العامة</h1>
          <p className="text-xl max-w-3xl mx-auto opacity-90">
            مجموعة متنوعة من الأسواق المتخصصة لمختلف المنتجات والمعدات المستعملة بحالة ممتازة وأسعار تنافسية
          </p>
        </div>
      </div>

      {/* محتوى رئيسي - كروت الأسواق */}
      <div className="container mx-auto px-4 py-12 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {markets.map((market) => (
            <div 
              key={market.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
            >
              <div className={`py-6 px-6 ${market.bgColor} border-b-4 ${market.borderColor}`}>
                <div className="flex items-center">
                  <div className={`p-3 rounded-full bg-white ${market.color} mr-4`}>
                    <market.icon size={24} />
                  </div>
                  <h2 className="text-2xl font-bold">{market.title}</h2>
                </div>
                <p className="mt-3 text-gray-600">{market.description}</p>
              </div>
              
              <div className="p-6">
                <h3 className="font-bold text-gray-700 mb-3">المنتجات المتوفرة:</h3>
                <ul className="space-y-2">
                  {market.items.map((item, index) => (
                    <li key={index} className="flex items-center">
                      <div className={`w-2 h-2 rounded-full ${market.color} mr-2`}></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                
                <Link 
                  href={`/auctions/auctions-5general/${market.id}`}
                  className={`mt-6 block w-full py-3 text-center rounded-lg ${market.bgColor} ${market.hoverColor} ${market.color} font-medium transition-colors duration-300 border border-gray-200 hover:border-gray-300`}
                >
                  <span className="flex items-center justify-center">
                    استعراض السوق 
                    <ChevronLeft size={16} className="mr-1" />
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* قسم معلومات إضافية */}
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 border-r-4 border-blue-500">
          <h2 className="text-2xl font-bold mb-4">مميزات الأسواق العامة</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-2 text-blue-600">جودة عالية مضمونة</h3>
              <p className="text-gray-600">جميع المنتجات يتم فحصها وتقييمها بعناية للتأكد من جودتها قبل العرض</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-2 text-blue-600">أسعار تنافسية</h3>
              <p className="text-gray-600">أسعار مناسبة للجميع مع خيارات متعددة للمزايدة والشراء المباشر</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-2 text-blue-600">ضمان وحماية</h3>
              <p className="text-gray-600">نظام حماية متكامل للمشترين مع ضمان على المنتجات ضد العيوب المخفية</p>
            </div>
          </div>
        </div>
      </div>

      {/* دعوة للعمل */}
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl py-10 px-6">
          <h2 className="text-3xl font-bold mb-4">هل لديك منتجات ترغب في بيعها؟</h2>
          <p className="text-xl mb-6 max-w-2xl mx-auto">انضم إلى منصتنا اليوم وابدأ في عرض منتجاتك للبيع في أسواقنا المتنوعة</p>
          <Link
            href="/forms/general-auction-request"
            className="inline-block py-3 px-8 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-colors duration-300 shadow-lg"
          >
            تسجيل منتج للبيع
          </Link>
        </div>
      </div>
    </div>
  );
} 
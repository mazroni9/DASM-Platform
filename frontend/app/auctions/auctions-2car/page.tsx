/**
 * 📝 الصفحة: عرض مزادات السيارات
 * 📁 المسار: Frontend-local/app/auctions/auctions-2car/page.tsx
 *
 * ✅ الوظيفة:
 * - تعرض هذه الصفحة جميع أنواع أسواق السيارات التخصصية
 * - تُظهر روابط لكل نوع من أنواع أسواق السيارات مع صور ووصف مختصر
 *
 * 🔄 الارتباطات:
 * - ترتبط مع: الصفحة الرئيسية للمزادات (/auctions)
 * - تؤدي إلى: صفحات قطاعات السيارات المختلفة (luxuryCars, companiesCars, government, etc.)
 * 
 * ✅ الفائدة:
 * - تُستخدم من قبل جميع المستخدمين لتصفح أنواع أسواق السيارات المختلفة
 * - توفر وصولاً سهلاً لجميع الأسواق التخصصية للسيارات
 */

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Car, Building, Building2, Truck, Home, ChevronRight } from 'lucide-react';

export default function CarAuctionsPage() {
  // قائمة بجميع أسواق السيارات التخصصية بترتيب الأرقام: 1, 2, 3, ...
  const carMarkets = [
    // الصف الأول كما هو مطلوب: الفارهة (1) ثم الكلاسيكية (2) ثم الكرافانات (3)
    {
      id: 'luxury',
      title: 'سوق السيارات الفارهة',
      description: 'سيارات فارهة مميزة بأسعار منافسة',
      image: '/showroom.png',
      color: 'from-orange-500 to-orange-700',
      bgColor: 'bg-white',
      hoverColor: 'bg-gray-50',
      textColor: 'text-orange-600',
      icon: Car,
      path: '/auctions/auctions-2car/luxuryCars',
      row: 1
    },
    {
      id: 'classic',
      title: 'سوق السيارات الكلاسيكية',
      description: 'سيارات كلاسيكية نادرة وقطع مميزة للهواة والمقتنين',
      image: '/1970 Plum Crazy Dodge Dart Swinger.png',
      color: 'from-orange-500 to-orange-700',
      bgColor: 'bg-white',
      hoverColor: 'bg-gray-50',
      textColor: 'text-orange-600',
      icon: Car,
      path: '/auctions/auctions-2car/classic',
      row: 1
    },
    {
      id: 'caravan',
      title: 'سوق الكرافانات',
      description: 'كرافانات ومنازل متنقلة لمحبي السفر والرحلات',
      image: '/caravan.png',
      color: 'from-orange-500 to-orange-700',
      bgColor: 'bg-white',
      hoverColor: 'bg-gray-50',
      textColor: 'text-orange-600',
      icon: Home,
      path: '/auctions/auctions-2car/caravan',
      row: 1
    },
    
    // الصف الثاني
    {
      id: 'buses',
      title: 'سوق الشاحنات والحافلات',
      description: 'شاحنات ومعدات ثقيلة بحالة تشغيل ممتازة',
      image: '/trucks.jpg',
      color: 'from-blue-500 to-blue-700',
      bgColor: 'bg-white',
      hoverColor: 'bg-gray-50',
      textColor: 'text-blue-600',
      icon: Truck,
      path: '/auctions/auctions-2car/busesTrucks',
      row: 2
    },
    {
      id: 'companies',
      title: 'سوق سيارات الشركات',
      description: 'سيارات شركات بأسعار تصفية مخزون',
      image: '/company-fleet.jpg',
      color: 'from-blue-500 to-blue-700',
      bgColor: 'bg-white',
      hoverColor: 'bg-gray-50',
      textColor: 'text-blue-600',
      icon: Building2,
      path: '/auctions/auctions-2car/companiesCars',
      row: 2
    },
    {
      id: 'government',
      title: 'سوق سيارات الجهات الحكومية',
      description: 'سيارات من الجهات الحكومية بحالة جيدة',
      image: '/gov-cars.jpg',
      color: 'from-blue-500 to-blue-700',
      bgColor: 'bg-white',
      hoverColor: 'bg-gray-50',
      textColor: 'text-blue-600',
      icon: Building,
      path: '/auctions/auctions-2car/government',
      row: 2
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-8 md:py-12 px-4 md:px-6 text-white">
        <div className="container mx-auto">
          {/* زر العودة إلى السوق الرئيسي */}
          <div className="mb-6">
            <Link 
              href="/auctions" 
              className="inline-flex items-center text-white/90 hover:text-white transition-colors group"
            >
              <ChevronRight className="ml-1 transform group-hover:-translate-x-1 transition-transform" size={20} />
              <span>العودة للسوق الرئيسي</span>
            </Link>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">قطاع السيارات المختلفة</h1>
          <p className="text-lg md:text-xl opacity-90 max-w-3xl mx-auto text-center">
            تصفح مجموعة متنوعة من أسواق السيارات المتخصصة، من الكلاسيكية إلى الفاخرة والشاحنات والكرفانات
          </p>
        </div>
      </div>

      {/* قائمة الأسواق */}
      <div className="container mx-auto py-8 md:py-16 px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {carMarkets.map((market) => {
            const Icon = market.icon;
            return (
              <Link 
                key={market.id}
                href={market.path}
                className={`group flex flex-col h-full rounded-xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg ${market.bgColor} hover:${market.hoverColor} transform hover:-translate-y-1`}
              >
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <div className={`p-3 rounded-full mr-3 ${market.textColor} bg-white`}>
                      <Icon size={24} />
                    </div>
                    <h3 className={`text-xl font-bold ${market.textColor}`}>{market.title}</h3>
                  </div>
                  
                  <div className="relative h-40 mb-4 overflow-hidden rounded-lg">
                    {market.image && (
                      <Image 
                        src={market.image}
                        alt={market.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    )}
                    <div className={`absolute inset-0 bg-gradient-to-t ${market.color} opacity-20`}></div>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{market.description}</p>
                  
                  <div className="mt-auto pt-3">
                    <span className={`inline-flex items-center text-sm font-medium rounded-full px-4 py-2 bg-white/80 group-hover:bg-white group-hover:${market.textColor} text-gray-700 transition-colors`}>
                      اضغط للدخول
                      <ChevronRight className="mr-1 opacity-0 group-hover:opacity-100 transition-opacity" size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

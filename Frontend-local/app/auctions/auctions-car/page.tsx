/**
 * 📝 الصفحة: عرض مزادات السيارات
 * 📁 المسار: Frontend-local/app/auctions/auctions-car/page.tsx
 *
 * ✅ الوظيفة:
 * - تعرض هذه الصفحة جميع أنواع أسواق السيارات التخصصية
 * - تُظهر روابط لكل نوع من أنواع أسواق السيارات مع صور ووصف مختصر
 *
 * ✅ الفائدة:
 * - تُستخدم من قبل جميع المستخدمين لتصفح أنواع أسواق السيارات المختلفة
 * - توفر وصولاً سهلاً لجميع الأسواق التخصصية للسيارات
 */

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

export default function CarAuctionsPage() {
  // قائمة بجميع أسواق السيارات التخصصية
  const carMarkets = [
    {
      id: 'classic',
      title: 'السيارات الكلاسيكية',
      description: 'سيارات نادرة وأصيلة من الخمسينات والستينات والسبعينات بحالة ممتازة وتاريخ موثق',
      image: '/1970 Plum Crazy Dodge Dart Swinger.jpg',
      color: 'from-amber-600 to-amber-800',
      path: '/auctions/auctions-car/classic'
    },
    {
      id: 'luxury',
      title: 'السيارات الفاخرة',
      description: 'أفخم السيارات وأكثرها تميزاً من شركات عالمية مرموقة، بمواصفات حصرية',
      image: '/showroom.png',
      color: 'from-indigo-600 to-indigo-900',
      path: '/auctions/auctions-car/luxuryCars'
    },
    {
      id: 'buses',
      title: 'الحافلات والشاحنات',
      description: 'شاحنات وحافلات بمختلف الأحجام والاستخدامات، موديلات حديثة بحالة ممتازة',
      image: '/trucks.jpg',
      color: 'from-blue-600 to-blue-800',
      path: '/auctions/auctions-car/busesTrucks'
    },
    {
      id: 'caravan',
      title: 'العربات والكرفانات',
      description: 'كرفانات ومقطورات سكنية ورياضية مجهزة بالكامل، مثالية للرحلات والتنقل',
      image: '/caravan.jpg',
      color: 'from-green-600 to-green-800',
      path: '/auctions/auctions-car/caravan'
    },
    {
      id: 'government',
      title: 'مزادات الجهات الحكومية',
      description: 'سيارات ومركبات تابعة للجهات الحكومية بأسعار تنافسية وضمان الجودة',
      image: '/gov-cars.jpg',
      color: 'from-purple-600 to-purple-800',
      path: '/auctions/auctions-car/government'
    },
    {
      id: 'companies',
      title: 'أساطيل الشركات',
      description: 'سيارات من أساطيل الشركات الكبرى، بصيانة دورية موثقة وحالة ممتازة',
      image: '/company-fleet.jpg',
      color: 'from-gray-600 to-gray-800',
      path: '/auctions/auctions-car/companiesCars'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-12 px-6 text-white">
        <div className="max-w-7xl mx-auto">
          {/* زر العودة إلى السوق الرئيسي */}
          <div className="mb-6 text-left">
            <Link 
              href="/auctions" 
              className="inline-flex items-center text-white/90 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} className="ml-2" />
              <span>العودة إلى السوق الرئيسي</span>
            </Link>
          </div>
          
          <h1 className="text-5xl font-bold mb-4 text-center">سوق السيارات</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto text-center">
            تصفح مجموعة متنوعة من أسواق السيارات المتخصصة، من الكلاسيكية إلى الفاخرة والشاحنات والكرفانات
          </p>
        </div>
      </div>

      {/* قائمة الأسواق */}
      <div className="max-w-7xl mx-auto py-16 px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {carMarkets.map((market) => (
            <Link 
              key={market.id}
              href={market.path}
              className="group block overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300"
            >
              <div className={`relative h-48 bg-gradient-to-r ${market.color}`}>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all"></div>
                {market.image && (
                  <div className="relative h-full w-full opacity-80 group-hover:opacity-100 transition-opacity">
                    <Image 
                      src={market.image}
                      alt={market.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                  <h2 className="text-2xl font-bold text-white">{market.title}</h2>
                </div>
              </div>
              <div className="p-6 bg-white">
                <p className="text-gray-600">{market.description}</p>
                <div className="mt-4 inline-flex items-center text-blue-600 font-medium group-hover:text-blue-800">
                  <span>استكشف السوق</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 rtl:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

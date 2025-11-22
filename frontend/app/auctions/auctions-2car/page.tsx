'use client';

import React from 'react';
import LoadingLink from "@/components/LoadingLink";
import Image from 'next/image';
import { ChevronRight, Car, Truck, Home, Bus } from 'lucide-react';

export default function CarAuctionsPage() {
  const carMarkets = [
    // الصف الأول
    {
      id: 'luxury',
      title: 'سوق السيارات الفارهة',
      description: 'سيارات فارهة مميزة بأسعار منافسة',
      image: '/showroom.png',
      color: 'from-amber-500 to-amber-700',
      bgColor: 'bg-gray-800/40',
      hoverColor: 'bg-gray-800/60',
      textColor: 'text-amber-400',
      icon: Car,
      path: '/auctions/auctions-2car/luxuryCars',
    },
    {
      id: 'classic',
      title: 'سوق السيارات الكلاسيكية',
      description: 'سيارات كلاسيكية نادرة وقطع مميزة للهواة والمقتنين',
      image: '/1970 Plum Crazy Dodge Dart Swinger.png',
      color: 'from-amber-500 to-amber-700',
      bgColor: 'bg-gray-800/40',
      hoverColor: 'bg-gray-800/60',
      textColor: 'text-amber-400',
      icon: Car,
      path: '/auctions/auctions-2car/classic',
    },
    {
      id: 'caravan',
      title: 'سوق الكرافانات',
      description: 'كرافانات ومنازل متنقلة لمحبي السفر والرحلات',
      image: '/caravan.png',
      color: 'from-amber-500 to-amber-700',
      bgColor: 'bg-gray-800/40',
      hoverColor: 'bg-gray-800/60',
      textColor: 'text-amber-400',
      icon: Home,
      path: '/auctions/auctions-2car/caravan',
    },

    // الصف الثاني — تم الفصل بين الشاحنات والحافلات، وحذف الحكومة + الشركات لتفادي 404
    {
      id: 'trucks',
      title: 'سوق الشاحنات',
      description: 'شاحنات ومعدات ثقيلة بحالة تشغيل ممتازة',
      image: '/trucks.jpg',
      color: 'from-blue-500 to-blue-700',
      bgColor: 'bg-gray-800/40',
      hoverColor: 'bg-gray-800/60',
      textColor: 'text-blue-400',
      icon: Truck,
      path: '/auctions/auctions-2car/trucks',
    },
    {
      id: 'buses',
      title: 'سوق الحافلات',
      description: 'حافلات بجاهزية عالية مع خيارات متنوعة',
      image: '/buses.jpg',
      color: 'from-blue-500 to-blue-700',
      bgColor: 'bg-gray-800/40',
      hoverColor: 'bg-gray-800/60',
      textColor: 'text-blue-400',
      icon: Bus,
      path: '/auctions/auctions-2car/buses',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-gray-100">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 py-10 md:py-14 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* زر العودة */}
          <div className="mb-8">
            <LoadingLink 
              href="/auctions" 
              className="inline-flex items-center text-blue-200 hover:text-white transition-colors group backdrop-blur-sm"
            >
              <ChevronRight className="ml-2 rtl:rotate-180 transform group-hover:-translate-x-1 transition-transform" size={20} />
              <span className="font-medium">العودة للسوق الرئيسي</span>
            </LoadingLink>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-center text-white">
سوق السيارات المتخصص
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-3xl mx-auto text-center text-blue-100">
            تصفح أسواق متخصصة: الفارهة، الكلاسيكية، الكرفانات، الشاحنات، الحافلات
          </p>
        </div>
      </div>

      {/* قائمة الأسواق */}
      <div className="max-w-7xl mx-auto py-10 md:py-16 px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {carMarkets.map((market) => {
            const Icon = market.icon;
            return (
              <LoadingLink 
                key={market.id}
                href={market.path}
                className={`group flex flex-col h-full rounded-2xl border border-gray-700/50 overflow-hidden transition-all duration-300 hover:border-gray-600/70 backdrop-blur-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 ${market.bgColor} hover:${market.hoverColor}`}
              >
                <div className="p-6 flex flex-col h-full">
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-xl mr-3 ${market.textColor} bg-gray-900/60 backdrop-blur-sm border border-gray-700/50`}>
                      <Icon size={24} />
                    </div>
                    <h3 className={`text-xl font-bold ${market.textColor}`}>{market.title}</h3>
                  </div>
                  
                  <div className="relative h-48 mb-5 overflow-hidden rounded-xl flex-shrink-0">
                    {market.image ? (
                      <Image 
                        src={market.image}
                        alt={market.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-900/50 flex items-center justify-center">
                        <Car className="w-12 h-12 text-gray-600" />
                      </div>
                    )}
                    <div className={`absolute inset-0 bg-gradient-to-t ${market.color} opacity-15`}></div>
                  </div>
                  
                  <p className="text-gray-400 mb-5 flex-grow">{market.description}</p>
                  
                  <div className="mt-auto pt-3">
                    <span className={`inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl border border-gray-700/50 bg-gray-900/50 backdrop-blur-sm text-gray-300 group-hover:text-white group-hover:border-gray-600/70 transition-all`}>
                      <span className="font-medium">ابدأ التصفح</span>
                      <ChevronRight className="w-4 h-4 rtl:rotate-180 opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-1 transition-all duration-300" />
                    </span>
                  </div>
                </div>
              </LoadingLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}

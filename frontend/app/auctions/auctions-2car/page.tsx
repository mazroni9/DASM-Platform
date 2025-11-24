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
      // theme-aware overlay + card styles
      color: 'bg-primary/10',
      bgColor: 'bg-card/40',
      hoverColor: 'bg-card/60',
      textColor: 'text-primary',
      icon: Car,
      path: '/auctions/auctions-2car/luxuryCars',
    },
    {
      id: 'classic',
      title: 'سوق السيارات الكلاسيكية',
      description: 'سيارات كلاسيكية نادرة وقطع مميزة للهواة والمقتنين',
      image: '/1970 Plum Crazy Dodge Dart Swinger.png',
      color: 'bg-primary/10',
      bgColor: 'bg-card/40',
      hoverColor: 'bg-card/60',
      textColor: 'text-primary',
      icon: Car,
      path: '/auctions/auctions-2car/classic',
    },
    {
      id: 'caravan',
      title: 'سوق الكرافانات',
      description: 'كرافانات ومنازل متنقلة لمحبي السفر والرحلات',
      image: '/caravan.png',
      color: 'bg-primary/10',
      bgColor: 'bg-card/40',
      hoverColor: 'bg-card/60',
      textColor: 'text-primary',
      icon: Home,
      path: '/auctions/auctions-2car/caravan',
    },

    // الصف الثاني — تم الفصل بين الشاحنات والحافلات، وحذف الحكومة + الشركات لتفادي 404
    {
      id: 'trucks',
      title: 'سوق الشاحنات',
      description: 'شاحنات ومعدات ثقيلة بحالة تشغيل ممتازة',
      image: '/trucks.jpg',
      color: 'bg-secondary/10',
      bgColor: 'bg-card/40',
      hoverColor: 'bg-card/60',
      textColor: 'text-secondary',
      icon: Truck,
      path: '/auctions/auctions-2car/trucks',
    },
    {
      id: 'buses',
      title: 'سوق الحافلات',
      description: 'حافلات بجاهزية عالية مع خيارات متنوعة',
      image: '/buses.jpg',
      color: 'bg-secondary/10',
      bgColor: 'bg-card/40',
      hoverColor: 'bg-card/60',
      textColor: 'text-secondary',
      icon: Bus,
      path: '/auctions/auctions-2car/buses',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* رأس الصفحة */}
      <div className="bg-card py-10 md:py-14 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* زر العودة */}
          <div className="mb-8">
            <LoadingLink 
              href="/auctions" 
              className="inline-flex items-center text-foreground/80 hover:text-foreground transition-colors group backdrop-blur-sm"
            >
              <ChevronRight className="ml-2 rtl:rotate-180 transform group-hover:-translate-x-1 transition-transform" size={20} />
              <span className="font-medium">العودة للسوق الرئيسي</span>
            </LoadingLink>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-center text-foreground">
            سوق السيارات المتخصص
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-3xl mx-auto text-center text-foreground/80">
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
                className={`group flex flex-col h-full rounded-2xl border border-border/50 overflow-hidden transition-all duration-300 hover:border-border backdrop-blur-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 ${market.bgColor} hover:${market.hoverColor}`}
              >
                <div className="p-6 flex flex-col h-full">
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-xl mr-3 ${market.textColor} bg-card/60 backdrop-blur-sm border border-border/50`}>
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
                      <div className="w-full h-full bg-card/50 flex items-center justify-center">
                        <Car className="w-12 h-12 text-foreground/60" />
                      </div>
                    )}
                    <div className={`absolute inset-0 ${market.color} opacity-15`}></div>
                  </div>
                  
                  <p className="mb-5 flex-grow text-foreground/70">{market.description}</p>
                  
                  <div className="mt-auto pt-3">
                    {/* زر "ابدأ التصفح" – أزرق بنص أبيض */}
                    <span className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl border border-border bg-primary text-white group-hover:bg-primary/90 group-hover:border-border transition-all">
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

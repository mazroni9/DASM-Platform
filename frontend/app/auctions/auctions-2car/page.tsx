'use client';

import React from 'react';
import LoadingLink from "@/components/LoadingLink";
import Image from "next/image";
import { ChevronRight, Car, Truck, Home, Bus, Building2, Gem, Heart } from "lucide-react";

export default function CarAuctionsPage() {
  const carMarkets = [
    // الصف الأول - الفخامة والكلاسيك
    {
      id: 'luxury',
      title: 'سوق السيارات الفارهة',
      description: 'أحدث صيحات السيارات الفاخرة بأداء عالي وتصاميم عصرية لا تضاهى.',
      // صورة بورش أو أودي رياضية فاخرة
      image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1200&auto=format&fit=crop',
      // لون العنوان عند الهوفر
      accentColor: 'group-hover:text-blue-400',
      // لون خلفية أيقونة الزر
      btnAccent: 'hover:bg-blue-600',
      icon: Gem,
      path: '/auctions/auctions-2car/luxuryCars',
    },
    {
      id: 'classic',
      title: 'سوق السيارات الكلاسيكية',
      description: 'قطع نادرة وسيارات عريقة تعود لعصور ذهبية للمقتنين المحترفين.',
      // صورة سيارة موستانج كلاسيكية
      image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200&auto=format&fit=crop',
      accentColor: 'group-hover:text-amber-400',
      btnAccent: 'hover:bg-amber-600',
      icon: Heart,
      path: '/auctions/auctions-2car/classic',
    },
    {
      id: 'caravan',
      title: 'سوق الكرافانات',
      description: 'حرية السفر مع منازل متنقلة مريحة ومجهزة لجميع احتياجات الرحلات.',
      // صورة كرافان وسط الطبيعة
      image: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=1200&auto=format&fit=crop',
      accentColor: 'group-hover:text-emerald-400',
      btnAccent: 'hover:bg-emerald-600',
      icon: Home,
      path: '/auctions/auctions-2car/caravan',
    },

    // الصف الثاني - النقل الثقيل والشركات
    {
      id: 'trucks',
      title: 'سوق الشاحنات',
      description: 'شاحنات ضخمة وثقيلة بمواصفات قوية لأعمال النقل والإنشاءات.',
      // صورة شاحنة سكانيا أو فولفو
      image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=1200&auto=format&fit=crop',
      accentColor: 'group-hover:text-indigo-400',
      btnAccent: 'hover:bg-indigo-600',
      icon: Truck,
      path: '/auctions/auctions-2car/trucks',
    },
    {
      id: 'buses',
      title: 'سوق الحافلات',
      description: 'حافلات سياحية وركاب بمقاعد مريحة وتجهيزات أمان عالية المستوى.',
      // صورة حافلة سياحية حديثة
      image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=1200&auto=format&fit=crop',
      accentColor: 'group-hover:text-orange-400',
      btnAccent: 'hover:bg-orange-600',
      icon: Bus,
      path: '/auctions/auctions-2car/buses',
    },

    // سوق سيارات الشركات
    {
      id: 'companiesCars',
      title: 'سوق سيارات الشركات',
      description: 'أسطول سيارات الشركات والمؤسسات بأسعار تصفية مميزة.',
      // صورة موقف سيارات فاخرة للشركات
      image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?q=80&w=1200&auto=format&fit=crop',
      accentColor: 'group-hover:text-rose-400',
      btnAccent: 'hover:bg-rose-600',
      icon: Building2,
      path: '/auctions/auctions-2car/companiesCars',
    },
  ];

  return (
    <div className="min-h-screen bg-[#050b14] text-white selection:bg-blue-500 selection:text-white relative overflow-hidden">
      
      {/* خلفية جمالية متوهجة */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* رأس الصفحة */}
        <header className="pt-20 pb-14 text-center">
          <div className="flex justify-center mb-8">
            <LoadingLink
              href="/#auctions"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-300 backdrop-blur-md"
            >
              <ChevronRight className="w-5 h-5 rtl:rotate-180 transition-transform group-hover:-translate-x-1" />
              <span className="text-sm font-semibold tracking-wide">عودة للرئيسية</span>
            </LoadingLink>
          </div>

          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-white drop-shadow-lg">
            سوق السيارات المتخصص
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light">
            استكشف مجموعتنا الحصرية من السيارات والمركبات. كل قسم مصمم لتلبية أعلى معايير الجودة والأداء.
          </p>
        </header>

        {/* شبكة الأسواق */}
        <main className="pb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {carMarkets.map((market) => {
              const Icon = market.icon;
              return (
                <LoadingLink
                  key={market.id}
                  href={market.path}
                  className="group relative flex flex-col h-full rounded-3xl bg-[#0f172a] border border-white/5 overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-white/10 hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)]"
                >
                  {/* منطقة الصورة */}
                  <div className="relative h-64 md:h-72 overflow-hidden">
                    <Image
                      src={market.image}
                      alt={market.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    {/* طبقة تعتيم خفيفة جداً لتمييز النص إذا احتجنا، لكن هنا نتركها صافية للجمالية */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent opacity-80" />
                  </div>

                  {/* منطقة المحتوى */}
                  <div className="relative z-20 p-7 flex flex-col flex-grow -mt-20">
                    
                    {/* أيقونة */}
                    <div className="mb-4">
                      <div className="inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-xl group-hover:bg-white transition-colors duration-300">
                        <Icon size={26} className="text-white group-hover:text-[#0f172a] transition-colors duration-300" />
                      </div>
                    </div>

                    {/* العنوان - تم إصلاحه ليكون أبيض ثم يتغير للون المميز */}
                    <h3 className={`text-2xl font-bold mb-3 text-white transition-colors duration-300 ${market.accentColor}`}>
                      {market.title}
                    </h3>
                    
                    <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-grow font-medium">
                      {market.description}
                    </p>

                    {/* زر الإجراء */}
                    <div className="mt-auto pt-4 border-t border-white/5">
                      <div className={`flex items-center justify-between w-full text-sm font-bold text-white bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 transition-all duration-300 group-hover:bg-white group-hover:text-black ${market.btnAccent}`}>
                        <span>تصفح السيارات</span>
                        <ChevronRight className="w-5 h-5 rtl:rotate-180 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </LoadingLink>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
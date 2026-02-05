"use client";

import React from "react";
import LoadingLink from "@/components/LoadingLink";
import { Car, Star, Gem, Home, Store, Award, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

// ========== بيانات الأسواق ==========
const marketItems = [
  // المجموعة اليمنى - السيارات
  {
    name: "سوق معارض السيارات",
    description: "اكتشف أحدث السيارات الفاخرة والجديدة من المعارض المعتمدة.",
    icon: Car,
    href: "/auctions/auctions-1main",
    group: "right",
    isHidden: false,
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=800&auto=format&fit=crop", 
  },
  {
    name: "سوق السيارات المتخصص",
    description: "مزادات السيارات الكلاسيكية، المعدات الثقيلة، والمركبات النادرة.",
    icon: Award,
    href: "/auctions/auctions-2car",
    group: "right",
    isHidden: false,
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=800&auto=format&fit=crop", 
  },
  {
    name: "سوق الأجهزة النوعية",
    description: "أجهزة إلكترونية ومعدات دقيقة عالية الجودة.",
    icon: Star,
    href: "/auctions/auctions-3quality",
    group: "right",
    isHidden: true,
    image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=800&auto=format&fit=crop",
  },
  // المجموعة اليسرى - العامة
  {
    name: "السوق الفريد",
    description: "مقتنيات نادرة وتحف فنية لا تقدر بثمن.",
    icon: Gem,
    href: "/auctions/auctions-4special",
    group: "left",
    isHidden: true,
    image: "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?q=80&w=800&auto=format&fit=crop",
  },
  {
    name: "الأسواق العامة",
    description: "كل ما تحتاجه للمنزل والعائلة في مكان واحد.",
    icon: Home,
    href: "/auctions/auctions-5general",
    group: "left",
    isHidden: true,
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=800&auto=format&fit=crop",
  },
  {
    name: "السوق الكبير",
    description: "متاجر متنوعة وعروض جملة حصرية.",
    icon: Store,
    href: "/auctions/auctions-6big",
    group: "left",
    isHidden: true,
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop",
  },
];

// ========== بطاقة سوق واحد ==========
const MarketCard = ({ item, index }: any) => {
  const Icon = item.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      // العرض المرن للكارد
      className="w-full md:w-[48%] lg:w-[45%] max-w-2xl" 
    >
      <LoadingLink
        href={item.href}
        // ✅ تم إضافة bg-gray-900 لإخفاء الخط الأبيض الذي يظهر خلف الصورة عند الحركة
        // ✅ تم إضافة transform-gpu لتحسين الأداء
        className="group relative block w-full h-[420px] rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-emerald-900/30 border border-border/10 bg-gray-900 transform-gpu"
        aria-label={`الذهاب إلى ${item.name}`}
      >
        {/* الخلفية الصورة */}
        <div className="absolute inset-0 w-full h-full bg-gray-900" >
            <img 
                src={item.image} 
                alt={item.name}
                // ✅ إضافة will-change-transform ليخبر المتصفح أن الصورة ستتحرك
                className="w-full h-full object-cover opacity-100 transition-transform duration-1000 group-hover:scale-110 will-change-transform"
            />
        </div>

        {/* طبقة تظليل متدرجة */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent/5 opacity-90 pointer-events-none" />

        {/* المحتوى الداخلي */}
        <div className="absolute inset-0 p-8 flex flex-col justify-end items-start text-right h-full z-10">
            
          {/* الأيقونة العائمة */}
          <div className="absolute top-8 right-8 w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg group-hover:bg-emerald-600 group-hover:border-emerald-500 transition-all duration-300" >
            <Icon className="text-white w-8 h-8" />
          </div>

          <div className="w-full relative">
             {/* العنوان */}
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight drop-shadow-md">
                {item.name}
            </h3>

            {/* الوصف */}
            <p className="text-gray-200 text-base md:text-lg line-clamp-2 mb-6 leading-relaxed opacity-90">
                {item.description}
            </p>

            {/* الزر */}
            <div className="flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-6 py-4 text-white font-semibold text-lg transition-all duration-300 group-hover:bg-emerald-600 group-hover:border-emerald-500 w-full">
                <span >استعراض السوق</span>
                <ArrowLeft className="w-6 h-6 transition-transform duration-300 group-hover:-translate-x-2" />
            </div>
          </div>
        </div>
      </LoadingLink>
    </motion.div>
  );
};

// ========== شريط تنقل الأسواق ==========

export default function MarketTypeNav() {
  const visibleItems = marketItems.filter((item) => !item.isHidden);

  return (
    <section className="w-full py-12 md:py-24 bg-background/50 overflow-hidden" id ="auctions">
      <div className="container px-4 md:px-6 mx-auto max-w-7xl">
        
        {/* العنوان الرئيسي */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14 md:mb-20 space-y-4"
        >
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground" >
            اختر <span className="text-emerald-600 dark:text-emerald-400" >سوقك المتخصص</span>
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto">
            كل سوق مصمم ليلبي احتياجات فئة محددة من البائعين والمشترين
          </p>
        </motion.div>

        {/* حاوية البطاقات */}
        <div className="flex flex-wrap justify-center items-stretch gap-6 md:gap-8">
          {visibleItems.map((item, index) => (
            <MarketCard key={item.href} item={item} index={index} />
          ))}
        </div>

      </div>
    </section>
  );
}

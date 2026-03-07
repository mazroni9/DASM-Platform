"use client";

import React from "react";
import LoadingLink from "@/components/LoadingLink";
import { Car, Star, Gem, Home, Store, Award } from "lucide-react";
import { motion } from "framer-motion";

// ========== عناصر الأسواق ==========
const marketItems = [
  {
    name: "سوق معارض السيارات",
    description: "مزادات سيارات من معارض معتمدة",
    icon: Car,
    href: "/auctions/auctions-1main",
    isHidden: false,
  },
  {
    name: "سوق السيارات المتخصص",
    description: "مزادات سيارات متخصصة ومراجعة",
    icon: Award,
    href: "/auctions/auctions-2car",
    isHidden: false,
  },
  { name: "سوق الاجهزة النوعية", description: "", icon: Star, href: "/auctions/auctions-3quality", isHidden: true },
  { name: "السوق الفريد", description: "", icon: Gem, href: "/auctions/auctions-4special", isHidden: true },
  { name: "الأسواق العامة", description: "", icon: Home, href: "/auctions/auctions-5general", isHidden: true },
  { name: "السوق الكبير", description: "", icon: Store, href: "/auctions/auctions-6big", isHidden: true },
];

// ========== بطاقة سوق واحد ==========
const MarketCard = ({ item, index }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className="w-full max-w-sm"
    >
      <div className="bg-white dark:bg-card rounded-2xl border border-slate-200 dark:border-border shadow-sm hover:shadow-md hover:ring-2 hover:ring-[#009345]/20 dark:hover:ring-0 transition-all duration-300 overflow-hidden h-full flex flex-col items-center text-center p-6">
        <h3 className="text-[#009345] dark:text-[#009345] font-semibold text-lg leading-snug mb-2">
          {item.name}
        </h3>
        {item.description ? (
          <p className="text-[#475569] dark:text-foreground/70 text-sm mb-4 flex-1">
            {item.description}
          </p>
        ) : (
          <div className="flex-1" />
        )}
        <LoadingLink
          href={item.href}
          className="inline-flex items-center justify-center rounded-lg bg-[#1F4B7A] dark:bg-primary text-white px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition w-full"
        >
          ادخل السوق
        </LoadingLink>
      </div>
    </motion.div>
  );
};

// ========== شريط تنقل الأسواق ==========
export default function MarketTypeNav() {
  const visibleItems = marketItems.filter((item) => !item.isHidden);

  return (
    <div className="w-full py-8 md:py-10">
      <div className="max-w-6xl mx-auto">
        {/* العنوان الرئيسي للسكيشن */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 md:mb-10"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1F4B7A] dark:text-primary mb-3">
            اختر سوقك المتخصص
          </h2>
          <p className="text-sm md:text-base max-w-xl mx-auto text-[#009345] dark:text-[#009345]">
            كل سوق مصمم ليلبي احتياجات فئة محددة من البائعين والمشترين
          </p>
        </motion.div>

        {/* العناصر (مُتوسّطة) */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-10">
          {visibleItems.map((item, index) => (
            <MarketCard key={item.href} item={item} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

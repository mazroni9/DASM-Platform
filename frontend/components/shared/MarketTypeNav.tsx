"use client";

import React from "react";
import LoadingLink from "@/components/LoadingLink";
import { Car, Star, Gem, Home, Store, Award } from "lucide-react";
import { motion } from "framer-motion";

// ========== عناصر الأسواق ==========
const marketItems = [
  // المجموعة اليمنى - السيارات
  {
    name: "سوق معارض السيارات",
    icon: Car,
    href: "/auctions/auctions-1main",
    group: "right",
    isHidden: false,
  },
  {
    name: "سوق السيارات المتخصص",
    icon: Award, // ✅ أيقونة مختلفة بدل Car
    href: "/auctions/auctions-2car",
    group: "right",
    isHidden: false,
  },
  {
    name: "سوق الاجهزة النوعية",
    icon: Star,
    href: "/auctions/auctions-3quality",
    group: "right",
    isHidden: true, // ✅ مخفي (مش ممسوح)
  },

  // المجموعة اليسرى - العامة
  {
    name: "السوق الفريد",
    icon: Gem,
    href: "/auctions/auctions-4special",
    group: "left",
    isHidden: true, // ✅ مخفي
  },
  {
    name: "الأسواق العامة",
    icon: Home,
    href: "/auctions/auctions-5general",
    group: "left",
    isHidden: true, // ✅ مخفي
  },
  {
    name: "السوق الكبير",
    icon: Store,
    href: "/auctions/auctions-6big",
    group: "left",
    isHidden: true, // ✅ مخفي
  },
];

// ========== بطاقة سوق واحد ==========
const MarketCard = ({ item, index }: any) => {
  const Icon = item.icon;
  const isRight = item.group === "right";

  const bgColor = item.group === "right" ? "bg-primary" : "bg-secondary";

  const shadowColor =
    item.group === "right" ? "shadow-primary/20" : "shadow-secondary/20";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className="w-full max-w-sm"
    >
      <LoadingLink
        href={item.href}
        className={`
          group relative block h-full
          ${bgColor}
          rounded-2xl p-1
          shadow-lg ${shadowColor} hover:shadow-2xl
          transition-all duration-300 overflow-hidden
        `}
        aria-label={`الذهاب إلى ${item.name}`}
      >
        {/* طبقة داخلية */}
        <div className="bg-card h-full rounded-xl flex flex-col items-center justify-center px-6 py-6 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-background/60 flex items-center justify-center">
              <Icon
                className={`h-8 w-8 md:h-9 md:w-9 text-foreground ${
                  isRight ? "ml-0.5" : "mr-0.5"
                }`}
              />
            </div>
          </div>

          <h3 className="text-foreground font-semibold text-lg md:text-xl leading-snug">
            {item.name}
          </h3>

          <div className="absolute inset-0 bg-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
        </div>
      </LoadingLink>
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
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-emerald-700 dark:text-emerald-300 mb-3">
            اختر سوقك المتخصص
          </h2>
          <p className="text-sm md:text-base max-w-xl mx-auto text-foreground/70">
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

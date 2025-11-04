'use client';

import React from 'react';
import LoadingLink from "@/components/LoadingLink";
import {
  Car,
  Star,
  Gem,
  Home,
  Store,
} from 'lucide-react';
import { motion } from "framer-motion";

// ========== عناصر الأسواق ==========
const marketItems = [
  // المجموعة اليمنى - السيارات
  { name: 'سوق معارض السيارات', icon: Car, href: '/auctions/auctions-1main', group: 'right' },
  { name: 'سوق السيارات المتخصص', icon: Car, href: '/auctions/auctions-2car', group: 'right' },
  { name: 'سوق الاجهزة النوعية', icon: Star, href: '/auctions/auctions-3quality', group: 'right' },

  // المجموعة اليسرى - العامة
  { name: 'السوق الفريد', icon: Gem, href: '/auctions/auctions-4special', group: 'left' },
  { name: 'الأسواق العامة', icon: Home, href: '/auctions/auctions-5general', group: 'left' },
  { name: 'السوق الكبير', icon: Store, href: '/auctions/auctions-6big', group: 'left' },
];

// ========== زر السوق المتطور ==========
const MarketCard = ({ item, index }) => {
  const Icon = item.icon;
  const isRight = item.group === 'right';

  const gradient = 
    item.group === 'right'
      ? 'from-cyan-500 to-blue-600'
      : 'from-emerald-500 to-teal-600';

  const shadowColor = 
    item.group === 'right'
      ? 'shadow-cyan-500/20'
      : 'shadow-emerald-500/20';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="w-full max-w-xs"
    >
      <LoadingLink
        href={item.href}
        className={`
          group relative block
          h-full
          bg-gradient-to-br ${gradient}
          rounded-2xl
          p-1
          shadow-lg hover:shadow-2xl hover:${shadowColor}
          transition-all duration-300
          overflow-hidden
        `}
        aria-label={`الذهاب إلى ${item.name}`}
      >
        {/* طبقة داخلية لفصل التدرج */}
        <div className="bg-slate-900 h-full rounded-xl flex flex-col items-center justify-center p-5 text-center">
          <div className="mb-3">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <Icon className={`h-6 w-6 text-white ${isRight ? 'ml-0.5' : 'mr-0.5'}`} />
            </div>
          </div>
          <h3 className="text-white font-bold text-base leading-tight">
            {item.name}
          </h3>
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
        </div>
      </LoadingLink>
    </motion.div>
  );
};

// ========== شريط تنقل الأسواق ==========
export default function MarketTypeNav() {
  return (
    <div className="w-full py-10">
      <div className="container mx-auto px-4">
        {/* العنوان الرئيسي */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-3">
            اختر سوقك المتخصص
          </h2>
          <p className="text-base max-w-lg mx-auto">
            كل سوق مصمم ليلبي احتياجات فئة محددة من البائعين والمشترين
          </p>
        </motion.div>

        {/* العناصر مرتبة في صف واحد على الديسكتوب، و2 في التابلت، و1 في الجوال */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
          {marketItems.map((item, index) => (
            <MarketCard key={item.href} item={item} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
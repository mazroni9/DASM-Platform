'use client';

import React from 'react';
import LoadingLink from "@/components/LoadingLink";
import { Watch, Car, Home, Paintbrush, Smartphone, Leaf, Star, Gem, Store } from 'lucide-react';

const GROUP_COLORS = {
  right: {
    bg: 'bg-purple-500',
    hover: 'hover:bg-purple-600',
    text: 'text-white',
    hoverText: 'hover:text-white',
    icon: 'text-white',
  },
  left: {
    bg: 'bg-blue-500',
    hover: 'hover:bg-blue-600',
    text: 'text-white',
    hoverText: 'hover:text-white',
    icon: 'text-white',
  },
  bottom: {
    bg: 'bg-red-500',
    hover: 'hover:bg-red-600',
    text: 'text-white',
    hoverText: 'hover:text-white',
    icon: 'text-white',
  },
};

const marketItems = [
  { name: 'سوق معارض السيارات', icon: Car, href: '/auctions/auctions-1main', group: 'right' },
  { name: 'سوق السيارات المتخصص', icon: Car, href: '/auctions/auctions-2car', group: 'right' },
  { name: 'سوق الاجهزة النوعية', icon: Star, href: '/auctions/auctions-3quality', group: 'right' },

  { name: 'السوق الفريد', icon: Gem, href: '/auctions/auctions-4special', group: 'left' },
  { name: 'الأسواق العامة', icon: Home, href: '/auctions/auctions-5general', group: 'left' },
  { name: 'السوق الكبير', icon: Store, href: '/auctions/auctions-6big', group: 'left' },
];

export default function MarketTypeNav() {
  const rightItems = marketItems.filter(item => item.group === 'right');
  const leftItems = marketItems.filter(item => item.group === 'left');
  const bottomItems = marketItems.filter(item => item.group === 'bottom');

  const orderedItems = [...rightItems, ...leftItems, ...bottomItems];

  return (
    <div className="py-4 mb-6 w-full flex justify-center">
      {/* الحاوية الرئيسية مع استجابة للأحجام المختلفة */}
      <div className="w-full max-w-7xl px-2 sm:px-4 md:px-6 lg:px-8">
        {/* الحاوية للأزرار، مع تمكين التفافها وتنظيمها */}
        <div className="flex flex-wrap justify-center gap-3 mb-4">
          {orderedItems.map((item) => {
            const colorScheme = GROUP_COLORS[item.group];
            const Icon = item.icon;
            // يمكنك إضافة حالة تفعيل هنا إذا رغبت
            // const isActive = ...

            return (
              <LoadingLink
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-2 rounded-full ${colorScheme.bg} ${colorScheme.hover} ${colorScheme.text} transition-all duration-200 text-sm sm:text-base md:text-lg whitespace-nowrap`}
              >
                <Icon className={`h-5 w-5 ${item.group !== 'right' ? 'ml-2' : 'mr-2'}`} />
                {/* عرض النص فقط على الشاشات المتوسطة والكبيرة لتوفير المساحة على الشاشات الصغيرة */}
                <span className=" sm:inline">{item.name}</span>
              </LoadingLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}
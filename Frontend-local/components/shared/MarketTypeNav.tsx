'use client';

import React from 'react';
import Link from 'next/link';
import { Watch, Car, Home, Paintbrush, Smartphone, Leaf } from 'lucide-react';

// الألوان المستخدمة لمجموعات الأزرار
const GROUP_COLORS = {
  // مجموعة 1 (اليمين): أرجواني (بنفسجي)
  right: {
    bg: 'bg-purple-500',
    hover: 'hover:bg-purple-600',
    text: 'text-white',
    hoverText: 'hover:text-white',
    icon: 'text-white',
  },
  // مجموعة 2 (اليسار): أزرق
  left: {
    bg: 'bg-blue-500',
    hover: 'hover:bg-blue-600',
    text: 'text-white',
    hoverText: 'hover:text-white',
    icon: 'text-white',
  },
  // مجموعة 3 (أسفل): أحمر
  bottom: {
    bg: 'bg-red-500',
    hover: 'hover:bg-red-600',
    text: 'text-white',
    hoverText: 'hover:text-white',
    icon: 'text-white',
  },
};

// تعريف أزرار التنقل
const marketItems = [
  // المجموعة الأولى (اليمين) - البنفسجية - تم إعادة الترتيب
  { name: 'الحراج المباشر', icon: Car, href: '/auctions/auctions-main/live-market', group: 'right' },
  { name: 'السوق الفوري', icon: Smartphone, href: '/auctions/auctions-main/instant', group: 'right' },
  { name: 'السوق المتأخر', icon: Watch, href: '/auctions/auctions-main/silent', group: 'right' },

  // المجموعة الثانية (اليسار) - الزرقاء
  { name: 'الأجهزة الإلكترونية', icon: Smartphone, href: '/auctions/auctions-general/electronics', group: 'left' },
  { name: 'الأثاث المنزلي', icon: Home, href: '/auctions/auctions-general/furniture', group: 'left' },
  { name: 'المعدات العامة', icon: Paintbrush, href: '/auctions/auctions-general/equipment', group: 'left' },

  // المجموعة الثالثة (أسفل)
];

export default function MarketTypeNav() {
  // تجميع العناصر بناءً على المجموعة
  const rightItems = marketItems.filter(item => item.group === 'right');
  const leftItems = marketItems.filter(item => item.group === 'left');
  const bottomItems = marketItems.filter(item => item.group === 'bottom');
  
  // ترتيب العناصر: اليمين أولاً، ثم اليسار، ثم أسفل
  const orderedItems = [...rightItems, ...leftItems, ...bottomItems];
  
  return (
    <div className="py-4 mb-6">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-center gap-2 mb-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {orderedItems.map((item) => {
              const colorScheme = GROUP_COLORS[item.group];
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-4 py-2 rounded-full ${colorScheme.bg} ${colorScheme.hover} ${colorScheme.text} transition-colors duration-200 whitespace-nowrap`}
                >
                  <Icon className={`h-5 w-5 ${item.group !== 'right' ? 'ml-2' : 'mr-2'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 
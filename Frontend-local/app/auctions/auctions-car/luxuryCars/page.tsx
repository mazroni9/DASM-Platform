/**
 * 📝 الصفحة: سوق السيارات الفارهة
 * 📁 المسار: Frontend-local/app/auctions/auctions-car/luxuryCars/page.tsx
 *
 * ✅ الوظيفة:
 * - تعرض السيارات من category = 'cars' و subcategory = 'luxury'
 * - باستخدام بطاقة فاخرة AuctionCard
 */

'use client';

import React, { useEffect, useState } from 'react';
import { AuctionCard } from '@/components';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function LuxuryCarsPage() {
  const [cars, setCars] = useState([]);

  useEffect(() => {
    fetch('/api/items?category=cars&subcategory=luxury')
      .then(res => res.json())
      .then(setCars)
      .catch(err => console.error('فشل في تحميل السيارات الفاخرة:', err));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* زر العودة */}
        <div className="flex justify-start mb-6">
          <Link 
            href="/auctions/auctions-car"
            className="inline-flex items-center text-yellow-400 hover:text-yellow-300 transition-colors px-4 py-2 rounded-full border border-yellow-500 hover:border-yellow-400 bg-opacity-20 bg-yellow-900 hover:bg-opacity-30"
          >
            <ChevronRight className="h-4 w-4 ml-1 rtl:rotate-180" />
            <span>العودة لسوق السيارات</span>
          </Link>
        </div>

        <h1 className="text-4xl font-serif text-center text-yellow-400 mb-10">سوق السيارات الفارهة</h1>

        {cars.length === 0 ? (
          <p className="text-center text-gray-300">لا توجد سيارات فاخرة حالياً.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cars.map((item: any) => (
              <AuctionCard
                key={item.id}
                id={item.id}
                title={item.title}
                image={JSON.parse(item.images || '[]')[0]}
                current_price={item.current_price}
                auction_result={item.auction_result}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

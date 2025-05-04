
/**
 * 🧩 AuctionCard
 * 📁 المسار: Frontend-local/components/AuctionCard.tsx
 *
 * ✅ الوظيفة:
 * - عرض بطاقة سيارة تحتوي على صورة، اسم، سعر، زر تفاصيل
 * - يُستخدم في صفحات المزادات مثل الفوري أو المجوهرات
 */

'use client';

import React from 'react';
import Link from 'next/link';

interface AuctionCardProps {
  id: number;
  title: string;
  image: string;
  current_price: number;
  auction_result?: string;
}

export default function AuctionCard({ id, title, image, current_price, auction_result }: AuctionCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-4 flex flex-col">
      <img
        src={image || '/placeholder-car.jpg'}
        alt={title}
        className="w-full h-48 object-cover rounded-md mb-4"
      />
      <h3 className="text-lg font-bold text-gray-800 mb-1">{title}</h3>
      <p className="text-blue-600 font-semibold mb-2">السعر الحالي: {current_price.toLocaleString()} ريال</p>
      {auction_result && (
        <p className="text-sm text-green-600">{auction_result}</p>
      )}
      <Link
        href={`/carDetails?id=${id}`}
        className="mt-auto text-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 block text-sm"
      >
        عرض التفاصيل
      </Link>
    </div>
  );
}

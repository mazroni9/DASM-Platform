
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
  layout_type?: string;
  market?: {
    layout_type: string;
    layout_type_value?: string;
  };
}

export default function AuctionCard({ id, title, image, current_price, auction_result, layout_type, market }: AuctionCardProps) {
  // Function to get the correct route based on layout type
  const getAuctionRoute = () => {
    const auctionLayoutType = market?.layout_type_value || market?.layout_type || layout_type;
    
    // Debug logging
    console.log('AuctionCard Routing Debug:', {
      id,
      auctionLayoutType,
      market,
      layout_type
    });
    
    switch (auctionLayoutType) {
      case 'live_video':
        return '/auctions/auctions-1main/live-market';
      case 'table':
        return '/auctions/auctions-1main/silent';
      case 'showcase_cards':
        return '/auctions/auctions-2car/classic';
      case 'grid_with_filters':
        return '/auctions/auctions-4special/watches';
      case 'default_grid':
        return '/auctions/auctions-2car/luxuryCars';
      default:
        // Fallback to the original carDetails route
        console.log('Using fallback route for auction:', id);
        return `/carDetails?id=${id}`;
    }
  };

  const href = (market || layout_type)
    ? `/auctions/${id}`
    : `/carDetails?id=${id}`;

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
        href={href}
        className="mt-auto text-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 block text-sm"
      >
        عرض التفاصيل
      </Link>
    </div>
  );
}

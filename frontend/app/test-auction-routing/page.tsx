'use client';

import React from 'react';
import AuctionCard from '@/components/AuctionCard';

export default function TestAuctionRoutingPage() {
  // Test data for different layout types
  const testAuctions = [
    {
      id: 1,
      title: 'تويوتا لاندكروزر 2023 - البث المباشر',
      image: '/placeholder-car.jpg',
      current_price: 250000,
      market: { layout_type: 'live_video', layout_type_value: 'live_video' }
    },
    {
      id: 2,
      title: 'مرسيدس S-Class 2022 - جدول صامت',
      image: '/placeholder-car.jpg',
      current_price: 350000,
      market: { layout_type: 'table', layout_type_value: 'table' }
    },
    {
      id: 3,
      title: 'فيراري 458 - عرض كلاسيكي',
      image: '/placeholder-car.jpg',
      current_price: 450000,
      market: { layout_type: 'showcase_cards', layout_type_value: 'showcase_cards' }
    },
    {
      id: 4,
      title: 'رولكس دايتونا - شبكة مع فلاتر',
      image: '/placeholder-car.jpg',
      current_price: 75000,
      market: { layout_type: 'grid_with_filters', layout_type_value: 'grid_with_filters' }
    },
    {
      id: 5,
      title: 'BMW X5 2021 - شبكة افتراضية',
      image: '/placeholder-car.jpg',
      current_price: 180000,
      market: { layout_type: 'default_grid', layout_type_value: 'default_grid' }
    },
    {
      id: 6,
      title: 'أودي A8 - بدون نوع تخطيط (fallback)',
      image: '/placeholder-car.jpg',
      current_price: 220000,
      // No market data - should use fallback route
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            اختبار توجيه بطاقات المزاد
          </h1>
          <p className="text-gray-600">
            اختبار مسارات مختلفة بناءً على نوع تخطيط السوق
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testAuctions.map((auction) => (
            <div key={auction.id} className="space-y-2">
              <div className="text-xs text-gray-500 bg-white p-2 rounded border">
                <strong>نوع التخطيط:</strong> {auction.market?.layout_type_value || auction.market?.layout_type || 'غير محدد'}
              </div>
              <AuctionCard
                id={auction.id}
                title={auction.title}
                image={auction.image}
                current_price={auction.current_price}
                market={auction.market}
              />
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">مسارات الـ Layout Types:</h2>
          <ul className="space-y-2 text-sm">
            <li><strong>live_video:</strong> /auctions/auctions-1main/live-market</li>
            <li><strong>table:</strong> /auctions/auctions-1main/silent</li>
            <li><strong>showcase_cards:</strong> /auctions/auctions-2car/classic</li>
            <li><strong>grid_with_filters:</strong> /auctions/auctions-4special/watches</li>
            <li><strong>default_grid:</strong> /auctions/auctions-2car/luxuryCars</li>
            <li><strong>fallback:</strong> /carDetails?id=[ID]</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

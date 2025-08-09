'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import api from '@/lib/axios';

type Market = {
  id: number;
  name: string;
  description?: string;
  layout_type?: string;
  layout_type_value?: string;
  category?: { id: number; name: string };
};

type MarketResponse = {
  status: string;
  data: Market;
};

// Lazy-load target pages as components
const LiveMarket = dynamic(() => import('@/app/auctions/auctions-1main/live-market/page'), { ssr: false });
const SilentMarket = dynamic(() => import('@/app/auctions/auctions-1main/silent/page'), { ssr: false });
const ClassicCars = dynamic(() => import('@/app/auctions/auctions-2car/classic/page'), { ssr: false });
const WatchesMarket = dynamic(() => import('@/app/auctions/auctions-4special/watches/page'), { ssr: false });
const LuxuryCars = dynamic(() => import('@/app/auctions/auctions-2car/luxuryCars/page'), { ssr: false });

export default function AuctionPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [market, setMarket] = useState<Market | null>(null);

  const id = useMemo(() => {
    const idParam = params?.id;
    return Array.isArray(idParam) ? idParam[0] : idParam;
  }, [params]);

  useEffect(() => {
    let cancelled = false;

    const loadMarket = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await api.get<MarketResponse>(`/api/markets/${id}`);
        if (!cancelled) {
          setMarket(res.data?.data ?? null);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError('تعذر تحميل بيانات السوق.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadMarket();
    return () => { cancelled = true; };
  }, [id]);

  const layout: string | undefined = useMemo(() => {
    return market?.layout_type_value || market?.layout_type;
  }, [market]);

  const LayoutView = useMemo(() => {
    switch (layout) {
      case 'live_video':
        return LiveMarket;
      case 'table':
        return SilentMarket;
      case 'showcase_cards':
        return ClassicCars;
      case 'grid_with_filters':
        return WatchesMarket;
      case 'default_grid':
        return LuxuryCars;
      default:
        return null;
    }
  }, [layout]);

  return (
    <div className="min-h-screen">
      {/* Market Header */}
      <div className="bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {loading && (
            <div className="text-gray-600 animate-pulse">جاري تحميل تفاصيل السوق…</div>
          )}
          {!loading && market && (
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-blue-800">{market.name}</h1>
              {market.category?.name && (
                <div className="text-sm text-blue-700">الفئة: {market.category.name}</div>
              )}
              {market.description && (
                <p className="text-gray-700 text-sm">{market.description}</p>
              )}
            </div>
          )}
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
        </div>
      </div>

      {/* Layout Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {LayoutView ? (
          // Render the selected layout component inline
          <LayoutView />
        ) : (
          !loading && (
            <div className="text-center text-gray-600">
              لا يوجد نوع تخطيط معروف لهذا السوق.
            </div>
          )
        )}
      </div>
    </div>
  );
}

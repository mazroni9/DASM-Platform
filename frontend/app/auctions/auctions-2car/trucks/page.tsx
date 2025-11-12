'use client';

import React, { useEffect, useState } from 'react';
import LoadingLink from "@/components/LoadingLink";
import AuctionCard from '@/components/AuctionCard';
import { ArrowLeft } from 'lucide-react';
import axios from '@/lib/axios';

type CarItem = {
  id: number|string;
  make?: string;
  model?: string;
  year?: number|string;
  images?: string[] | string | null;
  status?: string | boolean;            // approved/accepted/true
  approved?: boolean;
  is_approved?: boolean;
  approval_status?: string;
  active_auction?: { id: number|string; current_price?: number|string; status?: string } | null;
  activeAuction?: { id: number|string; current_price?: number|string; status?: string } | null;
  auction_status?: string;
  active_status?: string;
  current_price?: number|string;
  auction_result?: any;
};

const MARKET = 'trucks';

const resolveMarketEndpoint = () => {
  try {
    const base = (axios as any).defaults?.baseURL ?? '';
    return String(base).endsWith('/api') ? '/market/cars' : '/api/market/cars';
  } catch {
    return '/api/market/cars';
  }
};

const isApproved = (it: CarItem) => {
  const v: any = it.status ?? it.approval_status ?? it.approved ?? it.is_approved;
  if (typeof v === 'string') {
    const s = v.toLowerCase();
    return s === 'approved' || s === 'accept' || s === 'accepted';
  }
  return Boolean(v);
};

const isActiveAuction = (it: CarItem) => {
  const s = (it.active_auction?.status ?? it.activeAuction?.status ?? it.auction_status ?? it.active_status ?? '')
    .toString().toLowerCase();
  return s === 'active' || s === 'on' || s === 'running';
};

const firstImage = (images: CarItem['images']) => {
  try {
    if (!images) return '/placeholder-car.jpg';
    if (Array.isArray(images)) return images[0] || '/placeholder-car.jpg';
    const str = String(images);
    if (str.trim().startsWith('[')) {
      const arr = JSON.parse(str);
      return Array.isArray(arr) && arr[0] ? arr[0] : '/placeholder-car.jpg';
    }
    return str;
  } catch {
    return '/placeholder-car.jpg';
  }
};

const titleOf = (item: CarItem) => {
  const parts = [item.year, item.make, item.model].filter(Boolean);
  return parts.length ? parts.join(' - ') : 'مركبة';
};

const priceOf = (item: CarItem) =>
  item.active_auction?.current_price ??
  item.activeAuction?.current_price ??
  item.current_price ?? null;

export default function TrucksMarketPage() {
  const [items, setItems] = useState<CarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const endpoint = resolveMarketEndpoint();
        const res = await axios.get(endpoint, { params: { market: MARKET, per_page: 12 } });
        const d = res?.data;
        let list: any[] = [];
        if (Array.isArray(d?.data)) list = d.data;
        else if (Array.isArray(d?.data?.data)) list = d.data.data;
        else if (Array.isArray(d)) list = d;

        // فلترة المقبول + مزاد Active
        const filtered = (list as CarItem[]).filter((it) => isApproved(it) && isActiveAuction(it));

        if (mounted) {
          setItems(filtered);
          setCount(filtered.length);
        }
      } catch (e: any) {
        if (mounted) setErr(e?.message || 'تعذر جلب بيانات السوق');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* رجوع */}
        <div className="flex justify-start mb-6">
          <LoadingLink
            href="/auctions/auctions-2car"
            className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors px-4 py-2 rounded-full border border-blue-500 hover:border-blue-400 bg-opacity-20 bg-blue-900 hover:bg-opacity-30"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            <span>العودة إلى سوق السيارات</span>
          </LoadingLink>
        </div>

        <h1 className="text-4xl font-serif text-center text-blue-300 mb-2">سوق الشاحنات</h1>
        <p className="text-center text-gray-400 mb-10">يُعرض هنا فقط الشاحنات المقبولة والتي لديها مزاد بحالة Active</p>

        {loading && <p className="text-center text-white mb-6">جاري التحميل...</p>}
        {err && <div className="text-center text-red-400 mb-6 p-4 bg-gray-800 rounded">خطأ: {err}</div>}
        {!loading && typeof count === 'number' && (
          <div className="mb-6 text-center text-xs text-gray-400">عدد النتائج: {count}</div>
        )}

        {!loading && items.length === 0 ? (
          <p className="text-center text-gray-300">لا توجد شاحنات متاحة حالياً.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((it) => {
              const cardProps: any = {
                // نمرر كـ any لتفادي اختلاف أنواع AuctionCardProps
                title: titleOf(it),
                image: firstImage(it.images),
                current_price: priceOf(it),
                auction_result: it.auction_result ?? null,
              };
              return <AuctionCard key={String(it.id)} {...cardProps} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

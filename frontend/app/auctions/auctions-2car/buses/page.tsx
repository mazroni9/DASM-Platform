'use client';

import React, { useEffect, useState } from 'react';
import LoadingLink from "@/components/LoadingLink";
import AuctionCard from '@/components/AuctionCard';
import { ArrowLeft } from 'lucide-react';
import axios from '@/lib/axios';

type CarItem = {
  id: number | string;
  make?: string;
  model?: string;
  year?: number | string;
  images?: string[] | string | null;
  status?: string | boolean;
  approved?: boolean;
  is_approved?: boolean;
  approval_status?: string;
  active_auction?: { id: number | string; current_price?: number | string; status?: string } | null;
  activeAuction?: { id: number | string; current_price?: number | string; status?: string } | null;
  auction_status?: string;
  active_status?: string;
  current_price?: number | string;
  auction_result?: any;
};

const MARKET = 'buses';

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
  const s = (
    it.active_auction?.status ??
    it.activeAuction?.status ??
    it.auction_status ??
    it.active_status ??
    ''
  )
    .toString()
    .toLowerCase();

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
  item.current_price ??
  null;

export default function BusesMarketPage() {
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

        const filtered = (list as CarItem[]).filter(
          (it) => isApproved(it) && isActiveAuction(it)
        );

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
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* بانر الهيرو */}
      <div className="relative h-64 md:h-72 bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-background/10" />
        <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10">
          <LoadingLink
            href="/auctions/auctions-2car"
            className="flex items-center text-primary-foreground/80 hover:text-primary-foreground mb-6 transition"
          >
            <ArrowLeft size={20} className="ml-2" />
            <span>العودة لسوق السيارات</span>
          </LoadingLink>

          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-3">
            سوق الحافلات
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl">
            يُعرض هنا فقط الحافلات المقبولة والتي لديها مزاد بحالة فعّالة (Active)،
            لتضمن صفقات واضحة ومباشرة لمشاريع النقل والحلول الجماعية.
          </p>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="container mx-auto px-4 py-10">
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 md:p-8">
          {/* حالة التحميل / الخطأ / عدد النتائج */}
          {loading && (
            <p className="text-center text-muted-foreground mb-6">
              جاري تحميل الحافلات المتاحة...
            </p>
          )}

          {err && (
            <div className="mb-6 text-center text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3">
              خطأ: {err}
            </div>
          )}

          {!loading && typeof count === 'number' && (
            <p className="text-center text-xs text-muted-foreground mb-6">
              عدد النتائج: {count}
            </p>
          )}

          {/* الشبكة */}
          {!loading && items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              لا توجد حافلات متاحة حالياً في هذا السوق.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((it) => {
                const cardProps: any = {
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
    </div>
  );
}

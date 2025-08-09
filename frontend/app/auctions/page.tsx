/**
 * ==================================================
 * ملف: frontend/app/auctions/page.tsx
 * الغرض: صفحة عرض جميع أسواق المزادات
 * الارتباطات: 
 *  - يعرض كافة أقسام المزادات المتوفرة
 *  - يوفر روابط للصفحات الفرعية للمزادات المختلفة
 *  - يستخدم مكونات فرعية لعرض بطاقات المزادات
 * ==================================================
 */

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Car, Truck, Building2, Stethoscope, Printer, Server, Leaf, Timer, BellOff, BadgeCheck, Building, Video, Star, Gem, Sailboat, Home, Plane, Watch, Brush, Smartphone, Sofa, PencilRuler, Scale, Store, ShoppingBag, Gift
} from 'lucide-react';
import api from '@/lib/axios';

const ICONS = {
  Car,
  Truck,
  Building2,
  Stethoscope,
  Printer,
  Server,
  Leaf,
  Timer,
  BellOff,
  BadgeCheck,
  Building,
  Video,
  Star,
  Gem,
  Sailboat,
  Home,
  Plane,
  Watch,
  Brush,
  Smartphone,
  Sofa,
  PencilRuler,
  Scale,
  Store,
  ShoppingBag,
  Gift,
};

export default function AuctionsPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarkets();
  }, []);

  const fetchMarkets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/markets');
      setCategories(response.data.data || []);
    } catch (error) {
      // Optionally show error
    } finally {
      setLoading(false);
    }
  };

  const Divider = () => (
    <div className="col-span-full my-8">
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded"></div>
    </div>
  );

  const SectionTitle = ({ title, link = null, linkText = null }) => (
    <div className="col-span-full mb-6 mt-8 flex flex-col justify-center items-center">
      <h2 className="text-2xl font-bold text-blue-600 py-2 px-8 bg-blue-50 shadow-sm rounded-md text-center">
        {title}
      </h2>
      {link && linkText && (
        <Link 
          href={link}
          className="mt-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium rounded-lg border border-blue-200 hover:border-blue-300 transition"
        >
          {linkText}
        </Link>
      )}
    </div>
  );

  const AuctionCard = ({ auction }) => {
    const Icon = ICONS[auction.icon] || Store;
    return (
      <Link
        key={auction.slug}
        href={`/auctions/${auction.slug}`}
        className={`group flex flex-col items-center border rounded-xl shadow hover:shadow-lg p-6 ${auction.bg_color || ''} hover:bg-white transition-all duration-300 h-full`}
      >
        <div className={`p-3 rounded-full ${auction.color || ''} bg-white mb-4`}>
          <Icon size={24} />
        </div>
        <h3 className={`text-xl font-bold ${auction.color || ''} mb-2 text-center`}>{auction.name}</h3>
        <p className="text-sm text-gray-600 text-center mb-4 flex-grow whitespace-pre-line">
          {auction.description}
        </p>
        <div className="mt-auto">
          <span className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-full bg-white group-hover:bg-blue-500 text-gray-700 group-hover:text-white transition-colors duration-300">
            اضغط للدخول
          </span>
        </div>
      </Link>
    );
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <span className="text-xl text-blue-600">جاري تحميل الأسواق...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-end mb-4">
        <Link href="/" className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium">الرئيسية</Link>
      </div>

      <div className="bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 rounded-xl shadow-md p-6 mb-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-center text-center">
          <div className="p-3 rounded-full bg-white text-blue-600 shadow-sm mr-3">
            <Scale size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-blue-800">صفحة جميع الاسواق</h1>
            <p className="text-sm text-gray-700 leading-relaxed">
              نلغي لعبة التقييمات الجائرة عبر مزايدة عادلة بسعر بائع مخفي.
              المنافسة تعتمد على العرض والطلب الطبيعي
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat, idx) => (
          <>
            <SectionTitle key={cat.id + '-title'} title={cat.name} />
            {cat.markets && cat.markets.length > 0 ? (
              cat.markets.map((market) => <AuctionCard key={market.id} auction={market} />)
            ) : (
              <div className="col-span-full text-center text-gray-400">لا توجد أسواق في هذا القسم</div>
            )}
            {idx !== categories.length - 1 && <Divider key={cat.id + '-divider'} />}
          </>
        ))}
      </div>
    </main>
  );
}

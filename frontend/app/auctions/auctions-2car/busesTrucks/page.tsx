/**
 * 📝 الصفحة: مزادات الحافلات والشاحنات
 * 📁 المسار: Frontend-local/app/auctions/auctions-2car/busesTrucks/page.tsx
 *
 * ✅ الوظيفة:
 * - عرض قائمة الشاحنات والحافلات المتاحة للمزاد
 * - تصفية وفرز المركبات حسب النوع والسنة والماركة
 * - عرض تفاصيل أولية وصور للمركبات
 * 
 * 🔄 الارتباطات:
 * - تنتقل من: الصفحة الرئيسية لمزادات السيارات
 * - يتم التنقل إلى: صفحات تفاصيل المركبات الفردية
 */

'use client';

import React, { useEffect, useState } from 'react';
import AuctionCard from '@/components/AuctionCard';
import LoadingLink from "@/components/LoadingLink";
import { ArrowLeft } from 'lucide-react';

export default function BusesTrucksPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<any>(null);

  useEffect(() => {
    console.log('🔄 جاري تحميل بيانات الحافلات والشاحنات...');
    setLoading(true);
    
    fetch('/api/items?category=cars&subcategory=busesTrucks')
      .then(res => {
        console.log('📊 استجابة API:', { status: res.status, ok: res.ok });
        if (!res.ok) {
          throw new Error(`خطأ في الاستجابة: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('📦 بيانات من API:', { length: data?.length, data });
        setDebug(data);
        setVehicles(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ فشل في تحميل الحافلات والشاحنات:', err);
        setError(err?.message || 'حدث خطأ أثناء تحميل البيانات');
        setLoading(false);
      });
  }, []);

  // معالجة الصورة بشكل آمن
  const getImageUrl = (imagesStr: string | null) => {
    try {
      if (!imagesStr) return '/placeholder-car.jpg';
      
      const images = JSON.parse(imagesStr);
      return Array.isArray(images) && images.length > 0 ? images[0] : '/placeholder-car.jpg';
    } catch (err) {
      console.error('❌ خطأ في تحليل JSON للصور:', err, { imagesStr });
      return '/placeholder-car.jpg';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* زر العودة إلى سوق السيارات */}
        <div className="flex justify-start mb-6">
          <LoadingLink 
            href="/auctions/auctions-2car" 
            className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors px-4 py-2 rounded-full border border-blue-500 hover:border-blue-400 bg-opacity-20 bg-blue-900 hover:bg-opacity-30"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            <span>العودة إلى سوق السيارات</span>
          </LoadingLink>
        </div>

        <h1 className="text-4xl font-serif text-center text-yellow-400 mb-10">سوق الشاحنات والحافلات</h1>

        {loading && (
          <p className="text-center text-white mb-4">جاري تحميل البيانات...</p>
        )}

        {error && (
          <div className="text-center text-red-400 mb-4 p-4 bg-gray-800 rounded">
            <p>خطأ: {error}</p>
          </div>
        )}

        {!loading && debug && (
          <div className="mb-4 text-center text-xs text-gray-400">
            عدد النتائج: {Array.isArray(debug) ? debug.length : 'لا توجد بيانات'}
          </div>
        )}

        {!loading && vehicles.length === 0 ? (
          <p className="text-center text-gray-300">لا توجد حافلات أو شاحنات متاحة حالياً.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vehicles.map((item: any) => (
              <AuctionCard
                key={item.id}
                id={item.id}
                title={item.title}
                image={getImageUrl(item.images)}
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

/**
 * 📝 الصفحة: عرض مزادات المجوهرات والحلي
 * 📁 المسار: Frontend-local/app/auctions/auctions-special/jewelry/page.tsx
 * 
 * ✅ الوظيفة:
 * - تعرض هذه الصفحة جميع القطع المضافة من نوع المجوهرات (category = "jewelry")
 * - تسحب البيانات تلقائيًا من API: /api/items?category=jewelry (GET)
 * 
 * ✅ البيانات المعروضة:
 * - اسم القطعة، الوصف، السعر الحالي، الصور، الوزن، نوع المعدن، وغير ذلك.
 * 
 * ✅ طريقة الربط:
 * - البيانات تأتي من قاعدة البيانات SQLite (auctions.db)
 * - تعتمد على جدول موحد اسمه: items
 * 
 * ✅ الفائدة:
 * - تستخدم هذه الصفحة كواجهة للمستخدمين لرؤية المجوهرات المعروضة في المزاد.
 * - يتم عرضها تلقائيًا بعد إدخالها من خلال نموذج الإدخال: /forms/jewelry-auction-request
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';

export default function JewelryAuctionsPage() {
  const [items, setItems] = useState([]);
  const currentPageUrl = '/auctions/auctions-special/jewelry';

  useEffect(() => {
    fetch('/api/items?category=jewelry')
      .then(res => res.json())
      .then(setItems)
      .catch(err => console.error('فشل في تحميل المجوهرات:', err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* رأس الصفحة */}
      <PageHeader 
        title="مزادات المجوهرات والحلي"
        backUrl="/auctions/auctions-special"
        backLabel="العودة إلى المزادات الخاصة"
        gradient={true}
        color="purple"
      />

      <div className="container mx-auto px-4 py-8">
        {items.length === 0 ? (
          <p className="text-center text-gray-500">لا توجد قطع مجوهرات مضافة حاليًا.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item: any) => (
              <div key={item.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                <div className="mb-4">
                  <img
                    src={JSON.parse(item.images || '[]')[0] || '/placeholder-jewelry.jpg'}
                    alt={item.title}
                    className="w-full h-60 object-cover rounded-lg"
                  />
                </div>
                <h3 className="text-xl font-bold text-purple-800 mb-2">{item.title}</h3>
                <p className="text-gray-600 mb-2">{item.description}</p>
                <div className="text-lg text-purple-600 font-semibold mb-2">السعر الحالي: {item.current_price} ريال</div>
                {item.additional_info && (
                  <div className="text-sm text-gray-500 space-y-1">
                    {(() => {
                      const info = JSON.parse(item.additional_info);
                      return (
                        <>
                          <div>الوزن: {info.weight} جم</div>
                          <div>نوع المعدن: {info.metalType}</div>
                          <div>عيار الذهب: {info.karat}</div>
                        </>
                      );
                    })()}
                  </div>
                )}
                
                <Link 
                  href={`/auctions/auctions-special/jewelry/bid/${item.id}?from=${currentPageUrl}`}
                  className="mt-4 block w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition text-center"
                >
                  قدم عرضك
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

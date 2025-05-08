'use client';

// ✅ صفحة عرض السوق الصامت مع رابط للتفاصيل السيارة
// المسار: /pages/silent/page.tsx

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

// لا نستطيع إستيراد sqlite3 أو أي مكتبات قاعدة بيانات أخرى في جانب العميل!
// حذف:
// import sqlite3 from 'sqlite3';
// import { open } from 'sqlite';

interface Car {
  id: string;
  الماركة: string;
  الموديل: string;
  "سنة الصنع": number;
  "رقم اللوحة": string;
  "رقم العداد": number;
  "حالة السيارة": string;
  "الحالة في المزاد": string;
  "لون السيارة": string;
  "نوع الوقود": string;
  "المزايدات المقدمة": number;
  "سعر الإفتتاح": number;
  "أقل سعر": number;
  "أعلى سعر": number;
  "آخر سعر": number;
  "التغير": number;
  "نسبة التغير": string;
  "نتيجة المزايدة": string;
  "آخر سعر في الصامت"?: number;
  "نسبة التغير.1"?: string;
}

export default function SilentAuctionPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/silent-auctions')
      .then(res => {
        if (!res.ok) {
          throw new Error(`فشل في الإتصال بالخادم: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        // تعامل مع هيكل البيانات الجديد الذي قمنا بتحديثه في API
        setCars(Array.isArray(data.data) ? data.data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('فشل تحميل بيانات المزاد الصامت', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-4">
      {/* زر العودة في أعلى يمين الصفحة */}
      <div className="flex justify-end mb-4">
        <Link 
          href="/auctions" 
          className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors px-3 py-1 text-sm rounded-full border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100"
        >
          <ChevronRight className="h-4 w-4 ml-1 rtl:rotate-180" />
          <span>العودة</span>
        </Link>
      </div>

      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">السوق المتأخر</h1>
        <div className="text-sm text-purple-600 mt-1">وقت السوق من 10 مساءً إلى 4 عصراً اليوم التالي</div>
        <p className="text-gray-600 mt-3 text-sm">مكمل للسوق الفوري المباشر في تركيبته ويختلف أنه ليس به بث مباشر وصاحب العرض يستطيع أن يغير سعر بالسالب أو الموجب بحد لا يتجاوز 10% من سعر إغلاق الفوري</p>
      </div>
      
      {/* عرض الحالة */}
      {loading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      )}
      
      {!loading && !error && cars.length === 0 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>لا توجد سيارات متاحة في السوق الصامت حالياً</p>
        </div>
      )}
      
      {!loading && !error && cars.length > 0 && (
        <div className="overflow-x-auto">
          {/* خط فاصل بين المزاد الفوري والصامت */}
          <div className="w-full border-b-2 border-gray-800 my-4"></div>
          <p className="text-gray-600 mb-4">🕙 عند الساعة 10 مساءً يتم التحول من السوق الفوري المباشر إلى المزاد الصامت. الأسعار أدناه هي أسعار المزاد الصامت.</p>
          
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                {[
                  'الماركة','الموديل','سنة الصنع','رقم اللوحة','العداد','حالة السيارة',
                  'لون السيارة','نوع الوقود','سعر الإفتتاح','آخر سعر','التغير','نسبة التغير','تفاصيل'
                ].map((header, idx) => (
                  <th key={idx} className="border p-2 text-sm">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cars.map((car, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="p-2 text-sm">{car.الماركة}</td>
                  <td className="p-2 text-sm">{car.الموديل}</td>
                  <td className="p-2 text-sm">{car["سنة الصنع"]}</td>
                  <td className="p-2 text-sm">{car["رقم اللوحة"]}</td>
                  <td className="p-2 text-sm">{car["رقم العداد"]}</td>
                  <td className="p-2 text-sm">{car["حالة السيارة"] || 'جيدة'}</td>
                  <td className="p-2 text-sm">{car["لون السيارة"]}</td>
                  <td className="p-2 text-sm">{car["نوع الوقود"]}</td>
                  <td className="p-2 text-sm">{car["سعر_افتتاح_الصامت"]?.toLocaleString() || '-'}</td>
                  <td className="p-2 text-sm">{car["آخر سعر"]?.toLocaleString() || '-'}</td>
                  <td className="p-2 text-sm">{car["التغير"]?.toLocaleString() || '-'}</td>
                  <td className="p-2 text-sm">{car["نسبة_التغير"] || '-'}</td>
                  <td className="p-2 text-sm text-blue-600 underline">
                    <a href={`/car/${car.id}`} target="_blank">عرض</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

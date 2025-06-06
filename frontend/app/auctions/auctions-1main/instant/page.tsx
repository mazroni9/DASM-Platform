'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Car {
  id: number;
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
  "سعر الافتتاح": number;
  "اقل سعر": number;
  "اعلى سعر": number;
  "اخر سعر": number;
  "التغير": number;
  "نسبة التغير": string;
  "نتيجة المزايدة": string;
}

export default function InstantAuctionPage() {
  const [cars, setCars] = useState<Car[]>([]);

  useEffect(() => {
    fetch('/api/instant-auctions')
      .then(res => res.json())
      .then(data => setCars(data))
      .catch(err => console.error('فشل تحميل بيانات السوق الفوري المباشر', err));
  }, []);

  return (
    <div className="p-4">
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
        <h1 className="text-2xl font-bold">السوق الفوري المباشر - جميع السيارات</h1>
        <div className="text-sm text-purple-600 mt-1">وقت السوق من 7 مساءً إلى 10 مساءً كل يوم</div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              {[
                'الماركة', 'الموديل', 'سنة الصنع', 'رقم اللوحة', 'العداد', 'حالة السيارة', 'الحالة في المزاد',
                'لون السيارة', 'نوع الوقود', 'المزايدات المقدمة', 'سعر الافتتاح', 'اقل سعر', 'اعلى سعر',
                'اخر سعر', 'التغير', 'نسبة التغير', 'نتيجة المزايدة', 'تفاصيل'
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
                <td className="p-2 text-sm">{car["حالة السيارة"]}</td>
                <td className="p-2 text-sm">{car["الحالة في المزاد"]}</td>
                <td className="p-2 text-sm">{car["لون السيارة"]}</td>
                <td className="p-2 text-sm">{car["نوع الوقود"]}</td>
                <td className="p-2 text-sm">{car["المزايدات المقدمة"]}</td>
                <td className="p-2 text-sm">{car["سعر_الافتتاح_المحسوب"]}</td>
                <td className="p-2 text-sm">{car["اقل سعر"]}</td>
                <td className="p-2 text-sm">{car["اعلى سعر"]}</td>
                <td className="p-2 text-sm">{car["اخر سعر"]}</td>
                <td className="p-2 text-sm">{car["التغير"]}</td>
                <td className="p-2 text-sm">{car["نسبة التغير"]}</td>
                <td className="p-2 text-sm">{car["نتيجة المزايدة"]}</td>
                <td className="p-2 text-sm text-blue-600 underline">
                  <a href={`/carDetails/${car.id}`} target="_blank">عرض</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

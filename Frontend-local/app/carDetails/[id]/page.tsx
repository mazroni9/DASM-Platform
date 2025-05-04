/**
 * 📝 صفحة تفاصيل السيارة بمعرف محدد
 * 📁 المسار: Frontend-local/app/carDetails/[id]/page.tsx
 *
 * ✅ الوظيفة:
 * - عرض تفاصيل السيارة عند توفر معرف صحيح
 * - توجيه المستخدم لإضافة سيارة جديدة في حالة عدم وجود بيانات
 * 
 * 🔄 الارتباط:
 * - يستخدم مكون: @/components/CarDataEntryButton
 */

'use client';

// ✅ صفحة عرض المزاد الصامت مع رابط للتفاصيل السيارة
// المسار: /pages/silent/page.tsx

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCurrentAuctionType } from '@/lib/time-utils';
import { ChevronRight, Car } from 'lucide-react';
import CarDataEntryButton from '@/components/CarDataEntryButton';

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

export default function CarDetailPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) {
      setError('معرف المركبة غير موجود');
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/cars/${params.id}`)
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('لم يتم العثور على السيارة');
          }
          throw new Error(`فشل في الإتصال بالخادم: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setItem(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('فشل تحميل بيانات السيارة', err);
        setError(err.message);
        setLoading(false);
      });
  }, [params.id]);

  // صفحة التحميل
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">جاري تحميل البيانات...</div>
      </div>
    );
  }

  // صفحة الخطأ - مع إتاحة خيار إضافة سيارة جديدة
  if (error || !item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="flex items-center text-red-600 mb-4">
          <Car className="h-8 w-8 ml-2" />
          <span className="text-2xl font-bold">{error || 'معرف المركبة غير موجود'}</span>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-center mt-4">
          <Link 
            href="/auctions" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors px-4 py-2 text-base rounded-full border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100"
          >
            <ChevronRight className="h-5 w-5 ml-1 rtl:rotate-180" />
            <span>العودة إلى المزادات</span>
          </Link>
          <div className="my-4 text-gray-500">أو</div>
          <CarDataEntryButton label="إدخال بيانات سيارتك" variant="primary" />
        </div>
        
        <div className="mt-8 max-w-lg text-center text-gray-600 p-6 bg-white rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">هل تريد إضافة سيارتك؟</h2>
          <p className="mb-4">
            يمكنك إدخال بيانات سيارتك وإضافة صورها وتقارير فحصها من خلال النموذج المخصص للإضافة.
            بعد الإضافة، ستظهر سيارتك في المزادات المتاحة وفقًا للنظام.
          </p>
          <div className="mt-4">
            <CarDataEntryButton label="إضافة سيارة جديدة الآن" variant="secondary" />
          </div>
        </div>
      </div>
    );
  }

  // عرض بيانات السيارة إذا تم العثور عليها
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* زر العودة */}
        <div className="flex justify-between items-center mb-6">
          <Link 
            href="/auctions" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors px-3 py-1 text-sm rounded-full border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100"
          >
            <ChevronRight className="h-4 w-4 ml-1 rtl:rotate-180" />
            <span>العودة إلى المزادات</span>
          </Link>
          
          <button
            onClick={async () => {
              const type = getCurrentAuctionType();
              const resultText =
                type === 'live'
                  ? 'تم البيع في الحراج المباشر'
                  : type === 'instant'
                  ? 'تم البيع في المزاد الفوري'
                  : 'تم البيع في المزاد الصامت';

              await fetch('/api/items/confirm-sale', {
                method: 'POST',
                body: JSON.stringify({
                  itemId: item.id,
                  result: resultText,
                }),
                headers: {
                  'Content-Type': 'application/json',
                },
              });

              alert(resultText);
            }}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded"
          >
            تأكيد البيع
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            {item.الماركة} {item.الموديل} - {item["سنة الصنع"]}
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* قسم الصور (يمكن إضافته لاحقاً) */}
            <div className="bg-gray-100 rounded-lg h-80 flex items-center justify-center">
              <div className="text-gray-500">صورة السيارة</div>
            </div>
            
            {/* بيانات السيارة */}
            <div>
              <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-2xl font-bold text-blue-600">
                  آخر سعر: {item["آخر سعر"]?.toLocaleString() || '-'} ريال
                </p>
                {item["نتيجة المزايدة"] && (
                  <p className="text-lg text-green-600 mt-2">{item["نتيجة المزايدة"]}</p>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm">الماركة</p>
                    <p className="font-semibold">{item.الماركة}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">الموديل</p>
                    <p className="font-semibold">{item.الموديل}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">سنة الصنع</p>
                    <p className="font-semibold">{item["سنة الصنع"]}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">رقم اللوحة</p>
                    <p className="font-semibold">{item["رقم اللوحة"]}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">رقم العداد</p>
                    <p className="font-semibold">{item["رقم العداد"]?.toLocaleString() || '-'} كم</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">نوع الوقود</p>
                    <p className="font-semibold">{item["نوع الوقود"] || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">حالة السيارة</p>
                    <p className="font-semibold">{item["حالة السيارة"] || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">لون السيارة</p>
                    <p className="font-semibold">{item["لون السيارة"] || '-'}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-gray-500 text-sm mb-2">معلومات المزاد</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-sm">سعر الإفتتاح</p>
                      <p className="font-semibold">{item["سعر الإفتتاح"]?.toLocaleString() || '-'} ريال</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">أقل سعر</p>
                      <p className="font-semibold">{item["أقل سعر"]?.toLocaleString() || '-'} ريال</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">أعلى سعر</p>
                      <p className="font-semibold">{item["أعلى سعر"]?.toLocaleString() || '-'} ريال</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">المزايدات المقدمة</p>
                      <p className="font-semibold">{item["المزايدات المقدمة"] || '0'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ صفحة عرض تفاصيل السيارة في المزاد (App Router)
// المسار: app/carDetails/[id]/page.tsx

'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Car {
  id: number;
  الماركة: string;
  الموديل: string;
  "سنة الصنع": number;
  "رقم اللوحة": string;
  "رقم العداد": number;
  "حالة السيارة": string;
  "لون السيارة": string;
  "نوع الوقود": string;
  "اخر سعر": number;
  "عدد الصور"?: number;
  "رابط تقرير الفحص"?: string;
  "رابط البث"?: string;
}

export default function CarDetailsPage() {
  const { id } = useParams();
  const [car, setCar] = useState<Car | null>(null);

  useEffect(() => {
    if (id) {
      fetch(`/api/car/${id}`)
        .then(res => res.json())
        .then(data => setCar(data))
        .catch(err => console.error('خطأ في تحميل السيارة', err));
    }
  }, [id]);

  if (!car) return <div className="p-6">جاري تحميل بيانات السيارة...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6">
      {/* بيانات السيارة */}
      <div className="w-full lg:w-1/3 bg-white shadow rounded p-4 space-y-2">
        <h2 className="text-xl font-bold mb-2">مواصفات السيارة</h2>
        <p>الماركة: {car.الماركة}</p>
        <p>الموديل: {car.الموديل}</p>
        <p>سنة الصنع: {car["سنة الصنع"]}</p>
        <p>رقم اللوحة: {car["رقم اللوحة"]}</p>
        <p>العداد: {car["رقم العداد"]} كم</p>
        <p>الحالة: {car["حالة السيارة"]}</p>
        <p>اللون: {car["لون السيارة"]}</p>
        <p>الوقود: {car["نوع الوقود"]}</p>
        <p className="text-blue-600 font-semibold">آخر سعر: {car["اخر سعر"].toLocaleString()} ريال</p>
        {car["رابط تقرير الفحص"] && (
          <a href={car["رابط تقرير الفحص"]} target="_blank" className="text-blue-500 underline text-sm">عرض تقرير الفحص PDF</a>
        )}
      </div>

      {/* صور + بث */}
      <div className="flex-1 space-y-4">
        {/* صور */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Array.from({ length: car["عدد الصور"] || 1 }).map((_, i) => (
            <img
              key={i}
              src={`/auctionsPIC/main-instantPIC/${car.id}_${i + 1}.jpg`}
              alt={`صورة ${i + 1}`}
              className="rounded border"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          ))}
        </div>

        {/* بث مباشر */}
        {car["رابط البث"] && (
          <div className="aspect-video">
            <iframe
              src={car["رابط البث"]}
              allow="autoplay"
              allowFullScreen
              className="w-full h-full rounded"
            />
          </div>
        )}

        {/* المزايدة */}
        <div className="bg-gray-50 p-4 border rounded shadow">
          <h3 className="font-semibold mb-2">قدم مزايدتك الآن</h3>
          <div className="flex gap-2 mb-2">
            {[100, 300, 500, 750, 1000].map(step => (
              <button key={step} className="bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded text-sm">
                +{step}
              </button>
            ))}
          </div>
          <input
            type="number"
            placeholder={`أدخل مبلغ أعلى من ${car["اخر سعر"]}`}
            className="w-full border p-2 rounded text-right"
          />
          <button className="mt-2 w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">تأكيد المزايدة</button>
        </div>
      </div>
    </div>
  );
}

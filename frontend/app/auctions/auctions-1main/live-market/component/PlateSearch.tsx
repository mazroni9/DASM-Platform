/**
 * 🧩 المكون: إدخال رقم لوحة السيارة
 * 📁 المسار: داخل صفحة live-market/page.tsx
 *
 * ✅ الوظيفة:
 * - إدخال رقم اللوحة يدويًا
 * - عند الإدخال، يتم جلب بيانات السيارة المرتبطة من API
 * - يعرض بطاقة السيارة مباشرة بجانب البث
 */

'use client';

import React, { useState } from 'react';

export default function PlateSearch() {
  const [plate, setPlate] = useState('');
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!plate.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/live-market/plate?plate=${plate}`);
    const data = await res.json();
    setCar(data || null);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <div className="flex flex-row-reverse items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-blue-800 whitespace-nowrap">البحث عن سيارة برقم اللوحة</h3>
        <div className="relative flex-1">
          <input
            type="text"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="أدخل رقم اللوحة مثل XYZ987"
            className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="absolute left-0 top-0 h-full bg-blue-600 text-white px-6 rounded-l-lg hover:bg-blue-700 whitespace-nowrap"
          >
            {loading ? 'جارٍ البحث...' : 'بحث'}
          </button>
        </div>
      </div>

      {car && car.title && (
        <div className="mt-6 border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xl font-bold mb-3 text-red-700">{car.title}</h4>
              <p className="text-gray-700 mb-2">الوصف: {car.description}</p>
              <p className="text-gray-700 mb-2">رقم الشاصي: {car.vin}</p>
              <p className="text-lg font-bold text-blue-600 mt-2">السعر الحالي: {car.current_price} ريال</p>
            </div>
            <div>
              {car.additional_info && (() => {
                const info = JSON.parse(car.additional_info);
                return (
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li><span className="font-semibold">الموديل:</span> {info.year}</li>
                    <li><span className="font-semibold">الوقود:</span> {info.fuel_type}</li>
                    <li><span className="font-semibold">اللون:</span> {info.color}</li>
                    <li><span className="font-semibold">العداد:</span> {info.mileage} كم</li>
                    <li><span className="font-semibold">الشركة المفحصة:</span> {info.inspection_company}</li>
                  </ul>
                );
              })()}
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              الانتقال إلى صفحة السيارة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Search, AlertCircle, Car, Loader2, Eye } from 'lucide-react';
import LoadingLink from '@/components/LoadingLink';
import { formatCurrency } from '@/utils/formatCurrency';

// =============== أنواع TypeScript ===============
interface CarInfo {
  year?: string;
  fuel_type?: string;
  color?: string;
  mileage?: string;
  inspection_company?: string;
}

interface CarData {
  id: number;
  title: string;
  description: string;
  vin: string;
  current_price: number;
  additional_info?: string;
}

export default function PlateSearch() {
  const [plate, setPlate] = useState('');
  const [car, setCar] = useState<CarData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!plate.trim()) {
      setError('يرجى إدخال رقم اللوحة');
      return;
    }

    setLoading(true);
    setError(null);
    setCar(null);

    try {
      const res = await fetch(`/api/live-market/plate?plate=${encodeURIComponent(plate)}`);
      
      if (!res.ok) {
        throw new Error('لم يتم العثور على سيارة بهذا الرقم');
      }

      const data = await res.json();
      if (data && data.title) {
        setCar(data);
      } else {
        throw new Error('البيانات غير صالحة');
      }
    } catch (err: any) {
      console.error('خطأ في البحث عن السيارة:', err);
      setError(err.message || 'حدث خطأ أثناء البحث. يرجى المحاولة لاحقًا.');
      setCar(null);
    } finally {
      setLoading(false);
    }
  };

  // تحليل معلومات إضافية
  const parseAdditionalInfo = (infoStr?: string): CarInfo | null => {
    if (!infoStr) return null;
    try {
      return JSON.parse(infoStr);
    } catch {
      return null;
    }
  };

  const additionalInfo = car ? parseAdditionalInfo(car.additional_info) : null;

  return (
    <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border/50 p-5 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:flex-row-reverse items-start sm:items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-primary whitespace-nowrap flex items-center gap-2">
          <Search className="w-4 h-4" />
          البحث عن سيارة برقم اللوحة
        </h3>
        
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={plate}
            onChange={(e) => {
              setPlate(e.target.value);
              setError(null);
            }}
            placeholder="أدخل رقم اللوحة مثل XYZ987"
            className="w-full pl-10 pr-4 py-2.5 bg-background/70 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-foreground placeholder-foreground/50"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/70 w-4 h-4" />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="absolute right-1 top-1 bottom-1 bg-primary text-white px-4 rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جارٍ البحث...
              </>
            ) : (
              'بحث'
            )}
          </button>
        </div>
      </div>

      {/* رسالة خطأ */}
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* نتيجة البحث */}
      {car && (
        <div className="mt-5 border-t border-border/50 pt-4">
          <div className="flex items-start gap-4 mb-4 pb-3 border-b border-border/30">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Car className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-foreground">{car.title}</h4>
              <p className="text-foreground/70 text-sm mt-1 line-clamp-2">{car.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-foreground/70">رقم الشاصي:</span>
                <span className="text-foreground font-mono">{car.vin}</span>
              </div>
              <div className="pt-2 border-t border-border/30">
                <div className="text-sm text-primary">السعر الحالي</div>
                <div className="text-2xl font-bold text-secondary mt-1">
                  {formatCurrency(car.current_price)}
                </div>
              </div>
            </div>

            {additionalInfo && (
              <div className="bg-background/40 rounded-xl p-3">
                <h5 className="text-sm font-semibold text-primary mb-2">المواصفات</h5>
                <ul className="text-sm space-y-1.5">
                  {additionalInfo.year && (
                    <li className="flex justify-between">
                      <span className="text-foreground/70">الموديل:</span>
                      <span className="text-foreground">{additionalInfo.year}</span>
                    </li>
                  )}
                  {additionalInfo.fuel_type && (
                    <li className="flex justify-between">
                      <span className="text-foreground/70">الوقود:</span>
                      <span className="text-foreground">{additionalInfo.fuel_type}</span>
                    </li>
                  )}
                  {additionalInfo.color && (
                    <li className="flex justify-between">
                      <span className="text-foreground/70">اللون:</span>
                      <span className="text-foreground">{additionalInfo.color}</span>
                    </li>
                  )}
                  {additionalInfo.mileage && (
                    <li className="flex justify-between">
                      <span className="text-foreground/70">العداد:</span>
                      <span className="text-foreground">{additionalInfo.mileage} كم</span>
                    </li>
                  )}
                  {additionalInfo.inspection_company && (
                    <li className="flex justify-between">
                      <span className="text-foreground/70">الشركة المفحصة:</span>
                      <span className="text-foreground">{additionalInfo.inspection_company}</span>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-5 flex justify-end">
            <LoadingLink
              href={`/carDetails/${car.id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl border border-primary/30"
            >
              <Eye className="w-4 h-4" />
              عرض تفاصيل السيارة
            </LoadingLink>
          </div>
        </div>
      )}
    </div>
  );
}
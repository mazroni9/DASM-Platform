'use client';

import { useLoadingRouter } from '@/hooks/useLoadingRouter';
import { ChevronDownIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AuctionDropdown() {
  const router = useLoadingRouter();
  const [selectedValue, setSelectedValue] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const slug = e.target.value;
    setSelectedValue(slug);
    if (slug) {
      if (slug.startsWith('special/')) {
        router.push(`/auctions-${slug}`);
      } else {
        router.push(`/auctions/${slug}`);
      }
    }
  };

  // إزالة placeholder بعد التحميل الأولي (لتحسين UX)
  useEffect(() => {
    setSelectedValue('');
  }, []);

  return (
    <div className="relative w-full max-w-xs" dir="rtl">
      {/* Custom Select Container */}
      <div className="relative">
        <select
          value={selectedValue}
          onChange={handleChange}
          className="appearance-none w-full px-6 py-3 pr-10 bg-slate-800 text-slate-200 rounded-full border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all duration-200 font-medium text-right"
          aria-label="استكشف الأسواق الرقمية"
        >
          <option value="" disabled>
            استكشف الأسواق الرقمية
          </option>

          {/* مزادات متخصصة في المركبات */}
          <optgroup label="سوق قطاع السيارات المتنوعة">
            <option value="luxuryCars">السيارات الفارهة</option>
            <option value="classic">السيارات الكلاسيكية</option>
            <option value="caravan">سوق الكارفانات</option>
            <option value="government">سيارات الجهات الحكومية</option>
            <option value="companiesCars">سيارات الشركات</option>
            <option value="busesTrucks">الحافلات والشاحنات</option>
          </optgroup>

          {/* الأجهزة والآلات النوعية */}
          <optgroup label="السوق النوعي">
            <option value="medical">الأجهزة الطبية المستعملة</option>
            <option value="office-equipment">الآلات المكتبية المستعملة</option>
            <option value="used-servers">السيرفرات المستعملة</option>
          </optgroup>

          {/* مزادات تخصصية */}
          <optgroup label="أسواق تخصصية فريدة ومتنوعة">
            <option value="special/jewelry">المجوهرات والحلي الثمينة</option>
            <option value="special/precious">القطع النادرة</option>
            <option value="special/exective">VIP</option>
            <option value="special/premium-real-estate">العقارات المميزة</option>
            <option value="special/watches">الساعات الفاخرة</option>
            <option value="special/artwork">اللوحات الفنية</option>
            <option value="special/jets">الطائرات الخاصة</option>
            <option value="special/yachts-boats">اليخوت والقوارب</option>
          </optgroup>

          {/* أسواق عامة متنوعة */}
          <optgroup label="أسواق متنوعة عامة">
            <option value="electronics">الأجهزة الإلكترونية</option>
            <option value="furniture">الأثاث المستعمل النظيف فقط</option>
            <option value="equipment">المعدات المستعملة</option>
            <option value="bigBazar">البازار الكبير</option>
            <option value="green">السوق الأخضر</option>
          </optgroup>

          {/* السوق الشامل */}
          <optgroup label="السوق السعودي الشامل">
            <option value="auctions-6big">السوق الكبير</option>
          </optgroup>
        </select>

        {/* Custom Dropdown Arrow */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
          <ChevronDownIcon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
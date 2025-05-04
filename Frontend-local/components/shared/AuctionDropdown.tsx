'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AuctionDropdown() {
  const router = useRouter();
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const slug = e.target.value;
    setShowPlaceholder(false);
    if (slug) {
      if (slug.startsWith('special/')) {
        router.push(`/auctions-${slug}`);
      } else {
        router.push(`/auctions/${slug}`);
      }
    }
  };

  const handleFocus = () => {
    setShowPlaceholder(false);
  };

  const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
    if (e.target.value === '') {
      setShowPlaceholder(true);
    }
  };

  return (
    <div className="text-center" dir="rtl">
      <select
        className="text-md border px-6 py-3 rounded-full shadow focus:outline-none bg-white text-gray-700 min-w-[220px]"
        defaultValue=""
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{ 
          maxWidth: '100%',
          height: '48px',
          textOverflow: 'ellipsis',
          color: showPlaceholder ? 'transparent' : 'inherit',
          textShadow: showPlaceholder ? '0 0 0 #6b7280' : 'none',
          fontWeight: 'bold',
          backgroundImage: 'linear-gradient(to bottom, white, white)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat'
        }}
        aria-label="استكشف الأسواق الرقمية"
      >
        <option value="" disabled hidden style={{ display: 'none', opacity: 0 }}>استكشف الأسواق الرقمية</option>
        
        {/* مزادات متخصصه في المركبات */}
        <optgroup label="مزادات متخصصه من السيارات">
          <option value="luxuryCars">السيارات الفارهة</option>
          <option value="government">سيارات الجهات الحكومية</option>
          <option value="companiesCars">سيارات الشركات</option>
          <option value="busesTrucks">الحافلات والشاحنات</option>
        </optgroup>
        
        {/* المزادات النوعية */}
        <optgroup label="الاجهزه والالات النوعية">
          <option value="private">المزادات الخاصة</option>
          <option value="medical">الأجهزة الطبية المستعملة</option>
          <option value="office-equipment">الآلات المكتبية المستعملة</option>
          <option value="used-servers">السيرفرات المستعملة</option>
          <option value="green">الأخضر</option>
        </optgroup>
        
        {/* مزادات تخصصية */}
        <optgroup label="مزادات تخصصية">
          <option value="special/jewelry">المجوهرات والحلي الثمينة</option>
          <option value="special/precious">القطع النادرة</option>
          <option value="special/exective">VIP</option>
          <option value="special/premium-real-estate">العقارات المميزة</option>
          <option value="special/watches">الساعات الفاخرة</option>
          <option value="special/artwork">اللوحات الفنية</option>
          <option value="special/private">بث وادارة مناسبات متخصصه</option>
          <option value="special/jets">الطائرات الخاصة</option>
          <option value="special/yachts-boats">اليخوت والقوارب</option>
        </optgroup>
      </select>
    </div>
  );
}

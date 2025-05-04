 ✅ الصفحة الرئيسية لمشروع قلب - مبنية بنظام React داخل Next.js
 📁 frontendapppage.jsx

use client;

import Link from nextlink;

export default function HomePage() {
  return (
    main className=p-8 max-w-6xl mx-auto
      h1 className=text-3xl font-bold mb-6منصة قلب للمزادات التفاعلية المباشرةh1

      p className=mb-4 text-gray-700
        مرحبًا بك في المنصة السعودية الأولى التي تربط بين البائعين والمشترين في بث مباشر عبر الإنترنت.
        اختر نوع المزاد الذي ترغب في دخوله
      p

      ul className=grid grid-cols-2 gap-4
        li
          Link href=auctionslive className=block p-4 border rounded hoverbg-gray-100
            الحراج المباشر
          Link
        li
        li
          Link href=auctionsinstant className=block p-4 border rounded hoverbg-gray-100
            المزاد الفوري
          Link
        li
        li
          Link href=auctionssilent className=block p-4 border rounded hoverbg-gray-100
            المزاد الصامت
          Link
        li
        li
          Link href=auctionsgov className=block p-4 border rounded hoverbg-gray-100
            مزادات حكومية
          Link
        li
        li
          Link href=auctionsluxury className=block p-4 border rounded hoverbg-gray-100
            سيارات فارهة
          Link
        li
        li
          Link href=auctionsjewelry className=block p-4 border rounded hoverbg-gray-100
            مجوهرات ثمينة
          Link
        li
        li
          Link href=auctionsmedical className=block p-4 border rounded hoverbg-gray-100
            أجهزة ومعدات طبية
          Link
        li
      ul

      div className=mt-8
        Link
          href=SmartAssistant
          className=inline-block bg-blue-700 text-white py-2 px-6 rounded hoverbg-blue-800
        
          المساعد البرمجي الذكي
        Link
      div
    main
  );
}

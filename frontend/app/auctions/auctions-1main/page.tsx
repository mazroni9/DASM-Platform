'use client';

import Link from 'next/link';
import { Timer, BellOff, Video } from 'lucide-react';

export default function AuctionsMainPage() {
  // مزادات المجلد الأول: auctions-main
  const auctionsMain = [
    { name: 'الحراج المباشر', slug: 'live-market', description: 'بث مباشر للمزايدة مع البائع والمشتري وعملاء المنصة', icon: Video, color: 'text-red-600', bgColor: 'bg-red-50' },
    { name: 'السوق الفوري المباشر', slug: 'instant', description: 'مزادات بنظام المزايدات المفتوحه صعودا وهبوطا بحسب ما يراه المشتري لمصلحته', icon: Timer, color: 'text-blue-500', bgColor: 'bg-blue-50' },
    { name: 'المزاد الصامت', slug: 'silent', description: 'مزاد مكمل للمزاد الفوري ولكن بدون بث ولا يطلع المزايدين الاخرين على عروض بعض', icon: BellOff, color: 'text-purple-500', bgColor: 'bg-purple-50' },
  ];

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">المزادات الرئيسية الثلاثة</h1>
        <Link 
          href="/auctions"
          className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
        >
          <span className="ml-2">العودة لجميع المزادات</span>
        </Link>
      </div>
      
      <div className="mb-8">
        <p className="text-gray-600">تشمل هذه المزادات الأنواع الرئيسية الثلاثة التي تقدمها منصتنا، بما فيها الحراج المباشر والمزاد الفوري والمزاد الصامت.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {auctionsMain.map((auction) => {
          const Icon = auction.icon;
          return (
            <Link
              key={auction.slug}
              href={`/auctions/auctions-1main/${auction.slug}`}
              className={`group flex flex-col items-center border rounded-xl shadow hover:shadow-lg p-8 ${auction.bgColor} hover:bg-white transition-all duration-300 h-full`}
            >
              <div className={`p-4 rounded-full ${auction.color} bg-white mb-4`}>
                <Icon size={32} />
              </div>
              <h3 className={`text-2xl font-bold ${auction.color} mb-3 text-center`}>{auction.name}</h3>
              <p className="text-gray-600 text-center mb-6 flex-grow">{auction.description}</p>
              <div className="mt-auto">
                <span className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-full bg-white group-hover:bg-blue-500 text-gray-700 group-hover:text-white transition-colors duration-300">
                  اضغط للدخول إلى السوق
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-12 bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-xl font-semibold mb-4">نلغي لعبة التقييمات الجائرة عبر مزايدة عادلة بسعر بائع مخفي</h3>
        <p className="text-gray-600">المنافسة تعتمد على العرض والطلب الطبيعي، مع تدخلنا كوسيط لموازنة التوقعات وضمان بيئة موثوقة لكل الأطراف</p>
      </div>
    </main>
  );
} 
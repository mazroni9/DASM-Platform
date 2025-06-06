'use client';

import Link from 'next/link';
import { Gem, Sailboat, Home, Watch, BadgeCheck, Plane, Brush, Star, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AuctionsSpecialPage() {
  const router = useRouter();
  
  // الأسواق المتخصصة
  const specialMarkets = [
    // الصف الأول - اللون الأرجواني
    { 
      name: 'المجوهرات والحلي الثمينة', 
      slug: 'jewelry', 
      description: 'مجوهرات وحلي ثمينة متنوعة بتشكيلات راقية وجودة عالية', 
      icon: Gem,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverBgColor: 'bg-purple-100',
      row: 1
    },
    { 
      name: 'القطع النادرة والتحف الثمينة', 
      slug: 'heritage', 
      description: 'مزاد للتحف النادرة والقطع الثمينة والمجوهرات القديمة', 
      icon: Star,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverBgColor: 'bg-purple-100',
      row: 1
    },
    // تم تعطيل رابط المزادات التنفيذية مؤقتاً بتاريخ اليوم (الملفات موجودة ولكن الرابط معطل)
    { 
      name: 'مزادات VIP الخاصة', 
      slug: 'executive', 
      description: 'مزادات خاصة تنفيذية لشخصيات هامة وإدارات ومؤسسات محددة', 
      icon: BadgeCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverBgColor: 'bg-purple-100',
      row: 1,
      disabled: true // إضافة خاصية تعطيل الرابط
    },
    
    // الصف الثاني - اللون الأزرق
    { 
      name: 'اللوحات الفنية الأصلية', 
      slug: 'artworks', 
      description: 'لوحات فنية أصلية ومميزة لفنانين معروفين عالمياً ومحلياً', 
      icon: Brush,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverBgColor: 'bg-blue-100',
      row: 2
    },
    { 
      name: 'الساعات الفاخرة', 
      slug: 'watches', 
      description: 'ساعات فاخرة ونادرة من ماركات عالمية مرموقة بإصدارات محدودة', 
      icon: Watch,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverBgColor: 'bg-blue-100',
      row: 2
    },
    { 
      name: 'العقارات المميزة', 
      slug: 'realstate', 
      description: 'عقارات ومنازل وفلل فاخرة في مواقع مميزة مع ميزات استثنائية', 
      icon: Home,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverBgColor: 'bg-blue-100',
      row: 2
    },
    
    // الصف الثالث - اللون الأخضر
    { 
      name: 'اليخوت والقوارب', 
      slug: 'yachts', 
      description: 'يخوت وقوارب تنزه وصيد بمختلف المواصفات والأحجام والموديلات', 
      icon: Sailboat,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      hoverBgColor: 'bg-green-100',
      row: 3
    },
    { 
      name: 'الطائرات الخاصة', 
      slug: 'jets', 
      description: 'طائرات نفاثة ومروحية مستعملة بحالة ممتازة ومواصفات عالية', 
      icon: Plane,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      hoverBgColor: 'bg-green-100',
      row: 3
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-blue-500/90 to-cyan-400/90 text-white py-6 md:py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-3">
            <Link 
              href="/auctions" 
              className="flex items-center text-white/90 hover:text-white transition group"
            >
              <ChevronRight className="ml-1 transform group-hover:-translate-x-1 transition-transform" size={20} />
              <span>العودة للسوق الرئيسي</span>
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-2">الأسواق المتخصصة</h1>
          <p className="text-lg text-white/90 text-center max-w-3xl mx-auto">
            استكشف مجموعة متنوعة من الأسواق المتخصصة في القطع الفريدة والسلع النادرة عبر مزادات احترافية
          </p>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="container mx-auto px-4 py-8">
        {/* نص ترويجي */}
        <div className="max-w-3xl mx-auto text-center mb-6">
          <p className="text-gray-600 text-base leading-relaxed">
            تتميز أسواقنا المتخصصة بمجموعة حصرية من المقتنيات الفاخرة والنادرة التي يتم اختيارها بعناية. 
            كل مزاد يخضع لمعايير تقييم عادلة وشفافة لضمان تجربة مزايدة موثوقة لجميع الأطراف.
          </p>
        </div>

        {/* بطاقات الأسواق */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialMarkets
            .filter(market => !market.disabled) // تصفية العناصر المعطلة
            .map((market) => {
            const Icon = market.icon;
            return (
              <Link
                key={market.slug}
                href={`/auctions/auctions-4special/${market.slug}`}
                className={`group flex flex-col h-full rounded-xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg ${market.bgColor} hover:${market.hoverBgColor} transform hover:-translate-y-1`}
              >
                <div className="p-4">
                  <div className="flex items-center mb-2">
                    <div className={`p-2 rounded-full mr-2 ${market.color} bg-white`}>
                      <Icon size={20} />
                    </div>
                    <h3 className={`text-lg font-bold ${market.color}`}>{market.name}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{market.description}</p>
                  <div className="mt-auto pt-2">
                    <span className={`inline-flex items-center text-sm font-medium rounded-full px-3 py-1 bg-white/80 group-hover:bg-white group-hover:${market.color} text-gray-700 transition-colors`}>
                      اضغط للدخول
                      <ChevronRight className="mr-1 opacity-0 group-hover:opacity-100 transition-opacity" size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
} 
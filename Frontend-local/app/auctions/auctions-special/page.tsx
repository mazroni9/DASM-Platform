'use client';

import Link from 'next/link';
import { Gem, Sailboat, Home, Watch, BadgeCheck, Plane, Brush, Star, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AuctionsSpecialPage() {
  const router = useRouter();
  
  // الأسواق المتخصصة
  const specialMarkets = [
    { 
      name: 'المجوهرات والحلي الثمينة', 
      slug: 'jewelry', 
      description: 'مجوهرات وحلي ثمينة متنوعة بتشكيلات راقية وجودة عالية', 
      icon: Gem, 
      color: 'text-purple-600', 
      bgColor: 'bg-purple-50',
      hoverColor: 'bg-purple-100'
    },
    { 
      name: 'القطع النادرة والتحف الثمينة', 
      slug: 'precious', 
      description: 'مزاد للتحف النادرة والقطع الثمينة والمجوهرات القديمة', 
      icon: Star, 
      color: 'text-amber-600', 
      bgColor: 'bg-amber-50',
      hoverColor: 'bg-amber-100'
    },
    { 
      name: 'مزادات VIP الخاصة', 
      slug: 'executive', 
      description: 'مزادات خاصة تنفيذية لشخصيات هامة وإدارات ومؤسسات محددة', 
      icon: BadgeCheck, 
      color: 'text-indigo-700', 
      bgColor: 'bg-indigo-50',
      hoverColor: 'bg-indigo-100'
    },
    { 
      name: 'العقارات التجارية المميزة', 
      slug: 'realstate', 
      description: 'عقارات ومنازل وفلل فاخرة في مواقع مميزة مع ميزات استثنائية', 
      icon: Home, 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50',
      hoverColor: 'bg-blue-100'
    },
    { 
      name: 'الساعات الفاخرة', 
      slug: 'watches', 
      description: 'ساعات فاخرة ونادرة من ماركات عالمية مرموقة بإصدارات محدودة', 
      icon: Watch, 
      color: 'text-yellow-700', 
      bgColor: 'bg-yellow-50',
      hoverColor: 'bg-yellow-100'
    },
    { 
      name: 'اللوحات الفنية الأصلية', 
      slug: 'artworks', 
      description: 'لوحات فنية أصلية ومميزة لفنانين معروفين عالمياً ومحلياً', 
      icon: Brush, 
      color: 'text-pink-600', 
      bgColor: 'bg-pink-50',
      hoverColor: 'bg-pink-100'
    },
    { 
      name: 'المناسبات المتخصصة', 
      slug: 'private', 
      description: 'مزادات خاصة متاحة بدعوة للعملاء المميزين وإدارة مناسبات متخصصة', 
      icon: BadgeCheck, 
      color: 'text-gray-700', 
      bgColor: 'bg-gray-50',
      hoverColor: 'bg-gray-100'
    },
    { 
      name: 'الطائرات الخاصة', 
      slug: 'jets', 
      description: 'طائرات نفاثة ومروحية مستعملة بحالة ممتازة ومواصفات عالية', 
      icon: Plane, 
      color: 'text-sky-600', 
      bgColor: 'bg-sky-50',
      hoverColor: 'bg-sky-100'
    },
    { 
      name: 'اليخوت والقوارب', 
      slug: 'yachts', 
      description: 'يخوت وقوارب تنزه وصيد بمختلف المواصفات والأحجام والموديلات', 
      icon: Sailboat, 
      color: 'text-cyan-600', 
      bgColor: 'bg-cyan-50',
      hoverColor: 'bg-cyan-100'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-10 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <Link 
              href="/auctions" 
              className="flex items-center text-white/90 hover:text-white transition group"
            >
              <ChevronRight className="ml-1 transform group-hover:-translate-x-1 transition-transform" size={20} />
              <span>العودة للسوق الرئيسي</span>
            </Link>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4">الأسواق المتخصصة</h1>
          <p className="text-xl text-white/90 text-center max-w-3xl mx-auto">
            استكشف مجموعة متنوعة من الأسواق المتخصصة في القطع الفريدة والسلع النادرة عبر مزادات احترافية
          </p>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="container mx-auto px-4 py-12">
        {/* نص ترويجي */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-gray-600 text-lg leading-relaxed">
            تتميز أسواقنا المتخصصة بمجموعة حصرية من المقتنيات الفاخرة والنادرة التي يتم اختيارها بعناية. 
            كل مزاد يخضع لمعايير تقييم عادلة وشفافة لضمان تجربة مزايدة موثوقة لجميع الأطراف.
          </p>
        </div>

        {/* بطاقات الأسواق */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {specialMarkets.map((market) => {
            const Icon = market.icon;
            return (
              <Link
                key={market.slug}
                href={`/auctions/auctions-special/${market.slug}`}
                className={`group flex flex-col h-full rounded-xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg ${market.bgColor} hover:${market.hoverColor} transform hover:-translate-y-1`}
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-full mr-3 ${market.color} bg-white`}>
                      <Icon size={24} />
                    </div>
                    <h3 className={`text-xl font-bold ${market.color}`}>{market.name}</h3>
                  </div>
                  <p className="text-gray-600 mb-4">{market.description}</p>
                  <div className="mt-auto pt-4">
                    <span className="inline-flex items-center text-sm font-medium rounded-full px-4 py-2 bg-white/80 group-hover:bg-white group-hover:text-blue-600 text-gray-700 transition-colors">
                      دخول السوق
                      <ChevronRight className="mr-1 opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
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
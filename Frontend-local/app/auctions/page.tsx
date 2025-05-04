'use client';

import Link from 'next/link';
import { Car, Truck, Building2, Stethoscope, Printer, Server, Leaf, Timer, BellOff, BadgeCheck, Building, Video, Star, Gem, Sailboat, Home, Plane, Watch, Brush, Smartphone, Sofa, PencilRuler, Scale } from 'lucide-react';

export default function AuctionsPage() {
  const auctionsMain = [
    { name: 'الحراج المباشر', slug: 'auctions-main/live-market', description: 'بث مباشر للمزايدة مع البائع والمشتري وعملاء المنصة', icon: Video, color: 'text-red-600', bgColor: 'bg-red-50' },
    { name: 'السوق الفوري المباشر', slug: 'auctions-main/instant', description: 'مزادات بنظام المزايدات المفتوحه صعودا وهبوطا بحسب ما يراه المشتري لمصلحته', icon: Timer, color: 'text-blue-500', bgColor: 'bg-blue-50' },
    { name: 'السوق الصامت', slug: 'auctions-main/silent', description: 'مزاد مكمل للمزاد الفوري ولكن بدون بث ولا يطلع المزايدين الاخرين على عروض بعض', icon: BellOff, color: 'text-purple-500', bgColor: 'bg-purple-50' },
  ];

  const auctionsCar = [
    { name: 'سوق السيارات الفارهة', slug: 'auctions-car/luxuryCars', description: 'سيارات فارهة مميزة بأسعار منافسة', icon: Car, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { name: 'سوق سيارات الشركات', slug: 'auctions-car/companiesCars', description: 'سيارات شركات بأسعار تصفية مخزون', icon: Building2, color: 'text-gray-700', bgColor: 'bg-gray-50' },
    { name: 'سوق سيارات الجهات الحكومية', slug: 'auctions-car/government', description: 'سيارات من الجهات الحكومية بحالة جيدة', icon: Building, color: 'text-green-600', bgColor: 'bg-green-50' },
    { name: 'سوق الشاحنات والحافلات', slug: 'auctions-car/busesTrucks', description: 'شاحنات ومعدات ثقيلة بحالة تشغيل ممتازة', icon: Truck, color: 'text-blue-700', bgColor: 'bg-blue-50' },
    { name: 'سوق الكرافانات', slug: 'auctions-car/caravan', description: 'كرافانات ومنازل متنقلة لمحبي السفر والرحلات', icon: Home, color: 'text-teal-600', bgColor: 'bg-teal-50' },
    { name: 'سوق السيارات الكلاسيكية', slug: 'auctions-car/classic', description: 'سيارات كلاسيكية نادرة وقطع مميزة للهواة والمقتنين', icon: Car, color: 'text-amber-700', bgColor: 'bg-amber-50' },
  ];

  const auctionsQuality = [
    { name: 'الأجهزة الطبية المستعملة', slug: 'auctions-quality/medical', description: 'أجهزة ومعدات طبية مستعملة بحالة جيدة', icon: Stethoscope, color: 'text-teal-500', bgColor: 'bg-teal-50' },
    { name: 'الآلات المكتبية المستعملة', slug: 'auctions-quality/office-equipment', description: 'معدات مكتبية مثل آلات تصوير متوسطة وكبيرة الحجم وأجهزة إلكترونية بأسعار تنافسية', icon: Printer, color: 'text-sky-500', bgColor: 'bg-sky-50' },
    { name: 'السيرفرات المستعملة', slug: 'quality-market/used-servers', description: 'سيرفرات وأجهزة تخزين وشبكات بمواصفات جيدة', icon: Server, color: 'text-slate-500', bgColor: 'bg-slate-50' },
  ];

  const auctionsSpecial = [
    { name: 'المجوهرات والحلي الثمينة', slug: 'auctions-special/jewelry', description: 'مجوهرات وحلي ثمينة متنوعة بتشكيلات راقية وجودة عالية', icon: Gem, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { name: 'القطع النادرة', slug: 'auctions-special/precious', description: 'مزاد للتحف النادرة والقطع الثمينة والمجوهرات القديمة', icon: Star, color: 'text-amber-600', bgColor: 'bg-amber-50' },
    { name: 'VIP', slug: 'auctions-special/exective', description: 'مزادات خاصة تنفيذية لإدارات ومؤسسات محددة', icon: BadgeCheck, color: 'text-indigo-700', bgColor: 'bg-indigo-50' },
    { name: 'العقارات المميزة', slug: 'auctions-special/realstate', description: 'عقارات ومنازل وفلل فاخرة في مواقع مميزة', icon: Home, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { name: 'الساعات الفاخرة', slug: 'auctions-special/watches', description: 'ساعات فاخرة ونادرة من ماركات عالمية', icon: Watch, color: 'text-yellow-700', bgColor: 'bg-yellow-50' },
    { name: 'اللوحات الفنية', slug: 'auctions-special/artwork', description: 'لوحات فنية أصلية ومميزة لفنانين معروفين', icon: Brush, color: 'text-pink-600', bgColor: 'bg-pink-50' },
    { name: 'بث وادارة مناسبات متخصصه', slug: 'auctions-special/private', description: 'مزادات خاصة متاحة بدعوة للعملاء المميزين', icon: BadgeCheck, color: 'text-gray-700', bgColor: 'bg-gray-50' },
    { name: 'الطائرات الخاصة', slug: 'auctions-special/jets', description: 'طائرات مستعملة بحالة جيدة ومعدلات جيدة للتنزه والصيد', icon: Plane, color: 'text-red-600', bgColor: 'bg-red-50' },
    { name: 'اليخوت والقوارب', slug: 'auctions-special/yachts', description: 'يخوت وقوارب تنزه وصيد بمختلف المواصفات والموديلات', icon: Sailboat, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  ];

  const auctionsGeneral = [
    { name: 'الأجهزة الإلكترونية', slug: 'auctions-general/electronics', description: 'أجهزة إلكترونية متنوعة من هواتف وأجهزة لوحية وحواسيب', icon: Smartphone, color: 'text-blue-500', bgColor: 'bg-blue-50' },
    { name: 'الأثاث المنزلي', slug: 'auctions-general/furniture', description: 'أثاث منزلي ومكتبي متنوع بحالة جيدة', icon: Sofa, color: 'text-brown-600', bgColor: 'bg-amber-50' },
    { name: 'اللوحات الفنية', slug: 'auctions-general/artworks', description: 'لوحات فنية أصلية ومميزة لفنانين معروفين', icon: Brush, color: 'text-pink-600', bgColor: 'bg-pink-50' },
    { name: 'المعدات العامة', slug: 'auctions-general/equipment', description: 'معدات وأدوات متنوعة للاستخدامات العامة', icon: PencilRuler, color: 'text-gray-600', bgColor: 'bg-gray-50' },
  ];

  const Divider = () => (
    <div className="col-span-full my-8">
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded"></div>
    </div>
  );

  const SectionTitle = ({ title, link = null, linkText = null }) => (
    <div className="col-span-full mb-6 mt-8 flex justify-center items-center">
      <h2 className="text-2xl font-bold text-blue-600 border-b-4 border-blue-500 py-2 px-8 bg-blue-50 shadow-sm rounded-md text-center">
        {title}
      </h2>
      {link && linkText && (
        <Link 
          href={link}
          className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium rounded-lg border border-blue-200 hover:border-blue-300 transition"
        >
          {linkText}
        </Link>
      )}
    </div>
  );

  const AuctionCard = ({ auction, isSpecial = false }) => {
    const Icon = auction.icon;
    return (
      <Link
        key={auction.slug}
        href={`/auctions/${auction.slug}`}
        className={`group flex flex-col items-center border rounded-xl shadow hover:shadow-lg p-6 ${auction.bgColor} hover:bg-white transition-all duration-300 h-full`}
      >
        <div className={`p-3 rounded-full ${auction.color} bg-white mb-4`}>
          <Icon size={24} />
        </div>
        <h3 className={`text-xl font-bold ${auction.color} mb-2 text-center`}>{auction.name}</h3>
        <p className="text-sm text-gray-600 text-center mb-4 flex-grow">{auction.description}</p>
        <div className="mt-auto">
          <span className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-full bg-white group-hover:bg-blue-500 text-gray-700 group-hover:text-white transition-colors duration-300">
            اضغط للدخول
          </span>
        </div>
      </Link>
    );
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-end mb-4">
        <Link href="/" className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium">الرئيسية</Link>
      </div>

      <div className="bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 rounded-xl shadow-md p-6 mb-8 border-r-4 border-blue-500">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-white text-blue-600 flex-shrink-0 shadow-sm">
            <Scale size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-blue-800 mb-2">فلسفتنا في التقييم العادل</h1>
            <p className="text-lg text-gray-700 leading-relaxed">
              نلغي لعبة التقييمات الجائرة عبر مزايدة عادلة بسعر بائع مخفي. المنافسة تعتمد على العرض والطلب الطبيعي، مع تدخلنا كوسيط لموازنة التوقعات وضمان بيئة موثوقة لكل الأطراف
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <SectionTitle title="السوق الرئيسي" />
        {auctionsMain.map((auction) => <AuctionCard key={auction.slug} auction={auction} />)}
        <Divider />

        <SectionTitle title="سوق السيارات" />
        {auctionsCar.map((auction) => <AuctionCard key={auction.slug} auction={auction} />)}
        <Divider />

        <SectionTitle title="السوق النوعي" />
        {auctionsQuality.map((auction) => <AuctionCard key={auction.slug} auction={auction} />)}
        <Divider />

        <SectionTitle title="الأسواق المتخصصة" />
        {auctionsSpecial.map((auction) => <AuctionCard key={auction.slug} auction={auction} isSpecial />)}
        <Divider />

        <SectionTitle title="اسواق العامة" />
        {auctionsGeneral.map((auction) => <AuctionCard key={auction.slug} auction={auction} />)}
      </div>
    </main>
  );
}

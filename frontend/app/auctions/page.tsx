/**
 * ==================================================
 * ملف: frontend/app/auctions/page.tsx
 * الغرض: صفحة عرض جميع أسواق المزادات
 * الارتباطات: 
 *  - يعرض كافة أقسام المزادات المتوفرة
 *  - يوفر روابط للصفحات الفرعية للمزادات المختلفة
 *  - يستخدم مكونات فرعية لعرض بطاقات المزادات
 * ==================================================
 */

'use client';

import Link from 'next/link';
import { Car, Truck, Building2, Stethoscope, Printer, Server, Leaf, Timer, BellOff, BadgeCheck, Building, Video, Star, Gem, Sailboat, Home, Plane, Watch, Brush, Smartphone, Sofa, PencilRuler, Scale, Store, ShoppingBag, Gift } from 'lucide-react';
import Countdown from '@/components/Countdown';

export default function AuctionsPage() {
  const auctionsMain = [
    { currentPage:'live_auction' ,name: 'الحراج المباشر', slug: 'auctions-1main/live-market', description: 'بث مباشر للمزايدة مع البائع والمشتري وعملاء المنصة\nيبدأ من 4 عصرا الى 7 مساءا', icon: Video, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { currentPage:'instant_auction',name: 'السوق الفوري المباشر', slug: 'auctions-1main/instant', description: 'مزادات بنظام المزايدات المفتوحه صعودا وهبوطا بحسب ما يراه المشتري لمصلحته\nيبدأ من 7 مساءا الى 10 مساءا', icon: Timer, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { currentPage:'late_auction', name: 'السوق المتاخر', slug: 'auctions-1main/silent', description: 'مزاد مكمل للمزاد الفوري ولكن بدون بث ولا يطلع المزايدين الاخرين على عروض بعض\nيبدأ من 10 مساءا الى 4 عصرا اليوم التالي', icon: BellOff, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  ];

  const auctionsCar = [
    { name: 'سوق السيارات الفارهة', slug: 'auctions-2car/luxuryCars', description: 'سيارات فارهة مميزة بأسعار منافسة', icon: Car, color: 'text-blue-600', bgColor: 'bg-amber-50' },
    { name: 'سوق السيارات الكلاسيكية', slug: 'auctions-2car/classic', description: 'سيارات كلاسيكية نادرة وقطع مميزة للهواة والمقتنين', icon: Car, color: 'text-blue-600', bgColor: 'bg-amber-50' },
    { name: 'سوق الكرافانات', slug: 'auctions-2car/caravan', description: 'كرافانات ومنازل متنقلة لمحبي السفر والرحلات', icon: Home, color: 'text-blue-600', bgColor: 'bg-amber-50' },
    
    { name: 'سوق الشاحنات والحافلات', slug: 'auctions-2car/busesTrucks', description: 'شاحنات ومعدات ثقيلة بحالة تشغيل ممتازة', icon: Truck, color: 'text-blue-600', bgColor: 'bg-amber-50' },
    { name: 'سوق سيارات الشركات', slug: 'auctions-2car/companiesCars', description: 'سيارات شركات بأسعار تصفية مخزون', icon: Building2, color: 'text-blue-600', bgColor: 'bg-amber-50' },
    { name: 'سوق سيارات الجهات الحكومية', slug: 'auctions-2car/government', description: 'سيارات من الجهات الحكومية بحالة جيدة', icon: Building, color: 'text-blue-600', bgColor: 'bg-amber-50' },
  ];

  const auctionsQuality = [
    { name: 'الأجهزة الطبية المستعملة', slug: 'auctions-3quality/medical', description: 'أجهزة ومعدات طبية مستعملة بحالة جيدة', icon: Stethoscope, color: 'text-teal-600', bgColor: 'bg-teal-50' },
    { name: 'الآلات المكتبية المستعملة', slug: 'auctions-3quality/office-equipment', description: 'معدات مكتبية مثل آلات تصوير متوسطة وكبيرة الحجم وأجهزة إلكترونية بأسعار تنافسية', icon: Printer, color: 'text-teal-600', bgColor: 'bg-teal-50' },
    { name: 'السيرفرات المستعملة', slug: 'auctions-3quality/used-servers', description: 'سيرفرات وأجهزة تخزين وشبكات بمواصفات جيدة', icon: Server, color: 'text-teal-600', bgColor: 'bg-teal-50' },
  ];

  const auctionsSpecial = [
    { name: 'المجوهرات والحلي الثمينة', slug: 'auctions-4special/jewelry', description: 'مجوهرات وحلي ثمينة متنوعة بتشكيلات راقية وجودة عالية', icon: Gem, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { name: 'القطع النادرة', slug: 'auctions-4special/heritage', description: 'مزاد للتحف النادرة والقطع الثمينة والمجوهرات القديمة', icon: Star, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { name: 'مزادات VIP الخاصة', slug: 'auctions-4special/executive', description: 'مزادات خاصة تنفيذية لإدارات ومؤسسات محددة', icon: BadgeCheck, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    
    { name: 'اللوحات الفنية', slug: 'auctions-4special/artworks', description: 'لوحات فنية أصلية ومميزة لفنانين معروفين', icon: Brush, color: 'text-blue-600', bgColor: 'bg-purple-50' },
    { name: 'الساعات الفاخرة', slug: 'auctions-4special/watches', description: 'ساعات فاخرة ونادرة من ماركات عالمية', icon: Watch, color: 'text-blue-600', bgColor: 'bg-purple-50' },
    { name: 'العقارات المميزة', slug: 'auctions-4special/realstate', description: 'عقارات ومنازل وفلل فاخرة في مواقع مميزة', icon: Home, color: 'text-blue-600', bgColor: 'bg-purple-50' },
    
    { name: 'الطائرات الخاصة', slug: 'auctions-4special/jets', description: 'طائرات مستعملة بحالة جيدة ومعدلات جيدة للتنزه والصيد', icon: Plane, color: 'text-green-600', bgColor: 'bg-purple-50' },
    { name: 'اليخوت والقوارب', slug: 'auctions-4special/yachts', description: 'يخوت وقوارب تنزه وصيد بمختلف المواصفات والموديلات', icon: Sailboat, color: 'text-green-600', bgColor: 'bg-purple-50' },
  ];

  const auctionsGeneral = [
    { name: 'الأجهزة الإلكترونية', slug: 'auctions-5general/electronics', description: 'أجهزة إلكترونية متنوعة من هواتف وأجهزة لوحية وحواسيب', icon: Smartphone, color: 'text-green-600', bgColor: 'bg-green-50' },
    { name: 'الأثاث المنزلي', slug: 'auctions-5general/furniture', description: 'أثاث منزلي ومكتبي متنوع بحالة جيدة', icon: Sofa, color: 'text-green-600', bgColor: 'bg-green-50' },
    { name: 'المعدات العامة', slug: 'auctions-5general/equipment', description: 'معدات وأدوات للاستخدامات المتنوعة', icon: PencilRuler, color: 'text-green-600', bgColor: 'bg-green-50' },
    { name: 'السوق الأخضر', slug: 'auctions-5general/green', description: 'منتجات صديقة للبيئة وتدعم الاستدامة', icon: Leaf, color: 'text-green-600', bgColor: 'bg-green-50' }
  ];

  // إضافة مجموعة السوق الكبير (البازار سابقًا) بالاسم الجديد
  const auctionsBig = [
    { name: 'السوق الشامل', slug: 'auctions-6big', description: 'المنصة الوطنية الأولى للمزادات في المملكة العربية السعودية', icon: Store, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { name: 'عروض وتخفيضات حصرية', slug: 'auctions-6big/offers', description: 'تخفيضات وعروض مميزة على منتجات متنوعة', icon: Gift, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { name: 'متاجر تسوق محلية', slug: 'auctions-6big/local-shops', description: 'متاجر محلية ومنتجات متنوعة بأسعار تنافسية', icon: ShoppingBag, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  ];

  const Divider = () => (
    <div className="col-span-full my-8">
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded"></div>
    </div>
  );

  const SectionTitle = ({ title, link = null, linkText = null }) => (
    <div className="col-span-full mb-6 mt-8 flex flex-col justify-center items-center">
      <h2 className="text-2xl font-bold text-blue-600 py-2 px-8 bg-blue-50 shadow-sm rounded-md text-center">
        {title}
      </h2>
      {link && linkText && (
        <Link 
          href={link}
          className="mt-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium rounded-lg border border-blue-200 hover:border-blue-300 transition"
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
        <p className="text-sm text-gray-600 text-center mb-4 flex-grow whitespace-pre-line">{auction.description}</p>
        {/*<Countdown page={auction.currentPage as 'live_auction' | 'instant_auction' | 'late_auction'}/>*/}
        <br/>
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

      <div className="bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 rounded-xl shadow-md p-6 mb-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-center text-center">
          <div className="p-3 rounded-full bg-white text-blue-600 shadow-sm mr-3">
            <Scale size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-blue-800">صفحة جميع الاسواق</h1>
            <p className="text-sm text-gray-700 leading-relaxed">
              نلغي لعبة التقييمات الجائرة عبر مزايدة عادلة بسعر بائع مخفي.
		 المنافسة تعتمد على العرض والطلب الطبيعي
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {auctionsMain.map((auction) => <AuctionCard key={auction.slug} auction={auction} />)}
        <Divider />

        <SectionTitle title="أسواق السيارات المتنوعة" />
        {auctionsCar.map((auction) => <AuctionCard key={auction.slug} auction={auction} />)}
        <Divider />

        <SectionTitle title="سوق نوعي" />
        {auctionsQuality.map((auction) => <AuctionCard key={auction.slug} auction={auction} />)}
        <Divider />

        <SectionTitle title="اسواق تخصصية" />
        {auctionsSpecial.map((auction) => <AuctionCard key={auction.slug} auction={auction} isSpecial />)}
        <Divider />

        <SectionTitle title="اسواق عامة" />
        {auctionsGeneral.map((auction) => <AuctionCard key={auction.slug} auction={auction} />)}
        <Divider />

        <SectionTitle title="السوق الكبير" />
        {auctionsBig.map((auction) => <AuctionCard key={auction.slug} auction={auction} />)}
      </div>
    </main>
  );
}

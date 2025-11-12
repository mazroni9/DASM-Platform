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

import { useState } from 'react';
import LoadingLink from "@/components/LoadingLink";
import { 
  Car, Truck, Building2, Stethoscope, Printer, Server, Leaf, Timer, 
  BellOff, BadgeCheck, Building, Video, Star, Gem, Sailboat, Home, 
  Plane, Watch, Brush, Smartphone, Sofa, PencilRuler, Scale, Store, 
  ShoppingBag, Gift, Search, Filter, ChevronLeft, ChevronRight,
  Zap, Crown, TrendingUp, Users, Shield, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuctionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentSlide, setCurrentSlide] = useState(0);

  const auctionsMain = [
    { 
      currentPage:'live_auction',
      name: 'الحراج المباشر', 
      slug: 'auctions-1main/live-market', 
      description: 'بث مباشر للمزايدة مع البائع والمشتري وعملاء المنصة\nيبدأ من 4 عصرا الى 7 مساءا', 
      icon: Video, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'main',
      featured: true,
      stats: { users: '2.5K+', success: '98%' }
    },
    { 
      currentPage:'instant_auction',
      name: 'السوق الفوري المباشر', 
      slug: 'auctions-1main/instant', 
      description: 'مزادات بنظام المزايدات المفتوحه صعودا وهبوطا بحسب ما يراه المشتري لمصلحته\nيبدأ من 7 مساءا الى 10 مساءا', 
      icon: Timer, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'main',
      featured: true,
      stats: { users: '1.8K+', success: '95%' }
    },
    { 
      currentPage:'late_auction', 
      name: 'السوق المتاخر', 
      slug: 'auctions-1main/silent', 
      description: 'مزاد مكمل للمزاد الفوري ولكن بدون بث ولا يطلع المزايدين الاخرين على عروض بعض\nيبدأ من 10 مساءا الى 4 عصرا اليوم التالي', 
      icon: BellOff, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'main',
      featured: true,
      stats: { users: '1.2K+', success: '92%' }
    },
    {
      currentPage:'fixed_auction', 
      name: 'السوق الثابت', 
      slug: 'auctions-1main/fixed', 
      description: 'فرصتك الأخيرة لصفقات سريعة. أعلى سعر يفوز عند انتهاء الوقت.', 
      icon: Clock, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'main',
      featured: true,
      stats: { users: '1.2K+', success: '92%' }
    }
  ];

  const auctionsCar = [
    { 
      name: 'سوق السيارات الفارهة', 
      slug: 'auctions-2car/luxuryCars', 
      description: 'سيارات فارهة مميزة بأسعار منافسة', 
      icon: Car, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'cars',
      featured: false,
      stats: { items: '500+', rating: '4.8' }
    },
    { 
      name: 'سوق السيارات الكلاسيكية', 
      slug: 'auctions-2car/classic', 
      description: 'سيارات كلاسيكية نادرة وقطع مميزة للهواة والمقتنين', 
      icon: Car, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'cars',
      featured: false,
      stats: { items: '150+', rating: '4.9' }
    },
    { 
      name: 'سوق الكرافانات', 
      slug: 'auctions-2car/caravan', 
      description: 'كرافانات ومنازل متنقلة لمحبي السفر والرحلات', 
      icon: Home, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'cars',
      featured: false,
      stats: { items: '80+', rating: '4.7' }
    },
    { 
      name: 'سوق الشاحنات والحافلات', 
      slug: 'auctions-2car/busesTrucks', 
      description: 'شاحنات ومعدات ثقيلة بحالة تشغيل ممتازة', 
      icon: Truck, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'cars',
      featured: false,
      stats: { items: '300+', rating: '4.6' }
    },
    { 
      name: 'سوق سيارات الشركات', 
      slug: 'auctions-2car/companiesCars', 
      description: 'سيارات شركات بأسعار تصفية مخزون', 
      icon: Building2, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'cars',
      featured: false,
      stats: { items: '400+', rating: '4.5' }
    },
    { 
      name: 'سوق سيارات الجهات الحكومية', 
      slug: 'auctions-2car/government', 
      description: 'سيارات من الجهات الحكومية بحالة جيدة', 
      icon: Building, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'cars',
      featured: false,
      stats: { items: '200+', rating: '4.4' }
    },
  ];

  const auctionsQuality = [
    { 
      name: 'الأجهزة الطبية المستعملة', 
      slug: 'auctions-3quality/medical', 
      description: 'أجهزة ومعدات طبية مستعملة بحالة جيدة', 
      icon: Stethoscope, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'quality',
      featured: false,
      stats: { items: '120+', rating: '4.7' }
    },
    { 
      name: 'الآلات المكتبية المستعملة', 
      slug: 'auctions-3quality/office-equipment', 
      description: 'معدات مكتبية مثل آلات تصوير متوسطة وكبيرة الحجم وأجهزة إلكترونية بأسعار تنافسية', 
      icon: Printer, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'quality',
      featured: false,
      stats: { items: '250+', rating: '4.6' }
    },
    { 
      name: 'السيرفرات المستعملة', 
      slug: 'auctions-3quality/used-servers', 
      description: 'سيرفرات وأجهزة تخزين وشبكات بمواصفات جيدة', 
      icon: Server, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'quality',
      featured: false,
      stats: { items: '80+', rating: '4.8' }
    },
  ];

  const auctionsSpecial = [
    { 
      name: 'المجوهرات والحلي الثمينة', 
      slug: 'auctions-4special/jewelry', 
      description: 'مجوهرات وحلي ثمينة متنوعة بتشكيلات راقية وجودة عالية', 
      icon: Gem, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'special',
      featured: true,
      stats: { items: '1K+', rating: '4.9' }
    },
    { 
      name: 'القطع النادرة', 
      slug: 'auctions-4special/heritage', 
      description: 'مزاد للتحف النادرة والقطع الثمينة والمجوهرات القديمة', 
      icon: Star, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'special',
      featured: true,
      stats: { items: '500+', rating: '4.9' }
    },
    { 
      name: 'مزادات VIP الخاصة', 
      slug: 'auctions-4special/executive', 
      description: 'مزادات خاصة تنفيذية لإدارات ومؤسسات محددة', 
      icon: BadgeCheck, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'special',
      featured: true,
      stats: { users: 'VIP', rating: '5.0' }
    },
    { 
      name: 'اللوحات الفنية', 
      slug: 'auctions-4special/artworks', 
      description: 'لوحات فنية أصلية ومميزة لفنانين معروفين', 
      icon: Brush, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'special',
      featured: false,
      stats: { items: '200+', rating: '4.8' }
    },
    { 
      name: 'الساعات الفاخرة', 
      slug: 'auctions-4special/watches', 
      description: 'ساعات فاخرة ونادرة من ماركات عالمية', 
      icon: Watch, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'special',
      featured: false,
      stats: { items: '150+', rating: '4.9' }
    },
    { 
      name: 'العقارات المميزة', 
      slug: 'auctions-4special/realstate', 
      description: 'عقارات ومنازل وفلل فاخرة في مواقع مميزة', 
      icon: Home, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'special',
      featured: false,
      stats: { items: '100+', rating: '4.7' }
    },
    { 
      name: 'الطائرات الخاصة', 
      slug: 'auctions-4special/jets', 
      description: 'طائرات مستعملة بحالة جيدة ومعدلات جيدة للتنزه والصيد', 
      icon: Plane, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'special',
      featured: false,
      stats: { items: '25+', rating: '4.9' }
    },
    { 
      name: 'اليخوت والقوارب', 
      slug: 'auctions-4special/yachts', 
      description: 'يخوت وقوارب تنزه وصيد بمختلف المواصفات والموديلات', 
      icon: Sailboat, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'special',
      featured: false,
      stats: { items: '50+', rating: '4.8' }
    },
  ];

  const auctionsGeneral = [
    { 
      name: 'الأجهزة الإلكترونية', 
      slug: 'auctions-5general/electronics', 
      description: 'أجهزة إلكترونية متنوعة من هواتف وأجهزة لوحية وحواسيب', 
      icon: Smartphone, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'general',
      featured: false,
      stats: { items: '2K+', rating: '4.6' }
    },
    { 
      name: 'الأثاث المنزلي', 
      slug: 'auctions-5general/furniture', 
      description: 'أثاث منزلي ومكتبي متنوع بحالة جيدة', 
      icon: Sofa, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'general',
      featured: false,
      stats: { items: '1.5K+', rating: '4.5' }
    },
    { 
      name: 'المعدات العامة', 
      slug: 'auctions-5general/equipment', 
      description: 'معدات وأدوات للاستخدامات المتنوعة', 
      icon: PencilRuler, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'general',
      featured: false,
      stats: { items: '800+', rating: '4.4' }
    },
    { 
      name: 'السوق الأخضر', 
      slug: 'auctions-5general/green', 
      description: 'منتجات صديقة للبيئة وتدعم الاستدامة', 
      icon: Leaf, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'general',
      featured: false,
      stats: { items: '300+', rating: '4.7' }
    }
  ];

  const auctionsBig = [
    { 
      name: 'السوق الشامل', 
      slug: 'auctions-6big', 
      description: 'المنصة الوطنية الأولى للمزادات في المملكة العربية السعودية', 
      icon: Store, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'big',
      featured: true,
      stats: { items: '10K+', rating: '4.8' }
    },
    { 
      name: 'عروض وتخفيضات حصرية', 
      slug: 'auctions-6big/offers', 
      description: 'تخفيضات وعروض مميزة على منتجات متنوعة', 
      icon: Gift, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'big',
      featured: false,
      stats: { items: '5K+', rating: '4.7' }
    },
    { 
      name: 'متاجر تسوق محلية', 
      slug: 'auctions-6big/local-shops', 
      description: 'متاجر محلية ومنتجات متنوعة بأسعار تنافسية', 
      icon: ShoppingBag, 
      color: 'text-primary', 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      category: 'big',
      featured: false,
      stats: { shops: '200+', rating: '4.6' }
    },
  ];

  // دمج جميع المزادات في مصفوفة واحدة للبحث والتصفية
  const allAuctions = [
    ...auctionsMain,
    ...auctionsCar,
    ...auctionsQuality,
    ...auctionsSpecial,
    ...auctionsGeneral,
    ...auctionsBig
  ];

  // تصفية المزادات بناءً على البحث والفئة
  const filteredAuctions = allAuctions.filter(auction => {
    const matchesSearch = auction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         auction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || auction.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', name: 'جميع الفئات', icon: Store, count: allAuctions.length },
    { id: 'main', name: 'الأسواق الرئيسية', icon: Zap, count: auctionsMain.length },
    { id: 'cars', name: 'السيارات', icon: Car, count: auctionsCar.length },
    { id: 'quality', name: 'أسواق نوعية', icon: TrendingUp, count: auctionsQuality.length },
    { id: 'special', name: 'تخصصية', icon: Crown, count: auctionsSpecial.length },
    { id: 'general', name: 'عامة', icon: ShoppingBag, count: auctionsGeneral.length },
    { id: 'big', name: 'السوق الكبير', icon: Store, count: auctionsBig.length },
  ];

  const featuredAuctions = allAuctions.filter(auction => auction.featured);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredAuctions.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredAuctions.length) % featuredAuctions.length);
  };

  const Divider = () => (
    <div className="col-span-full my-12">
      <div className="h-px w-full rounded bg-border/60"></div>
    </div>
  );

  const SectionTitle = ({ title, subtitle, icon: Icon }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="col-span-full mb-8 text-center"
    >
      <div className="flex items-center justify-center gap-3 mb-4">
        {Icon && <Icon className="w-8 h-8 text-primary" />}
        <h2 className="text-3xl font-bold text-foreground">{title}</h2>
      </div>
      {subtitle && (
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
      )}
    </motion.div>
  );

  const CategoryFilter = () => (
    <div className="flex flex-wrap gap-3 mb-8 justify-center">
      {categories.map((category) => {
        const Icon = category.icon;
        return (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-300 ${
              selectedCategory === category.id
                ? 'border-primary bg-primary text-primary-foreground shadow-lg'
                : 'border-border bg-secondary text-secondary-foreground hover:border-primary hover:text-foreground hover:shadow-md'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{category.name}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
              selectedCategory === category.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {category.count}
            </span>
          </button>
        );
      })}
    </div>
  );

  const AuctionCard = ({ auction, index }) => {
    const Icon = auction.icon;
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
      >
        <LoadingLink
          href={`/auctions/${auction.slug}`}
          className="group block"
        >
          <div className={`relative overflow-hidden rounded-2xl border ${auction.borderColor} ${auction.bgColor} p-6 transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2 group-hover:border-primary h-full`}>
            {/* Badge للمزادات المميزة */}
            {auction.featured && (
              <div className="absolute top-4 left-4 flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-sm">
                <Star className="w-3 h-3" />
                مميز
              </div>
            )}

            {/* الإحصائيات */}
            <div className="absolute top-4 right-4 flex gap-2">
              {auction.stats.users && (
                <div className="flex items-center gap-1 rounded-lg bg-background/80 px-2 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                  <Users className="w-3 h-3" />
                  {auction.stats.users}
                </div>
              )}
              {auction.stats.rating && (
                <div className="flex items-center gap-1 rounded-lg bg-background/80 px-2 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                  <Star className="w-3 h-3 text-amber-400" />
                  {auction.stats.rating}
                </div>
              )}
            </div>

            {/* المحتوى الرئيسي */}
            <div className="mt-8 text-center">
              <div className={`inline-flex rounded-2xl bg-secondary p-4 shadow-lg mb-4 ${auction.color}`}>
                <Icon size={32} />
              </div>
              
              <h3 className={`text-xl font-bold ${auction.color} mb-3 line-clamp-2`}>
                {auction.name}
              </h3>
              
              <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-3 whitespace-pre-line">
                {auction.description}
              </p>

              {/* زر الدخول */}
              <div className="mt-auto">
                <span className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold rounded-xl bg-primary text-primary-foreground transition-all duration-300 shadow-lg hover:shadow-xl hover:bg-primary/90">
                  ابدأ المزايدة
                  <TrendingUp className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </div>

            {/* تأثير Hover */}
            <div className="absolute inset-0 rounded-2xl bg-foreground/0 transition-all duration-500 group-hover:bg-foreground/5"></div>
          </div>
        </LoadingLink>
      </motion.div>
    );
  };

  const FeaturedSlider = () => (
    <div className="relative mb-16 rounded-3xl overflow-hidden bg-card border border-border shadow-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -300 }}
          transition={{ duration: 0.5 }}
          className="relative h-80 md:h-96"
        >
          {featuredAuctions.map((auction, index) => {
            const Icon = auction.icon;
            if (index !== currentSlide) return null;
            
            return (
              <div key={auction.slug} className="absolute inset-0 flex items-center">
                <div className="container mx-auto px-6">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="text-foreground">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-2xl bg-secondary backdrop-blur-sm">
                          <Icon className="w-8 h-8" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold">{auction.name}</h2>
                      </div>
                      <p className="text-lg leading-relaxed text-muted-foreground mb-6">
                        {auction.description}
                      </p>
                      <LoadingLink
                        href={`/auctions/${auction.slug}`}
                        className="inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 font-bold text-primary-foreground transition-all duration-300 shadow-lg hover:bg-primary/90 hover:shadow-xl"
                      >
                        ابدأ المزايدة الآن
                        <TrendingUp className="w-5 h-5" />
                      </LoadingLink>
                    </div>
                    <div className="hidden md:flex justify-center">
                      <div className="flex h-64 w-64 items-center justify-center rounded-3xl border border-border bg-secondary/30 backdrop-blur-sm">
                        <Icon className="w-32 h-32 text-foreground/80" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* عناصر التحكم */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-2xl bg-secondary p-3 text-secondary-foreground transition-all duration-300 hover:bg-secondary/80"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-2xl bg-secondary p-3 text-secondary-foreground transition-all duration-300 hover:bg-secondary/80"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* المؤشرات */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {featuredAuctions.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-3 w-3 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-background">
      {/* الهيدر */}
      <div className="bg-card shadow-lg border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <LoadingLink 
                href="/" 
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <ChevronRight className="w-5 h-5" />
                الرئيسية
              </LoadingLink>
              <div className="h-6 w-px bg-border"></div>
              <h1 className="text-2xl font-bold text-foreground">جميع الأسواق</h1>
            </div>

            {/* شريط البحث */}
            <div className="relative max-w-md w-full">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="ابحث في الأسواق..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 bg-card border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* قسم البطل */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-3xl shadow-2xl p-8 mb-12 text-center text-foreground"
        >
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-3 bg-secondary/20 rounded-2xl px-6 py-3 mb-6">
              <Scale className="w-8 h-8" />
              <h2 className="text-2xl font-bold">منصة المزادات الرقمية</h2>
            </div>
            <p className="text-xl text-muted-foreground leading-relaxed mb-6">
              نلغي لعبة التقييمات الجائرة عبر مزايدة عادلة بسعر بائع مخلي.
              المنافسة تعتمد على العرض والطلب الطبيعي
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="flex items-center gap-2 rounded-xl bg-secondary/20 px-4 py-2 text-foreground">
                <Shield className="w-5 h-5" />
                <span>أمان تام</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-secondary/20 px-4 py-2 text-foreground">
                <Clock className="w-5 h-5" />
                <span>مباشر 24/7</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-secondary/20 px-4 py-2 text-foreground">
                <Users className="w-5 h-5" />
                <span>+50K مشترك</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* السلايدر المميز */}
        {featuredAuctions.length > 0 && <FeaturedSlider />}

        {/* فلاتر البحث */}
        <CategoryFilter />

        {/* نتائج البحث */}
        {searchTerm && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-foreground mb-4">
              نتائج البحث عن: "{searchTerm}" ({filteredAuctions.length} نتيجة)
            </h3>
          </div>
        )}

        {/* عرض المزادات */}
        {filteredAuctions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAuctions.map((auction, index) => (
              <AuctionCard key={auction.slug} auction={auction} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">لم نعثر على نتائج</h3>
            <p className="text-muted-foreground">جرب استخدام كلمات بحث مختلفة أو اختر فئة أخرى</p>
          </div>
        )}

        {/* الأقسام الأصلية (للحفاظ على الهيكل) */}
        {!searchTerm && selectedCategory === 'all' && (
          <>
            <Divider />
            
            <SectionTitle 
              title="الأسواق الرئيسية" 
              subtitle="المزادات الأساسية التي تعمل على مدار الساعة"
              icon={Zap}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {auctionsMain.map((auction, index) => (
                <AuctionCard key={auction.slug} auction={auction} index={index} />
              ))}
            </div>

            <Divider />
            
            <SectionTitle 
              title="أسواق السيارات المتنوعة" 
              subtitle="مجموعة واسعة من السيارات بجميع أنواعها"
              icon={Car}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {auctionsCar.map((auction, index) => (
                <AuctionCard key={auction.slug} auction={auction} index={index} />
              ))}
            </div>

            <Divider />
            
            <SectionTitle 
              title="سوق نوعي" 
              subtitle="منتجات ومعدات متخصصة بجودة عالية"
              icon={TrendingUp}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {auctionsQuality.map((auction, index) => (
                <AuctionCard key={auction.slug} auction={auction} index={index} />
              ))}
            </div>

            <Divider />
            
            <SectionTitle 
              title="أسواق تخصصية" 
              subtitle="مزادات فريدة لمنتجات استثنائية"
              icon={Crown}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {auctionsSpecial.map((auction, index) => (
                <AuctionCard key={auction.slug} auction={auction} index={index} />
              ))}
            </div>

            <Divider />
            
            <SectionTitle 
              title="أسواق عامة" 
              subtitle="منتجات متنوعة للاستخدام اليومي"
              icon={ShoppingBag}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {auctionsGeneral.map((auction, index) => (
                <AuctionCard key={auction.slug} auction={auction} index={index} />
              ))}
            </div>

            <Divider />
            
            <SectionTitle 
              title="السوق الكبير" 
              subtitle="المنصة الشاملة لكل ما تحتاجه"
              icon={Store}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {auctionsBig.map((auction, index) => (
                <AuctionCard key={auction.slug} auction={auction} index={index} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
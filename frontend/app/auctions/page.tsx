/**
 * ==================================================
 * ملف: frontend/app/auctions/page.tsx
 * الغرض: صفحة عرض جميع أسواق المزادات
 * ==================================================
 */

"use client";

import { useState } from "react";
import LoadingLink from "@/components/LoadingLink";
import {
  Car,
  Truck,
  Building2,
  Stethoscope,
  Printer,
  Server,
  Leaf,
  Timer,
  BellOff,
  BadgeCheck,
  Video,
  Star,
  Gem,
  Sailboat,
  Home,
  Plane,
  Watch,
  Brush,
  Smartphone,
  Sofa,
  PencilRuler,
  Store,
  ShoppingBag,
  Gift,
  Search,
  ChevronRight,
  Zap,
  Crown,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

type AuctionCategory = "main" | "cars" | "quality" | "special" | "general" | "big";

type AuctionStats = {
  users?: string;
  success?: string;
  items?: string;
  rating?: string;
  shops?: string;
};

type Auction = {
  currentPage?: string;
  name: string;
  slug: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  category: AuctionCategory;
  featured: boolean;
  stats: AuctionStats;
};

type SectionTitleProps = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  subtitlePosition?: "above" | "below";
};

type AuctionCardProps = {
  auction: Auction;
  index: number;
};

export default function AuctionsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const auctionsMain: Auction[] = [
    {
      currentPage: "live_auction",
      name: "الحراج المباشر",
      slug: "auctions-1main/live-market",
      description:
        "بث مباشر للمزايدة مع البائع والمشتري وعملاء المنصة\nيبدأ من 4 عصرا الى 7 مساءا",
      icon: Video,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "main",
      featured: true,
      stats: { users: "2.5K+", success: "98%" },
    },
    {
      currentPage: "instant_auction",
      name: "السوق الفوري المباشر",
      slug: "auctions-1main/instant",
      description:
        "مزادات بنظام المزايدات المفتوحه صعودا وهبوطا بحسب ما يراه المشتري لمصلحته\nيبدأ من 7 مساءا الى 10 مساءا",
      icon: Timer,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "main",
      featured: true,
      stats: { users: "1.8K+", success: "95%" },
    },
    {
      currentPage: "late_auction",
      name: "السوق المتاخر",
      slug: "auctions-1main/silent",
      description:
        "مزاد مكمل للمزاد الفوري ولكن بدون بث ولا يطلع المزايدين الاخرين على عروض بعض\nيبدأ من 10 مساءا الى 4 عصرا اليوم التالي",
      icon: BellOff,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "main",
      featured: true,
      stats: { users: "1.2K+", success: "92%" },
    },
    {
      currentPage: "fixed_auction",
      name: "السوق الثابت",
      slug: "auctions-1main/fixed",
      description: "فرصتك الأخيرة لصفقات سريعة. أعلى سعر يفوز عند انتهاء الوقت.",
      icon: Timer,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "main",
      featured: true,
      stats: { users: "1.2K+", success: "92%" },
    },
  ];

  const auctionsCar: Auction[] = [
    {
      name: "سوق السيارات الفارهة",
      slug: "auctions-2car/luxuryCars",
      description: "سيارات فارهة مميزة بأسعار منافسة",
      icon: Car,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "cars",
      featured: false,
      stats: { items: "500+", rating: "4.8" },
    },
    {
      name: "سوق السيارات الكلاسيكية",
      slug: "auctions-2car/classic",
      description: "سيارات كلاسيكية نادرة وقطع مميزة للهواة والمقتنين",
      icon: Car,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "cars",
      featured: false,
      stats: { items: "150+", rating: "4.9" },
    },
    {
      name: "سوق الكرافانات",
      slug: "auctions-2car/caravan",
      description: "كرافانات ومنازل متنقلة لمحبي السفر والرحلات",
      icon: Home,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "cars",
      featured: false,
      stats: { items: "80+", rating: "4.7" },
    },
    {
      name: "سوق الشاحنات",
      slug: "auctions-2car/trucks",
      description: "شاحنات ومعدات ثقيلة بحالة تشغيل ممتازة",
      icon: Truck,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "cars",
      featured: false,
      stats: { items: "300+", rating: "4.6" },
    },
    {
      name: "سوق الحافلات",
      slug: "auctions-2car/buses",
      description: "حافلات نقل ركاب بمواصفات متنوعة وحالة ممتازة",
      icon: Car,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "cars",
      featured: false,
      stats: { items: "150+", rating: "4.5" },
    },
    {
      name: "سوق vip",
      slug: "auctions-2car/companiesCars",
      description: "سيارات شركات بأسعار تصفية مخزون",
      icon: Building2,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "cars",
      featured: false,
      stats: { items: "400+", rating: "4.5" },
    },
  ];

  const auctionsQuality: Auction[] = [
    {
      name: "الأجهزة الطبية المستعملة",
      slug: "auctions-3quality/medical",
      description: "أجهزة ومعدات طبية مستعملة بحالة جيدة",
      icon: Stethoscope,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "quality",
      featured: false,
      stats: { items: "120+", rating: "4.7" },
    },
    {
      name: "الآلات المكتبية المستعملة",
      slug: "auctions-3quality/office-equipment",
      description:
        "معدات مكتبية مثل آلات تصوير متوسطة وكبيرة الحجم وأجهزة إلكترونية بأسعار تنافسية",
      icon: Printer,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "quality",
      featured: false,
      stats: { items: "250+", rating: "4.6" },
    },
    {
      name: "السيرفرات المستعملة",
      slug: "auctions-3quality/used-servers",
      description: "سيرفرات وأجهزة تخزين وشبكات بمواصفات جيدة",
      icon: Server,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "quality",
      featured: false,
      stats: { items: "80+", rating: "4.8" },
    },
  ];

  const auctionsSpecial: Auction[] = [
    {
      name: "المجوهرات والحلي الثمينة",
      slug: "auctions-4special/jewelry",
      description: "مجوهرات وحلي ثمينة متنوعة بتشكيلات راقية وجودة عالية",
      icon: Gem,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "special",
      featured: true,
      stats: { items: "1K+", rating: "4.9" },
    },
    {
      name: "القطع النادرة",
      slug: "auctions-4special/heritage",
      description: "مزاد للتحف النادرة والقطع الثمينة والمجوهرات القديمة",
      icon: Star,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "special",
      featured: true,
      stats: { items: "500+", rating: "4.9" },
    },
    {
      name: "مزادات VIP الخاصة",
      slug: "auctions-4special/executive",
      description: "مزادات خاصة تنفيذية لإدارات ومؤسسات محددة",
      icon: BadgeCheck,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "special",
      featured: true,
      stats: { users: "VIP", rating: "5.0" },
    },
    {
      name: "اللوحات الفنية",
      slug: "auctions-4special/artworks",
      description: "لوحات فنية أصلية ومميزة لفنانين معروفين",
      icon: Brush,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "special",
      featured: false,
      stats: { items: "200+", rating: "4.8" },
    },
    {
      name: "الساعات الفاخرة",
      slug: "auctions-4special/watches",
      description: "ساعات فاخرة ونادرة من ماركات عالمية",
      icon: Watch,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "special",
      featured: false,
      stats: { items: "150+", rating: "4.9" },
    },
    {
      name: "العقارات المميزة",
      slug: "auctions-4special/realstate",
      description: "عقارات ومنازل وفلل فاخرة في مواقع مميزة",
      icon: Home,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "special",
      featured: false,
      stats: { items: "100+", rating: "4.7" },
    },
    {
      name: "الطائرات الخاصة",
      slug: "auctions-4special/jets",
      description: "طائرات مستعملة بحالة جيدة ومعدلات جيدة للتنزه والصيد",
      icon: Plane,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "special",
      featured: false,
      stats: { items: "25+", rating: "4.9" },
    },
    {
      name: "اليخوت والقوارب",
      slug: "auctions-4special/yachts",
      description: "يخوت وقوارب تنزه وصيد بمختلف المواصفات والموديلات",
      icon: Sailboat,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "special",
      featured: false,
      stats: { items: "50+", rating: "4.8" },
    },
  ];

  const auctionsGeneral: Auction[] = [
    {
      name: "الأجهزة الإلكترونية",
      slug: "auctions-5general/electronics",
      description: "أجهزة إلكترونية متنوعة من هواتف وأجهزة لوحية وحواسيب",
      icon: Smartphone,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "general",
      featured: false,
      stats: { items: "2K+", rating: "4.6" },
    },
    {
      name: "الأثاث المنزلي",
      slug: "auctions-5general/furniture",
      description: "أثاث منزلي ومكتبي متنوع بحالة جيدة",
      icon: Sofa,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "general",
      featured: false,
      stats: { items: "1.5K+", rating: "4.5" },
    },
    {
      name: "المعدات العامة",
      slug: "auctions-5general/equipment",
      description: "معدات وأدوات للاستخدامات المتنوعة",
      icon: PencilRuler,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "general",
      featured: false,
      stats: { items: "800+", rating: "4.4" },
    },
    {
      name: "السوق الأخضر",
      slug: "auctions-5general/green",
      description: "منتجات صديقة للبيئة وتدعم الاستدامة",
      icon: Leaf,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "general",
      featured: false,
      stats: { items: "300+", rating: "4.7" },
    },
  ];

  const auctionsBig: Auction[] = [
    {
      name: "السوق الشامل",
      slug: "auctions-6big",
      description: "المنصة الوطنية الأولى للمزادات في المملكة العربية السعودية",
      icon: Store,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "big",
      featured: true,
      stats: { items: "10K+", rating: "4.8" },
    },
    {
      name: "عروض وتخفيضات حصرية",
      slug: "auctions-6big/offers",
      description: "تخفيضات وعروض مميزة على منتجات متنوعة",
      icon: Gift,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "big",
      featured: false,
      stats: { items: "5K+", rating: "4.7" },
    },
    {
      name: "متاجر تسوق محلية",
      slug: "auctions-6big/local-shops",
      description: "متاجر محلية ومنتجات متنوعة بأسعار تنافسية",
      icon: ShoppingBag,
      color: "text-primary",
      bgColor: "bg-card",
      borderColor: "border-border",
      category: "big",
      featured: false,
      stats: { shops: "200+", rating: "4.6" },
    },
  ];

  const Divider = () => (
    <div className="col-span-full my-10">
      <div className="h-px w-full rounded bg-border/60" />
    </div>
  );

  const SectionTitle = ({
    title,
    subtitle,
    icon: Icon,
    subtitlePosition = "below",
  }: SectionTitleProps) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="col-span-full mb-6 text-center"
    >
      {subtitle && subtitlePosition === "above" && (
        <p className="text-sm md:text-base text-muted-foreground max-w-3xl mx-auto mb-3 leading-relaxed">
          {subtitle}
        </p>
      )}

      <div className="flex items-center justify-center gap-3 mb-2">
        {Icon && <Icon className="w-7 h-7 text-primary" />}
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          {title}
        </h2>
      </div>

      {subtitle && subtitlePosition === "below" && (
        <p className="text-sm md:text-base text-muted-foreground max-w-3xl mx-auto mt-2 leading-relaxed">
          {subtitle}
        </p>
      )}
    </motion.div>
  );

  const AuctionCard = ({ auction, index }: AuctionCardProps) => {
    const Icon = auction.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.08 }}
      >
        <LoadingLink href={`/auctions/${auction.slug}`} className="group block">
          <div
            className={`relative overflow-hidden rounded-2xl border ${auction.borderColor} ${auction.bgColor} p-5 transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2 group-hover:border-primary h-full`}
          >
            {/* ✅ تم حذف بادج "مميز" بالكامل */}

            {/* الإحصائيات */}
            <div className="absolute top-3 right-3 flex gap-2">
              {auction.stats.users && (
                <div className="flex items-center gap-1 rounded-lg bg-background/80 px-2 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                  <Users className="w-3 h-3" />
                  {auction.stats.users}
                </div>
              )}
              {auction.stats.items && (
                <div className="flex items-center gap-1 rounded-lg bg-background/80 px-2 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                  <Store className="w-3 h-3" />
                  {auction.stats.items}
                </div>
              )}
              {auction.stats.rating && (
                <div className="flex items-center gap-1 rounded-lg bg-background/80 px-2 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                  <Star className="w-3 h-3" />
                  {auction.stats.rating}
                </div>
              )}
            </div>

            {/* المحتوى الرئيسي */}
            <div className="mt-8 text-center">
              <div
                className={`inline-flex rounded-2xl bg-secondary p-3 shadow-lg mb-3 ${auction.color}`}
              >
                <Icon size={28} />
              </div>

              <h3
                className={`text-lg md:text-xl font-bold ${auction.color} mb-2 line-clamp-2`}
              >
                {auction.name}
              </h3>

              <p className="text-muted-foreground text-sm leading-relaxed mb-5 line-clamp-3 whitespace-pre-line">
                {auction.description}
              </p>

              {/* زر الدخول */}
              <div className="mt-auto">
                <span className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-primary text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:bg-primary/90">
                  ابدأ المزايدة
                  <TrendingUp className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </div>

            {/* تأثير Hover */}
            <div className="absolute inset-0 rounded-2xl bg-foreground/0 transition-all duration-500 group-hover:bg-foreground/5" />
          </div>
        </LoadingLink>
      </motion.div>
    );
  };

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
              <div className="h-6 w-px bg-border" />
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
        <>
          <Divider />

          <SectionTitle
            title="الأسواق الرئيسية"
            subtitle="أسواق تلغي لعبة التقييمات الجائرة عبر مزايدة عادلة بسعر بائع مخفي؛ المنافسة تعتمد على العرض والطلب الطبيعي."
            icon={Zap}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {auctionsMain.map((auction, index) => (
              <AuctionCard key={auction.slug} auction={auction} index={index} />
            ))}
          </div>

          <Divider />

          <SectionTitle title="أسواق السيارات المتخصص" icon={Car} />

          {/* ✅ المطلوب: 3 فوق و3 تحت (لأن عددها 6) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {auctionsGeneral.map((auction, index) => (
              <AuctionCard key={auction.slug} auction={auction} index={index} />
            ))}
          </div>

          <Divider />

          <SectionTitle title="السوق الكبير" subtitle="المنصة الشاملة لكل ما تحتاجه" icon={Store} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {auctionsBig.map((auction, index) => (
              <AuctionCard key={auction.slug} auction={auction} index={index} />
            ))}
          </div>
        </>
      </div>
    </main>
  );
}

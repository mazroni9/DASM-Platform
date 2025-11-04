'use client';

import LoadingLink from "@/components/LoadingLink";
import {
  Timer,
  BellOff,
  Video,
  Tv,
  ArrowUpDown,
  Eye,
  Settings,
  ExternalLink,
  ChevronRight,
  Shield,
  Users,
  Clock,
  Play,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AuctionsFinished from "@components/AuctionsFinished"; // تأكد من المسار

// (ملاحظة): تمت إزالة `export const metadata` لأن الملف "use client". ضع الميتاداتا في ملف Server مثل `layout.tsx` أو `page.tsx` بدون directive.

// =====================
// الأنواع والبيانات
// =====================
import type { LucideIcon } from "lucide-react";

type AuctionId = "live_auction" | "instant_auction" | "late_auction";

type AuctionMain = {
  id: AuctionId;
  name: string;
  slug: "live-market" | "instant" | "silent";
  href: string; // المسار النهائي للصفحة
  description: string;
  time: string;
  icon: LucideIcon;
  accent: string; // لون النص
  ring: string; // لون الإطار
  bgGrad: string; // خلفية البطاقة
  overlayImg?: string; // صورة خلفية اختيارية
  overlayOpacity?: string; // شفافية الخلفية الاختيارية
};

const AUCTIONS_MAIN: AuctionMain[] = [
  {
    id: "live_auction",
    name: "الحراج المباشر",
    slug: "live-market",
    href: "/auctions/auctions-1main/live-market",
    description:
      "بث مباشر للمزايدة مع البائع والمشتري وعملاء المنصة — تجربة تفاعلية وسريعة",
    time: "من الرابعة عصرًا إلى السابعة مساءً",
    icon: Video,
    accent: "text-red-500", // This will be handled by card variant
    ring: "ring-red-600/40", // This will be handled by card variant
    bgGrad: "bg-card",
    overlayImg: "/showroom.jpg",
    overlayOpacity: "opacity-10",
  },
  {
    id: "instant_auction",
    name: "السوق الفوري المباشر",
    slug: "instant",
    href: "/auctions/auctions-1main/instant",
    description:
      "مزايدات مفتوحة صعودًا وهبوطًا وفق مصلحة المشتري، شفافية عالية وإغلاق سريع",
    time: "من السابعة مساءً إلى العاشرة مساءً",
    icon: Timer,
    accent: "text-primary",
    ring: "ring-primary/40",
    bgGrad: "bg-card",
    overlayImg: "/grok auctioneer.jpg",
    overlayOpacity: "opacity-40",
  },
  {
    id: "late_auction",
    name: "السوق المتأخر",
    slug: "silent",
    href: "/auctions/auctions-1main/silent",
    description:
      "مكمل للمزاد الفوري لكن بدون بث، عروض سرّية لا يطلع المزايدون على بعضها",
    time: "من العاشرة مساءً إلى الرابعة عصرًا",
    icon: BellOff,
    accent: "text-secondary",
    ring: "ring-secondary/40",
    bgGrad: "bg-card",
    overlayImg: "/late_auction.jpg",
    overlayOpacity: "opacity-40",
  },
];

// =====================
// مكونات صغيرة
// =====================
const SectionHeader = ({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-8 text-center"
  >
    <div className="flex items-center justify-center gap-3 mb-3">
      {Icon ? (
        <span className="inline-flex p-3 rounded-2xl bg-card/50 backdrop-blur-sm">
          <Icon className="w-6 h-6 text-foreground" aria-hidden="true" />
        </span>
      ) : null}
      <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">
        {title}
      </h1>
    </div>
    {subtitle ? (
      <p className="text-primary max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
    ) : null}
  </motion.div>
);

const StatChip = ({ icon: Icon, label }: { icon: LucideIcon; label: string }) => (
  <div className="inline-flex items-center gap-2 bg-card/50 text-foreground px-3 py-1.5 rounded-xl backdrop-blur-sm border border-border">
    <Icon className="w-4 h-4" aria-hidden="true" />
    <span className="text-sm font-medium">{label}</span>
  </div>
);

const PresenterPanel = ({
  current,
  onClose,
  onSelect,
}: {
  current: string;
  onClose: () => void;
  onSelect: (slug: string) => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="mb-8 p-5 bg-card text-foreground rounded-2xl shadow-2xl border border-border"
      role="region"
      aria-label="لوحة تحكم المعلق"
    >
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold">شاشة المعلق - لوحة التحكم</h2>
        <button
          onClick={onClose}
          className="p-2 bg-background/50 hover:bg-border rounded-xl border border-border"
          title="إغلاق لوحة التحكم"
          aria-label="إغلاق لوحة التحكم"
        >
          <Settings className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-background/60 p-4 rounded-xl border border-border">
          <h3 className="font-semibold mb-3 text-foreground/80">المزاد الحالي</h3>
          <select
            value={current}
            onChange={(e) => onSelect(e.target.value)}
            className="w-full p-2 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            title="اختيار المزاد الحالي"
            aria-label="اختيار المزاد الحالي"
          >
            <option value="">اختر المزاد</option>
            {AUCTIONS_MAIN.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-background/60 p-4 rounded-xl border border-border">
          <h3 className="font-semibold mb-3 text-foreground/80">عرض البيانات</h3>
          <div className="flex gap-2">
            <button className="flex-1 p-2 rounded-xl bg-primary hover:bg-primary/90 transition-colors">
              <ArrowUpDown className="h-4 w-4 mx-auto" aria-hidden="true" />
              <span className="text-xs">جدول المزاد</span>
            </button>
            <button className="flex-1 p-2 rounded-xl bg-secondary hover:bg-secondary/90 transition-colors">
              <Eye className="h-4 w-4 mx-auto" aria-hidden="true" />
              <span className="text-xs">تفاصيل السلعة</span>
            </button>
          </div>
        </div>

        <div className="bg-background/60 p-4 rounded-xl border border-border">
          <h3 className="font-semibold mb-3 text-foreground/80">روابط سريعة</h3>
          {current ? (
            <LoadingLink
              href={`/auctions/auctions-1main/${current}`}
              target="_blank"
              className="flex items-center justify-center gap-2 p-2 bg-primary hover:bg-primary/90 rounded-xl text-sm font-medium"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              <span>فتح في نافذة جديدة</span>
            </LoadingLink>
          ) : (
            <p className="text-foreground/70 text-sm">اختر مزادًا لعرض الرابط</p>
          )}
        </div>
      </div>

      <div className="bg-background/60 p-4 rounded-xl border border-border mt-4">
        <h3 className="font-semibold mb-3 text-foreground/80">معاينة البث</h3>
        <div className="aspect-video bg-black/80 rounded-xl flex items-center justify-center text-foreground/50 border border-border">
          {current ? (
            <iframe
              className="w-full h-full rounded-xl"
              src="https://www.youtube.com/embed/live_stream?channel=UCxiLyu5z-T0FanDNotwTJcg&autoplay=0"
              title="معاينة البث المباشر"
              allowFullScreen
            />
          ) : (
            <div className="text-center py-10">
              <Tv className="h-10 w-10 mx-auto mb-2" aria-hidden="true" />
              <p>يرجى اختيار المزاد لعرض البث</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const AuctionCard = ({ auction, index }: { auction: AuctionMain; index: number }) => {
  const Icon = auction.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      className="group relative h-full"
    >
      <LoadingLink
        href={auction.href}
        className={`block h-full rounded-2xl border border-border ${auction.bgGrad} ring-1 ${auction.ring} overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-white/50`}
        aria-label={`الدخول إلى ${auction.name}`}
      >
        {/* خلفية صورة اختيارية */}
        {auction.overlayImg ? (
          <div
            className={`absolute inset-0 bg-center bg-no-repeat bg-contain pointer-events-none ${auction.overlayOpacity ?? "opacity-20"}`}
            style={{ backgroundImage: `url('${auction.overlayImg}')` }}
            aria-hidden="true"
          />
        ) : null}

        {/* محتوى */}
        <div className="relative z-10 p-5 lg:p-6 flex flex-col h-full">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className={`p-3 rounded-2xl bg-card/50 backdrop-blur-sm`}>
              <Icon className={`w-6 h-6 ${auction.accent}`} aria-hidden="true" />
            </span>
            <h3 className={`text-xl font-bold ${auction.accent}`}>{auction.name}</h3>
          </div>
          <p className="text-foreground/80 text-sm leading-relaxed text-center mb-3">
            {auction.description}
          </p>
          <div className="flex items-center justify-center gap-2 text-foreground/90 text-sm mb-4">
            <Clock className="w-4 h-4" aria-hidden="true" />
            <span>{auction.time}</span>
          </div>

          {/* فيديو صغير للحراج المباشر */}
          {auction.slug === "live-market" ? (
            <div className="w-full max-w-[220px] mx-auto mb-4">
              <video
                className="w-full rounded-xl border border-border"
                poster="/showroom.jpg"
                muted
                loop
                autoPlay
                playsInline
                preload="metadata"
              >
                <source src="/live-auction.mp4" type="video/mp4" />
                متصفحك لا يدعم عنصر الفيديو.
              </video>
            </div>
          ) : null}

          <div className="mt-auto text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card/50 text-foreground text-sm font-semibold border border-border group-hover:bg-primary group-hover:border-primary transition-colors">
              ادخل السوق الآن
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>

        {/* تأثير طبقة لمعان */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/0 to-white/10 group-hover:from-white/10 group-hover:to-white/20 transition-all" aria-hidden="true" />
      </LoadingLink>
    </motion.div>
  );
};

// =====================
// الصفحة
// =====================
export default function AuctionsMainPage() {
  const [showPresenter, setShowPresenter] = useState(false);
  const [currentAuction, setCurrentAuction] = useState<string>("");

  const cards = useMemo(() => AUCTIONS_MAIN, []);

  const handlePrevToggle = useCallback(() => setShowPresenter((s) => !s), []);

  return (
    <main className="min-h-screen bg-background" dir="rtl">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_40%),radial-gradient(circle_at_70%_30%,rgba(168,85,247,0.14),transparent_35%)]" aria-hidden="true" />
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2">
                الأسواق الرئيسية الثلاثة
              </h1>
              <p className="text-primary max-w-2xl">
                نلغي لعبة التقييمات الجائرة عبر مزايدة عادلة بسعر بائع مخفي.
                المنافسة تعتمد على العرض والطلب الطبيعي.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevToggle}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg transition-colors"
                aria-pressed={showPresenter}
                aria-label="فتح/إغلاق شاشة المعلق"
              >
                <Tv className="h-5 w-5" aria-hidden="true" />
                شاشة المعلق
              </button>
              <LoadingLink
                href="/auctions"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-card/50 text-foreground hover:bg-border border border-border font-semibold"
              >
                العودة لجميع الأسواق
              </LoadingLink>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <StatChip icon={Shield} label="أمان تام" />
            <StatChip icon={Users} label="+50K مشترك" />
            <StatChip icon={Clock} label="مباشر يوميًا" />
          </div>
        </div>
      </div>

      {/* Presenter Panel */}
      <div className="container mx-auto px-4">
        <AnimatePresence>{showPresenter && (
          <PresenterPanel
            current={currentAuction}
            onClose={() => setShowPresenter(false)}
            onSelect={(slug) => setCurrentAuction(slug)}
          />
        )}</AnimatePresence>
      </div>

      {/* Cards */}
      <div className="container mx-auto px-4 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((a, i) => (
            <AuctionCard key={a.slug} auction={a} index={i} />)
          )}
        </div>

        {/* Finished Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">المزادات المنتهية</h2>
          <div className="rounded-2xl border border-border bg-card/5 p-4">
            <AuctionsFinished />
          </div>
        </div>
      </div>
    </main>
  );
}
